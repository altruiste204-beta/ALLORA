-- ALLORA — Fix create_church and church_members NOT NULL constraints
-- 1. Fix gen_random_bytes(5) error (42883) by using standard PostgreSQL md5/random/clock_timestamp
-- 2. Fix null value in column "id" of church_members (23502) by adding a BEFORE INSERT trigger
--    and dropping any legacy/rogue trigger on public.churches.

BEGIN;

-- A. Trigger to guarantee church_members.id is never null, even if an external caller or trigger omits it.
CREATE OR REPLACE FUNCTION public.trg_fn_church_members_ensure_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.id IS NULL OR trim(NEW.id) = '' THEN
    NEW.id := NEW.church_id::text || '_' || NEW.user_id::text;
  END IF;

  IF NEW.church_name IS NULL OR trim(NEW.church_name) = '' THEN
    SELECT name INTO NEW.church_name FROM public.churches WHERE id = NEW.church_id;
    NEW.church_name := COALESCE(NEW.church_name, 'Église');
  END IF;

  IF NEW.display_name IS NULL OR NEW.email IS NULL THEN
    SELECT COALESCE(NEW.display_name, display_name, 'Membre'), COALESCE(NEW.email, email, '')
    INTO NEW.display_name, NEW.email
    FROM public.profiles WHERE id = NEW.user_id;
    NEW.display_name := COALESCE(NEW.display_name, 'Membre');
    NEW.email := COALESCE(NEW.email, '');
  END IF;

  IF NEW.role IS NULL THEN
    NEW.role := 'MEMBER';
  END IF;

  IF NEW.status IS NULL THEN
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_church_members_defaults ON public.church_members;
CREATE TRIGGER trg_church_members_defaults
BEFORE INSERT ON public.church_members
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_church_members_ensure_defaults();

-- B. Clean up any rogue triggers on public.churches that try to insert incomplete rows into church_members
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'public.churches'::regclass
      AND NOT tgisinternal
      AND tgname NOT LIKE 'RI_ConstraintTrigger%'
      AND tgname NOT IN ('trg_protect_church_sensitive')
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.churches', r.tgname);
  END LOOP;
END $$;

-- C. Replace create_church with standard PostgreSQL functions (no pgcrypto dependency)
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

  -- Generate a non-guessable, unique human-friendly code using standard PostgreSQL functions.
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

COMMIT;
