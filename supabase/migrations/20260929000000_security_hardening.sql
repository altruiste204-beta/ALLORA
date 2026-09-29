
-- ====================================================================
-- ALLORA — POST-MIGRATION SECURITY HARDENING
-- 2026-09-29
-- This migration is intentionally additive/idempotent and closes the
-- security gaps left by the initial backend conversion.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 0. Helper: whether the current authenticated user is active.
-- SECURITY DEFINER avoids recursive RLS evaluation.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND COALESCE(is_deactivated, false) = false
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;

-- Internal flag used only by SECURITY DEFINER procedures/triggers.
CREATE OR REPLACE FUNCTION public._allora_internal()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.allora_internal', true), '') = 'true';
$$;

REVOKE ALL ON FUNCTION public._allora_internal() FROM PUBLIC;

-- Harden the original SECURITY DEFINER helpers against search_path manipulation.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.system_admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_church_leader(p_church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_members
    WHERE church_id = p_church_id
      AND user_id = auth.uid()
      AND status = 'approved'
      AND role IN ('OWNER','ADMIN')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_church_leader(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_church_leader(UUID) TO authenticated;

-- --------------------------------------------------------------------
-- 1. Profile projection: public_profiles is server-maintained.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_visibility TEXT;
BEGIN
  v_visibility := COALESCE(NEW.privacy_settings->>'profileVisibility', 'public');

  INSERT INTO public.public_profiles (
    id, display_name, photo_url, professional_title, profession,
    location, skills, bio, availability, updated_at
  )
  VALUES (
    NEW.id,
    NEW.display_name,
    CASE WHEN v_visibility = 'private' THEN NULL ELSE NEW.photo_url END,
    CASE
      WHEN COALESCE(NEW.privacy_settings->>'professionalInfoVisibility','public') = 'private'
      THEN NULL ELSE NEW.professional_title
    END,
    CASE
      WHEN COALESCE(NEW.privacy_settings->>'professionalInfoVisibility','public') = 'private'
      THEN NULL ELSE NEW.profession
    END,
    CASE
      WHEN COALESCE((NEW.privacy_settings->>'locationVisibility')::boolean, true)
       AND v_visibility <> 'private'
      THEN NEW.location ELSE NULL END,
    CASE
      WHEN COALESCE((NEW.privacy_settings->>'skillsVisibility')::boolean, true)
       AND v_visibility <> 'private'
      THEN COALESCE(NEW.skills, '{}') ELSE '{}' END,
    CASE WHEN v_visibility = 'private' THEN NULL ELSE NEW.bio END,
    CASE WHEN v_visibility = 'private' THEN NULL ELSE NEW.availability END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    photo_url = EXCLUDED.photo_url,
    professional_title = EXCLUDED.professional_title,
    profession = EXCLUDED.profession,
    location = EXCLUDED.location,
    skills = EXCLUDED.skills,
    bio = EXCLUDED.bio,
    availability = EXCLUDED.availability,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_public_profile ON public.profiles;
CREATE TRIGGER trg_sync_public_profile
AFTER INSERT OR UPDATE OF display_name, photo_url, professional_title,
  profession, location, skills, bio, availability, privacy_settings
ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

-- Auth email is authoritative; clients cannot change account identity/status
-- by directly editing profiles.
CREATE OR REPLACE FUNCTION public.protect_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_email TEXT;
BEGIN
  IF public._allora_internal() THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_auth_email FROM auth.users WHERE id = OLD.id;

  NEW.id := OLD.id;
  NEW.email := COALESCE(v_auth_email, OLD.email);
  NEW.status := OLD.status;
  NEW.is_deactivated := OLD.is_deactivated;
  NEW.deactivated_at := OLD.deactivated_at;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile ON public.profiles;
CREATE TRIGGER trg_protect_profile
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile();

-- --------------------------------------------------------------------
-- 2. Secure church creation / join-code lookup / membership lifecycle.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_church(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_cover_image_url TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_denomination TEXT DEFAULT NULL,
  p_founded_year TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_name TEXT;
  v_church_id UUID;
  v_join_code TEXT;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  IF length(trim(COALESCE(p_name,''))) = 0
     OR length(trim(COALESCE(p_city,''))) = 0
     OR length(trim(COALESCE(p_country,''))) = 0 THEN
    RAISE EXCEPTION 'Nom, ville et pays sont obligatoires';
  END IF;

  SELECT email, display_name INTO v_email, v_name
  FROM public.profiles WHERE id = v_uid;

  -- Generate a non-guessable, unique human-friendly code.
  LOOP
    v_join_code := 'ALLORA-' || upper(substr(md5(random()::text || clock_timestamp()::text || v_uid::text), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.church_secrets WHERE join_code = v_join_code
    );
  END LOOP;

  PERFORM set_config('app.allora_internal', 'true', true);

  INSERT INTO public.churches (
    name, description, logo_url, cover_image_url, address, city, country,
    contact_phone, contact_email, website, denomination, founded_year,
    leader_ids, verification_status, created_by
  )
  VALUES (
    trim(p_name), p_description, p_logo_url, p_cover_image_url, p_address,
    trim(p_city), trim(p_country), p_contact_phone, p_contact_email,
    p_website, p_denomination, p_founded_year,
    ARRAY[v_uid::text], 'pending', v_uid
  )
  RETURNING id INTO v_church_id;

  INSERT INTO public.church_secrets(church_id, join_code)
  VALUES (v_church_id, v_join_code);

  INSERT INTO public.church_members (
    id, church_id, user_id, church_name, display_name, email,
    photo_url, role, status
  )
  VALUES (
    v_church_id::text || '_' || v_uid::text,
    v_church_id, v_uid, trim(p_name),
    COALESCE(v_name, 'Responsable'), COALESCE(v_email, ''),
    (SELECT photo_url FROM public.profiles WHERE id = v_uid),
    'OWNER', 'approved'
  )
  ON CONFLICT (church_id, user_id) DO UPDATE SET
    role = 'OWNER',
    status = 'approved',
    church_name = EXCLUDED.church_name,
    display_name = COALESCE(EXCLUDED.display_name, public.church_members.display_name),
    email = COALESCE(EXCLUDED.email, public.church_members.email),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'churchId', v_church_id,
    'joinCode', v_join_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_church(
  TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_church(
  TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_church_by_join_code(p_join_code TEXT)
RETURNS SETOF public.churches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  RETURN QUERY
  SELECT c.*
  FROM public.churches c
  JOIN public.church_secrets s ON s.church_id = c.id
  WHERE s.join_code = upper(trim(p_join_code))
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.find_church_by_join_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_church_by_join_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_to_join_church(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_church public.churches%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_existing public.church_members%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT * INTO v_church FROM public.churches WHERE id = p_church_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Église introuvable'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  SELECT * INTO v_existing
  FROM public.church_members
  WHERE church_id = p_church_id AND user_id = v_uid
  FOR UPDATE;

  IF FOUND AND v_existing.role = 'OWNER' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Vous êtes propriétaire de cette église');
  END IF;

  IF FOUND AND v_existing.status = 'approved' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Vous êtes déjà membre');
  END IF;

  PERFORM set_config('app.allora_internal', 'true', true);

  INSERT INTO public.church_members (
    id, church_id, user_id, church_name, display_name, email, photo_url,
    role, status, joined_at, updated_at
  )
  VALUES (
    p_church_id::text || '_' || v_uid::text,
    p_church_id, v_uid, v_church.name,
    COALESCE(v_profile.display_name, 'Membre ALLORA'),
    COALESCE(v_profile.email, ''), v_profile.photo_url,
    'MEMBER', 'pending', COALESCE(v_existing.joined_at, NOW()), NOW()
  )
  ON CONFLICT (church_id, user_id) DO UPDATE SET
    church_name = EXCLUDED.church_name,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    photo_url = EXCLUDED.photo_url,
    role = CASE WHEN public.church_members.role = 'OWNER' THEN 'OWNER' ELSE 'MEMBER' END,
    status = CASE WHEN public.church_members.role = 'OWNER' THEN 'approved' ELSE 'pending' END,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'message', 'Demande envoyée');
END;
$$;

REVOKE ALL ON FUNCTION public.request_to_join_church(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_to_join_church(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_church_member(
  p_membership_id TEXT,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_target public.church_members%ROWTYPE;
  v_actor_role TEXT;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentification requise'; END IF;

  SELECT * INTO v_target FROM public.church_members WHERE id = p_membership_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membre introuvable'; END IF;

  SELECT role INTO v_actor_role
  FROM public.church_members
  WHERE church_id = v_target.church_id
    AND user_id = v_uid
    AND status = 'approved';

  IF v_actor_role NOT IN ('OWNER','ADMIN') THEN
    RAISE EXCEPTION 'Droits insuffisants';
  END IF;

  IF v_target.role = 'OWNER' THEN
    IF p_role IS NOT NULL AND p_role <> 'OWNER' THEN
      RAISE EXCEPTION 'Le propriétaire ne peut pas être rétrogradé';
    END IF;
    IF p_status IS NOT NULL AND p_status <> 'approved' THEN
      RAISE EXCEPTION 'Le propriétaire ne peut pas être retiré';
    END IF;
  END IF;

  IF p_role IS NOT NULL AND p_role <> v_target.role AND v_actor_role <> 'OWNER' THEN
    RAISE EXCEPTION 'Seul le propriétaire peut modifier les rôles';
  END IF;

  PERFORM set_config('app.allora_internal', 'true', true);

  UPDATE public.church_members
  SET role = COALESCE(p_role, role),
      status = COALESCE(p_status, status),
      updated_at = NOW()
  WHERE id = p_membership_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_church_member(TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_church_member(TEXT,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_church(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentification requise'; END IF;

  SELECT role INTO v_role FROM public.church_members
  WHERE church_id = p_church_id AND user_id = v_uid AND status = 'approved'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Vous n''êtes pas membre actif'; END IF;
  IF v_role = 'OWNER' THEN RAISE EXCEPTION 'Le propriétaire doit transférer la propriété avant de quitter'; END IF;

  PERFORM set_config('app.allora_internal', 'true', true);
  UPDATE public.church_members SET status='left', updated_at=NOW()
  WHERE church_id=p_church_id AND user_id=v_uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_church(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_church(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_church_join_code(p_church_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.join_code
  FROM public.church_secrets s
  JOIN public.church_members m ON m.church_id = s.church_id
  WHERE s.church_id = p_church_id
    AND m.user_id = auth.uid()
    AND m.status = 'approved'
    AND m.role IN ('OWNER','ADMIN')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_church_join_code(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_church_join_code(UUID) TO authenticated;

-- Existing leader_ids becomes a compatibility cache; it cannot be edited by clients.
CREATE OR REPLACE FUNCTION public.sync_church_leaders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_church_id UUID;
BEGIN
  v_church_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.church_id ELSE NEW.church_id END;

  UPDATE public.churches
  SET leader_ids = (
    SELECT COALESCE(array_agg(user_id::text ORDER BY user_id::text), '{}')
    FROM public.church_members
    WHERE church_id = v_church_id
      AND status='approved'
      AND role IN ('OWNER','ADMIN')
  ),
  updated_at = NOW()
  WHERE id = v_church_id;

  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_church_leaders ON public.church_members;
CREATE TRIGGER trg_sync_church_leaders
AFTER INSERT OR UPDATE OF role, status OR DELETE ON public.church_members
FOR EACH ROW EXECUTE FUNCTION public.sync_church_leaders();

-- Harden the join-code RPC defined by the initial migration.
CREATE OR REPLACE FUNCTION public.join_church_with_code(p_church_id UUID, p_join_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_church_name TEXT;
  v_valid BOOLEAN;
  v_profile public.profiles%ROWTYPE;
  v_existing public.church_members%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT c.name, (s.join_code = upper(trim(p_join_code)))
  INTO v_church_name, v_valid
  FROM public.churches c
  JOIN public.church_secrets s ON s.church_id=c.id
  WHERE c.id=p_church_id;

  IF NOT FOUND OR NOT COALESCE(v_valid,false) THEN
    RAISE EXCEPTION 'Code d''adhésion invalide pour cette église';
  END IF;

  SELECT * INTO v_existing
  FROM public.church_members
  WHERE church_id=p_church_id AND user_id=v_uid
  FOR UPDATE;

  IF FOUND AND v_existing.role='OWNER' THEN
    RETURN jsonb_build_object('success',true,'message','Vous êtes propriétaire de cette église');
  END IF;

  IF FOUND AND v_existing.status='approved' THEN
    RETURN jsonb_build_object('success',true,'message','Vous êtes déjà membre actif de cette église');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id=v_uid;
  PERFORM set_config('app.allora_internal','true',true);

  INSERT INTO public.church_members (
    id, church_id, user_id, church_name, display_name, email, photo_url,
    role, status, joined_at, updated_at
  )
  VALUES (
    p_church_id::text || '_' || v_uid::text,
    p_church_id, v_uid, v_church_name,
    COALESCE(v_profile.display_name,'Membre ALLORA'),
    COALESCE(v_profile.email,''), v_profile.photo_url,
    'MEMBER','approved',COALESCE(v_existing.joined_at,NOW()),NOW()
  )
  ON CONFLICT (church_id,user_id) DO UPDATE SET
    church_name=EXCLUDED.church_name,
    display_name=EXCLUDED.display_name,
    email=EXCLUDED.email,
    photo_url=EXCLUDED.photo_url,
    role=CASE WHEN public.church_members.role='OWNER' THEN 'OWNER' ELSE 'MEMBER' END,
    status=CASE WHEN public.church_members.role='OWNER' THEN 'approved' ELSE 'approved' END,
    updated_at=NOW();

  INSERT INTO public.notifications(user_id,title,body,church_id,church_name,type)
  VALUES (
    v_uid,'Bienvenue dans la communauté',
    'Vous avez rejoint ' || v_church_name || ' avec succès.',
    p_church_id,v_church_name,'membership_approved'
  );

  RETURN jsonb_build_object('success',true,'churchId',p_church_id,'churchName',v_church_name);
END;
$$;

REVOKE ALL ON FUNCTION public.join_church_with_code(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_church_with_code(UUID,TEXT) TO authenticated;

-- --------------------------------------------------------------------
-- 3. Event registration: direct participant writes are forbidden.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_event_registration(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_part public.event_participants%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentification requise'; END IF;

  SELECT * INTO v_part FROM public.event_participants
  WHERE event_id=p_event_id AND user_id=v_uid FOR UPDATE;

  IF NOT FOUND OR v_part.status <> 'registered' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Aucune inscription active');
  END IF;

  PERFORM set_config('app.allora_internal', 'true', true);
  UPDATE public.event_participants SET status='cancelled', updated_at=NOW()
  WHERE id=v_part.id;

  UPDATE public.events
  SET registered_count = GREATEST(0, registered_count - 1), updated_at=NOW()
  WHERE id=p_event_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_event_registration(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_event_registration(UUID) TO authenticated;

-- Replace the old registration procedure with an idempotent, locked version.
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_event public.events%ROWTYPE;
  v_existing public.event_participants%ROWTYPE;
  v_name TEXT;
  v_email TEXT;
  v_count INT;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentification requise'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Événement introuvable'; END IF;
  IF v_event.status <> 'published' THEN RAISE EXCEPTION 'Les inscriptions ne sont pas ouvertes'; END IF;
  IF v_event.start_at <= NOW() THEN RAISE EXCEPTION 'Cet événement est déjà commencé'; END IF;

  SELECT * INTO v_existing FROM public.event_participants
  WHERE event_id=p_event_id AND user_id=v_uid FOR UPDATE;

  IF FOUND AND v_existing.status IN ('registered','attended') THEN
    RETURN jsonb_build_object('success', true, 'message', 'Vous êtes déjà inscrit', 'registeredCount', v_event.registered_count);
  END IF;

  SELECT display_name,email INTO v_name,v_email FROM public.profiles WHERE id=v_uid;

  SELECT COUNT(*)::INT INTO v_count
  FROM public.event_participants
  WHERE event_id=p_event_id AND status='registered';

  IF v_event.capacity IS NOT NULL AND v_count >= v_event.capacity THEN
    RAISE EXCEPTION 'Capacité maximale atteinte';
  END IF;

  PERFORM set_config('app.allora_internal', 'true', true);

  INSERT INTO public.event_participants(id,event_id,user_id,display_name,email,status,created_at,updated_at)
  VALUES (
    p_event_id::text || '_' || v_uid::text, p_event_id, v_uid,
    COALESCE(v_name,'Participant'), COALESCE(v_email,''), 'registered',
    COALESCE(v_existing.created_at,NOW()), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET status='registered', updated_at=NOW();

  UPDATE public.events
  SET registered_count = v_count + 1, updated_at=NOW()
  WHERE id=p_event_id;

  RETURN jsonb_build_object('success',true,'eventId',p_event_id,'registeredCount',v_count+1);
END;
$$;

REVOKE ALL ON FUNCTION public.register_for_event(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_event(UUID) TO authenticated;

-- --------------------------------------------------------------------
-- 4. Community reaction/comment counters are server controlled.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(p_post_id UUID, p_reaction TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_post public.posts%ROWTYPE;
  v_users JSONB;
  v_reactions JSONB;
  v_arr TEXT[];
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF p_reaction IS NULL OR length(trim(p_reaction)) = 0 OR length(p_reaction) > 32 THEN
    RAISE EXCEPTION 'Réaction invalide';
  END IF;

  SELECT * INTO v_post FROM public.posts WHERE id=p_post_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Publication introuvable'; END IF;

  v_reactions := COALESCE(v_post.reactions,'{}'::jsonb);
  v_users := COALESCE(v_reactions -> trim(p_reaction), '[]'::jsonb);
  SELECT COALESCE(array_agg(x), '{}') INTO v_arr
  FROM jsonb_array_elements_text(v_users) AS t(x);

  IF v_uid::text = ANY(v_arr) THEN
    v_arr := array_remove(v_arr, v_uid::text);
  ELSE
    v_arr := array_append(v_arr, v_uid::text);
  END IF;

  IF cardinality(v_arr) = 0 THEN
    v_reactions := v_reactions - trim(p_reaction);
  ELSE
    v_reactions := jsonb_set(v_reactions, ARRAY[trim(p_reaction)], to_jsonb(v_arr), true);
  END IF;

  PERFORM set_config('app.allora_internal','true',true);
  UPDATE public.posts SET reactions=v_reactions, updated_at=NOW() WHERE id=p_post_id;

  RETURN jsonb_build_object('success',true,'reactions',v_reactions);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_post_reaction(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_post_reaction(UUID,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.allora_internal','true',true);
  IF TG_OP='INSERT' THEN
    UPDATE public.posts SET comment_count=comment_count+1, updated_at=NOW() WHERE id=NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP='DELETE' THEN
    UPDATE public.posts SET comment_count=GREATEST(0,comment_count-1), updated_at=NOW() WHERE id=OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_comment_count ON public.comments;
CREATE TRIGGER trg_sync_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_comment_count();

-- --------------------------------------------------------------------
-- 5. Validation triggers for relational ownership/invariants.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_need_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_need public.needs%ROWTYPE; v_resource public.resources%ROWTYPE;
BEGIN
  SELECT * INTO v_need FROM public.needs WHERE id=NEW.need_id;
  IF NOT FOUND OR v_need.created_by <> NEW.need_author_id THEN
    RAISE EXCEPTION 'Besoin invalide';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT public._allora_internal() AND auth.uid() <> NEW.responder_id THEN
    RAISE EXCEPTION 'Identité du répondant invalide';
  END IF;
  IF NEW.resource_id IS NOT NULL THEN
    SELECT * INTO v_resource FROM public.resources WHERE id=NEW.resource_id;
    IF NOT FOUND OR v_resource.owner_id <> NEW.responder_id THEN
      RAISE EXCEPTION 'Ressource invalide';
    END IF;
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.need_id<>OLD.need_id OR NEW.need_author_id<>OLD.need_author_id OR NEW.responder_id<>OLD.responder_id THEN
      RAISE EXCEPTION 'Identité de réponse immuable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_need_response ON public.need_responses;
CREATE TRIGGER trg_validate_need_response
BEFORE INSERT OR UPDATE ON public.need_responses
FOR EACH ROW EXECUTE FUNCTION public.validate_need_response();

CREATE OR REPLACE FUNCTION public.validate_collaboration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_need public.needs%ROWTYPE; v_resource public.resources%ROWTYPE;
BEGIN
  SELECT * INTO v_need FROM public.needs WHERE id=NEW.need_id;
  IF NOT FOUND OR v_need.created_by <> NEW.need_owner_id THEN
    RAISE EXCEPTION 'Propriétaire du besoin invalide';
  END IF;

  SELECT * INTO v_resource FROM public.resources WHERE id=NEW.resource_id;
  IF NOT FOUND OR v_resource.owner_id <> NEW.resource_owner_id THEN
    RAISE EXCEPTION 'Propriétaire de la ressource invalide';
  END IF;
  IF NEW.quantity <= 0 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;

  IF TG_OP='INSERT' AND auth.uid() IS NOT NULL AND NOT public._allora_internal()
     AND auth.uid() NOT IN (NEW.need_owner_id, NEW.resource_owner_id) THEN
    RAISE EXCEPTION 'Participant non autorisé';
  END IF;

  IF TG_OP='UPDATE' THEN
    IF NEW.need_id<>OLD.need_id OR NEW.resource_id<>OLD.resource_id
       OR NEW.need_owner_id<>OLD.need_owner_id OR NEW.resource_owner_id<>OLD.resource_owner_id THEN
      RAISE EXCEPTION 'Identité de collaboration immuable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_collaboration ON public.collaborations;
CREATE TRIGGER trg_validate_collaboration
BEFORE INSERT OR UPDATE ON public.collaborations
FOR EACH ROW EXECUTE FUNCTION public.validate_collaboration();

CREATE OR REPLACE FUNCTION public.validate_opportunity_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_opp public.opportunities%ROWTYPE;
BEGIN
  SELECT * INTO v_opp FROM public.opportunities WHERE id=NEW.opportunity_id;
  IF NOT FOUND OR v_opp.author_id <> NEW.opportunity_author_id THEN
    RAISE EXCEPTION 'Opportunité invalide';
  END IF;
  IF TG_OP='INSERT' AND auth.uid() IS NOT NULL AND NOT public._allora_internal()
     AND auth.uid() <> NEW.responder_id THEN
    RAISE EXCEPTION 'Identité du répondant invalide';
  END IF;
  IF TG_OP='UPDATE' AND (NEW.opportunity_id<>OLD.opportunity_id OR NEW.opportunity_author_id<>OLD.opportunity_author_id OR NEW.responder_id<>OLD.responder_id) THEN
    RAISE EXCEPTION 'Identité de réponse immuable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_opportunity_response ON public.opportunity_responses;
CREATE TRIGGER trg_validate_opportunity_response
BEFORE INSERT OR UPDATE ON public.opportunity_responses
FOR EACH ROW EXECUTE FUNCTION public.validate_opportunity_response();

-- Protect counters and ownership fields on direct client updates.
CREATE OR REPLACE FUNCTION public.protect_sensitive_rows()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR public._allora_internal() THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME='churches' THEN
    NEW.id := OLD.id;
    NEW.created_by := OLD.created_by;
    NEW.verification_status := OLD.verification_status;
    NEW.leader_ids := OLD.leader_ids;
    NEW.created_at := OLD.created_at;
  ELSIF TG_TABLE_NAME='events' THEN
    NEW.id := OLD.id;
    NEW.organizer_id := OLD.organizer_id;
    NEW.registered_count := OLD.registered_count;
    NEW.created_at := OLD.created_at;
  ELSIF TG_TABLE_NAME='posts' THEN
    NEW.id := OLD.id;
    NEW.author_id := OLD.author_id;
    NEW.reactions := OLD.reactions;
    NEW.comment_count := OLD.comment_count;
    NEW.created_at := OLD.created_at;
  ELSIF TG_TABLE_NAME='opportunities' THEN
    NEW.id := OLD.id;
    NEW.author_id := OLD.author_id;
    NEW.response_count := OLD.response_count;
    NEW.created_at := OLD.created_at;
  ELSIF TG_TABLE_NAME='church_members' THEN
    NEW.id := OLD.id;
    NEW.church_id := OLD.church_id;
    NEW.user_id := OLD.user_id;
    NEW.joined_at := OLD.joined_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_church_sensitive ON public.churches;
CREATE TRIGGER trg_protect_church_sensitive
BEFORE UPDATE ON public.churches
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_rows();

DROP TRIGGER IF EXISTS trg_protect_event_sensitive ON public.events;
CREATE TRIGGER trg_protect_event_sensitive
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_rows();

DROP TRIGGER IF EXISTS trg_protect_post_sensitive ON public.posts;
CREATE TRIGGER trg_protect_post_sensitive
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_rows();

DROP TRIGGER IF EXISTS trg_protect_opportunity_sensitive ON public.opportunities;
CREATE TRIGGER trg_protect_opportunity_sensitive
BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_rows();

DROP TRIGGER IF EXISTS trg_protect_membership_sensitive ON public.church_members;
CREATE TRIGGER trg_protect_membership_sensitive
BEFORE UPDATE ON public.church_members
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_rows();

-- --------------------------------------------------------------------
-- 6. Account deactivation/reactivation.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_account_deactivated(p_deactivated BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  PERFORM set_config('app.allora_internal','true',true);
  UPDATE public.profiles
  SET status = CASE WHEN p_deactivated THEN 'deactivated' ELSE 'active' END,
      is_deactivated = p_deactivated,
      deactivated_at = CASE WHEN p_deactivated THEN NOW() ELSE NULL END,
      updated_at = NOW()
  WHERE id=v_uid;
  RETURN jsonb_build_object('success',true,'deactivated',p_deactivated);
END;
$$;

REVOKE ALL ON FUNCTION public.set_account_deactivated(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_account_deactivated(BOOLEAN) TO authenticated;

-- --------------------------------------------------------------------
-- 7. Remove all old permissive policies and install final policies.
-- --------------------------------------------------------------------
DO $$
DECLARE p RECORD;
BEGIN
  -- Remove every policy currently defined on the ALLORA public tables.
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN (
        'profiles','public_profiles','system_admins','churches','church_secrets',
        'church_members','needs','need_responses','resources','collaborations',
        'events','event_participants','posts','comments','opportunities',
        'opportunity_responses','contact_requests','notifications','support_tickets'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Profiles
CREATE POLICY allora_profiles_select ON public.profiles
FOR SELECT USING (auth.uid()=id OR public.is_admin());

CREATE POLICY allora_profiles_insert ON public.profiles
FOR INSERT WITH CHECK (auth.uid()=id);

CREATE POLICY allora_profiles_update ON public.profiles
FOR UPDATE USING (auth.uid()=id AND public.is_active_user())
WITH CHECK (auth.uid()=id);

-- Public projection: authenticated active users only, no direct writes.
CREATE POLICY allora_public_profiles_select ON public.public_profiles
FOR SELECT USING (public.is_active_user());

-- System admins are never client-writable.
CREATE POLICY allora_system_admins_select ON public.system_admins
FOR SELECT USING (public.is_admin());

-- Churches
CREATE POLICY allora_churches_select ON public.churches
FOR SELECT USING (public.is_active_user());

CREATE POLICY allora_churches_update ON public.churches
FOR UPDATE USING (public.is_active_user() AND (public.is_church_leader(id) OR public.is_admin()))
WITH CHECK (public.is_active_user() AND (public.is_church_leader(id) OR public.is_admin()));

-- No direct INSERT/DELETE. Use secured server procedure for lifecycle.
CREATE POLICY allora_churches_admin_delete ON public.churches
FOR DELETE USING (public.is_admin());

-- Church secrets: never directly accessible.
CREATE POLICY allora_church_secrets_none ON public.church_secrets
FOR ALL USING (false) WITH CHECK (false);

-- Memberships: read only; lifecycle is via secured procedures.
CREATE POLICY allora_members_select ON public.church_members
FOR SELECT USING (
  public.is_active_user() AND (
    auth.uid()=user_id
    OR public.is_church_leader(church_id)
    OR EXISTS (
      SELECT 1 FROM public.church_members m
      WHERE m.church_id=church_members.church_id
        AND m.user_id=auth.uid()
        AND m.status='approved'
    )
  )
);

-- Needs
CREATE POLICY allora_needs_select ON public.needs
FOR SELECT USING (
  public.is_active_user() AND (
    visibility='public'
    OR created_by=auth.uid()
    OR (visibility='church' AND EXISTS (
      SELECT 1 FROM public.church_members m
      WHERE m.church_id=needs.church_id AND m.user_id=auth.uid() AND m.status='approved'
    ))
  )
);
CREATE POLICY allora_needs_insert ON public.needs
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=created_by);
CREATE POLICY allora_needs_update ON public.needs
FOR UPDATE USING (public.is_active_user() AND auth.uid()=created_by)
WITH CHECK (public.is_active_user() AND auth.uid()=created_by);
CREATE POLICY allora_needs_delete ON public.needs
FOR DELETE USING (public.is_active_user() AND auth.uid()=created_by);

-- Need responses
CREATE POLICY allora_need_responses_select ON public.need_responses
FOR SELECT USING (public.is_active_user() AND (auth.uid()=responder_id OR auth.uid()=need_author_id));
CREATE POLICY allora_need_responses_insert ON public.need_responses
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=responder_id);
CREATE POLICY allora_need_responses_update ON public.need_responses
FOR UPDATE USING (public.is_active_user() AND (auth.uid()=responder_id OR auth.uid()=need_author_id))
WITH CHECK (public.is_active_user());

-- Resources
CREATE POLICY allora_resources_select ON public.resources
FOR SELECT USING (public.is_active_user() AND (status<>'closed' OR owner_id=auth.uid()));
CREATE POLICY allora_resources_insert ON public.resources
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=owner_id);
CREATE POLICY allora_resources_update ON public.resources
FOR UPDATE USING (public.is_active_user() AND auth.uid()=owner_id)
WITH CHECK (public.is_active_user() AND auth.uid()=owner_id);
CREATE POLICY allora_resources_delete ON public.resources
FOR DELETE USING (public.is_active_user() AND auth.uid()=owner_id);

-- Collaborations
CREATE POLICY allora_collaborations_select ON public.collaborations
FOR SELECT USING (public.is_active_user() AND (auth.uid()=need_owner_id OR auth.uid()=resource_owner_id));
CREATE POLICY allora_collaborations_insert ON public.collaborations
FOR INSERT WITH CHECK (public.is_active_user() AND (auth.uid()=need_owner_id OR auth.uid()=resource_owner_id));
CREATE POLICY allora_collaborations_update ON public.collaborations
FOR UPDATE USING (public.is_active_user() AND (auth.uid()=need_owner_id OR auth.uid()=resource_owner_id))
WITH CHECK (public.is_active_user() AND (auth.uid()=need_owner_id OR auth.uid()=resource_owner_id));

-- Events
CREATE POLICY allora_events_select ON public.events
FOR SELECT USING (
  public.is_active_user() AND (
    visibility='public' OR organizer_id=auth.uid()
    OR (visibility='church' AND EXISTS (
      SELECT 1 FROM public.church_members m
      WHERE m.church_id=events.church_id AND m.user_id=auth.uid() AND m.status='approved'
    ))
  )
);
CREATE POLICY allora_events_insert ON public.events
FOR INSERT WITH CHECK (
  public.is_active_user() AND auth.uid()=organizer_id
  AND (organizer_type='user' OR public.is_church_leader(church_id))
);
CREATE POLICY allora_events_update ON public.events
FOR UPDATE USING (public.is_active_user() AND (auth.uid()=organizer_id OR public.is_church_leader(church_id)))
WITH CHECK (public.is_active_user());
CREATE POLICY allora_events_delete ON public.events
FOR DELETE USING (public.is_active_user() AND (auth.uid()=organizer_id OR public.is_church_leader(church_id)));

-- Participants: read only; register/cancel via locked RPCs.
CREATE POLICY allora_event_participants_select ON public.event_participants
FOR SELECT USING (
  public.is_active_user() AND (
    auth.uid()=user_id OR EXISTS (
      SELECT 1 FROM public.events e WHERE e.id=event_id AND e.organizer_id=auth.uid()
    )
  )
);

-- Posts
CREATE POLICY allora_posts_select ON public.posts
FOR SELECT USING (
  public.is_active_user() AND (
    visibility='public' OR author_id=auth.uid()
    OR (visibility='church' AND EXISTS (
      SELECT 1 FROM public.church_members m
      WHERE m.church_id=posts.church_id AND m.user_id=auth.uid() AND m.status='approved'
    ))
  )
);
CREATE POLICY allora_posts_insert ON public.posts
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=author_id);
CREATE POLICY allora_posts_update ON public.posts
FOR UPDATE USING (public.is_active_user() AND auth.uid()=author_id)
WITH CHECK (public.is_active_user() AND auth.uid()=author_id);
CREATE POLICY allora_posts_delete ON public.posts
FOR DELETE USING (public.is_active_user() AND (auth.uid()=author_id OR public.is_church_leader(church_id)));

-- Comments
CREATE POLICY allora_comments_select ON public.comments
FOR SELECT USING (
  public.is_active_user() AND EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id=comments.post_id
      AND (
        p.visibility='public' OR p.author_id=auth.uid()
        OR (p.visibility='church' AND EXISTS (
          SELECT 1 FROM public.church_members m
          WHERE m.church_id=p.church_id AND m.user_id=auth.uid() AND m.status='approved'
        ))
      )
  )
);
CREATE POLICY allora_comments_insert ON public.comments
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=author_id);
CREATE POLICY allora_comments_update ON public.comments
FOR UPDATE USING (public.is_active_user() AND auth.uid()=author_id)
WITH CHECK (public.is_active_user() AND auth.uid()=author_id);
CREATE POLICY allora_comments_delete ON public.comments
FOR DELETE USING (public.is_active_user() AND auth.uid()=author_id);

-- Opportunities
CREATE POLICY allora_opportunities_select ON public.opportunities
FOR SELECT USING (
  public.is_active_user() AND (
    visibility='public' OR author_id=auth.uid()
    OR (visibility='church' AND EXISTS (
      SELECT 1 FROM public.church_members m
      WHERE m.church_id=opportunities.church_id AND m.user_id=auth.uid() AND m.status='approved'
    ))
  )
);
CREATE POLICY allora_opportunities_insert ON public.opportunities
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=author_id);
CREATE POLICY allora_opportunities_update ON public.opportunities
FOR UPDATE USING (public.is_active_user() AND auth.uid()=author_id)
WITH CHECK (public.is_active_user() AND auth.uid()=author_id);
CREATE POLICY allora_opportunities_delete ON public.opportunities
FOR DELETE USING (public.is_active_user() AND auth.uid()=author_id);

-- Opportunity responses
CREATE POLICY allora_opportunity_responses_select ON public.opportunity_responses
FOR SELECT USING (public.is_active_user() AND (auth.uid()=responder_id OR auth.uid()=opportunity_author_id));
CREATE POLICY allora_opportunity_responses_insert ON public.opportunity_responses
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=responder_id);
CREATE POLICY allora_opportunity_responses_update ON public.opportunity_responses
FOR UPDATE USING (public.is_active_user() AND (auth.uid()=responder_id OR auth.uid()=opportunity_author_id))
WITH CHECK (public.is_active_user());

-- Contact requests
CREATE POLICY allora_contact_select ON public.contact_requests
FOR SELECT USING (public.is_active_user() AND (auth.uid()=sender_id OR auth.uid()=recipient_id));
CREATE POLICY allora_contact_insert ON public.contact_requests
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=sender_id AND recipient_id<>auth.uid());
CREATE POLICY allora_contact_update ON public.contact_requests
FOR UPDATE USING (public.is_active_user() AND (auth.uid()=sender_id OR auth.uid()=recipient_id))
WITH CHECK (public.is_active_user());

-- Notifications: server-generated only.
CREATE POLICY allora_notifications_select ON public.notifications
FOR SELECT USING (public.is_active_user() AND auth.uid()=user_id);
CREATE POLICY allora_notifications_update ON public.notifications
FOR UPDATE USING (public.is_active_user() AND auth.uid()=user_id)
WITH CHECK (public.is_active_user() AND auth.uid()=user_id);

-- Support tickets
CREATE POLICY allora_support_select ON public.support_tickets
FOR SELECT USING (public.is_active_user() AND (auth.uid()=user_id OR public.is_admin()));
CREATE POLICY allora_support_insert ON public.support_tickets
FOR INSERT WITH CHECK (public.is_active_user() AND auth.uid()=user_id);
CREATE POLICY allora_support_update ON public.support_tickets
FOR UPDATE USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 8. Required auth trigger (was defined but never attached).
-- --------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recreate the auth trigger function with a fixed search_path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(COALESCE(NEW.email,''), '@', 1),
    'Membre ALLORA'
  );

  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (NEW.id, COALESCE(NEW.email,''), v_display_name, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------
-- 9. Safe deletion cascades for user-owned relational data.
-- --------------------------------------------------------------------
ALTER TABLE public.need_responses
  DROP CONSTRAINT IF EXISTS need_responses_need_author_id_fkey;
ALTER TABLE public.need_responses
  ADD CONSTRAINT need_responses_need_author_id_fkey
  FOREIGN KEY (need_author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.collaborations
  DROP CONSTRAINT IF EXISTS collaborations_need_owner_id_fkey;
ALTER TABLE public.collaborations
  ADD CONSTRAINT collaborations_need_owner_id_fkey
  FOREIGN KEY (need_owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.collaborations
  DROP CONSTRAINT IF EXISTS collaborations_resource_owner_id_fkey;
ALTER TABLE public.collaborations
  ADD CONSTRAINT collaborations_resource_owner_id_fkey
  FOREIGN KEY (resource_owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.opportunity_responses
  DROP CONSTRAINT IF EXISTS opportunity_responses_opportunity_author_id_fkey;
ALTER TABLE public.opportunity_responses
  ADD CONSTRAINT opportunity_responses_opportunity_author_id_fkey
  FOREIGN KEY (opportunity_author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
ALTER TABLE public.events
  ADD CONSTRAINT events_organizer_id_fkey
  FOREIGN KEY (organizer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.churches
  ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.churches
  DROP CONSTRAINT IF EXISTS churches_created_by_fkey;
ALTER TABLE public.churches
  ADD CONSTRAINT churches_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------
-- 10. Prevent deactivated users from using Realtime data.
-- RLS policies above are the authoritative gate; publication is kept
-- enabled for tables already used by the UI.
-- --------------------------------------------------------------------
