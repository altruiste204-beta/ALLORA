-- ====================================================================
-- ALLORA — MIGRATION POSTGRESQL & SUPABASE ROW LEVEL SECURITY (RLS)
-- Phase 8C: Architecture Relationnelle & Zero Trust
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. PROFILES & PUBLIC PROFILES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    professional_title TEXT,
    profession TEXT,
    phone_number TEXT,
    birth_date TEXT,
    cover_photo_url TEXT,
    bio TEXT,
    location TEXT,
    availability TEXT,
    skills TEXT[] DEFAULT '{}',
    services_offered TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    church_ids TEXT[] DEFAULT '{}',
    photo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
    is_deactivated BOOLEAN DEFAULT FALSE,
    deactivated_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{"language": "fr", "theme": "system"}'::jsonb,
    notification_preferences JSONB DEFAULT '{"needs": true, "resources": true, "collaborations": true, "events": true, "community": true, "churches": true, "system": true}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profileVisibility": "public", "locationVisibility": true, "skillsVisibility": true, "activityVisibility": true, "postsVisibility": true, "professionalInfoVisibility": "public", "contactVisibility": "public"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.public_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    professional_title TEXT,
    profession TEXT,
    location TEXT,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    church_name TEXT,
    availability TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Admins (Internal server table, never writable by client)
CREATE TABLE IF NOT EXISTS public.system_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID
);

-- --------------------------------------------------------------------
-- 2. CHURCHES, SECRETS & MEMBERSHIPS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    address TEXT,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    denomination TEXT,
    founded_year TEXT,
    leader_ids TEXT[] DEFAULT '{}',
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SECRETS: Stored separately, ZERO client read/write permission
CREATE TABLE IF NOT EXISTS public.church_secrets (
    church_id UUID PRIMARY KEY REFERENCES public.churches(id) ON DELETE CASCADE,
    join_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.church_members (
    id TEXT PRIMARY KEY, -- format: church_id || '_' || user_id
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    church_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'left', 'removed')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_church_user UNIQUE (church_id, user_id)
);

-- --------------------------------------------------------------------
-- 3. NEEDS & RESPONSES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.needs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    church_name TEXT,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    location JSONB NOT NULL DEFAULT '{"country": "", "city": "", "zone": ""}'::jsonb,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    needed_from TIMESTAMPTZ NOT NULL,
    needed_until TIMESTAMPTZ,
    urgency TEXT NOT NULL CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'church', 'private')),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.need_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    need_id UUID NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
    need_author_id UUID NOT NULL REFERENCES auth.users(id),
    resource_id UUID,
    responder_id UUID NOT NULL REFERENCES auth.users(id),
    responder_name TEXT NOT NULL,
    message TEXT NOT NULL,
    quantity_proposed NUMERIC NOT NULL CHECK (quantity_proposed > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. RESOURCES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_name TEXT,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'church')),
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    church_name TEXT,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('loan', 'donation', 'service', 'volunteer')),
    location JSONB NOT NULL DEFAULT '{"country": "", "city": "", "zone": ""}'::jsonb,
    availability TEXT,
    quantity NUMERIC NOT NULL CHECK (quantity >= 0),
    unit TEXT NOT NULL,
    available_from TIMESTAMPTZ NOT NULL,
    available_until TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'unavailable', 'closed')),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. COLLABORATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    need_id UUID NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    need_owner_id UUID NOT NULL REFERENCES auth.users(id),
    resource_owner_id UUID NOT NULL REFERENCES auth.users(id),
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('draft', 'proposed', 'accepted', 'active', 'completed', 'cancelled', 'rejected', 'archived')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    message TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. EVENTS & PARTICIPANTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    organizer_type TEXT NOT NULL CHECK (organizer_type IN ('user', 'church')),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),
    organizer_name TEXT,
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    church_name TEXT,
    location TEXT NOT NULL,
    image_url TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    capacity INT CHECK (capacity IS NULL OR capacity > 0),
    registered_count INT NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'church', 'private')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_participants (
    id TEXT PRIMARY KEY, -- format: event_id || '_' || user_id
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_participant UNIQUE (event_id, user_id)
);

-- --------------------------------------------------------------------
-- 7. COMMUNITY POSTS & COMMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_photo_url TEXT,
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    church_name TEXT,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    category TEXT NOT NULL CHECK (category IN ('announcement', 'community', 'testimony', 'information', 'opportunity', 'other')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'church', 'private')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
    reactions JSONB DEFAULT '{}'::jsonb,
    comment_count INT NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_photo_url TEXT,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. OPPORTUNITIES & RESPONSES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('service', 'job', 'volunteer', 'skill_request')),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_photo_url TEXT,
    author_title TEXT,
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    church_name TEXT,
    location TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'church', 'private')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
    availability TEXT,
    compensation TEXT,
    response_count INT NOT NULL DEFAULT 0 CHECK (response_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opportunity_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    opportunity_title TEXT,
    opportunity_author_id UUID NOT NULL REFERENCES auth.users(id),
    responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    responder_name TEXT NOT NULL,
    responder_photo_url TEXT,
    responder_title TEXT,
    message TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. CONTACT REQUESTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_photo_url TEXT,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name TEXT,
    message TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'read', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. NOTIFICATIONS & SUPPORT TICKETS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    church_id UUID,
    church_name TEXT,
    related_id TEXT,
    type TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'content_report', 'contact', 'question', 'other')),
    subject TEXT NOT NULL CHECK (length(trim(subject)) > 0),
    message TEXT NOT NULL CHECK (length(trim(message)) > 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_church_members_user ON public.church_members(user_id);
CREATE INDEX IF NOT EXISTS idx_church_members_church ON public.church_members(church_id);
CREATE INDEX IF NOT EXISTS idx_needs_created_by ON public.needs(created_by);
CREATE INDEX IF NOT EXISTS idx_needs_church ON public.needs(church_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON public.needs(status);
CREATE INDEX IF NOT EXISTS idx_resources_owner ON public.resources(owner_id);
CREATE INDEX IF NOT EXISTS idx_resources_church ON public.resources(church_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_parties ON public.collaborations(need_owner_id, resource_owner_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_posts_church ON public.posts(church_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_author ON public.opportunities(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_contact_requests_parties ON public.contact_requests(sender_id, recipient_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ZERO TRUST ARCHITECTURE
-- =================================----------------===================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Helpers for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.system_admins WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_church_leader(p_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.church_members
        WHERE church_id = p_church_id
          AND user_id = auth.uid()
          AND status = 'approved'
          AND role IN ('OWNER', 'ADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles
CREATE POLICY "Users can read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND is_deactivated = (SELECT is_deactivated FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Public Profiles: Readable by all authenticated users
CREATE POLICY "Public profiles are readable by authenticated users" ON public.public_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own public profile" ON public.public_profiles
    FOR ALL USING (auth.uid() = id);

-- 2. System Admins: Read only for admins, no client writes
CREATE POLICY "Admins can view system_admins" ON public.system_admins
    FOR SELECT USING (public.is_admin());

-- 3. Churches: Publicly visible, created by authenticated users
CREATE POLICY "Churches readable by all authenticated" ON public.churches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create churches" ON public.churches
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Leaders can update their church" ON public.churches
    FOR UPDATE USING (public.is_church_leader(id) OR public.is_admin());

-- Church Secrets: NO client read or write! Only via SECURITY DEFINER functions
CREATE POLICY "Deny all client access to church secrets" ON public.church_secrets
    FOR ALL USING (false);

-- Church Members
CREATE POLICY "Members can view church memberships" ON public.church_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        public.is_church_leader(church_id) OR
        EXISTS (
            SELECT 1 FROM public.church_members m
            WHERE m.church_id = church_members.church_id
              AND m.user_id = auth.uid()
              AND m.status = 'approved'
        )
    );

CREATE POLICY "Users can only create their own pending membership" ON public.church_members
    FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'MEMBER' AND status = 'pending');

CREATE POLICY "Church leaders can update memberships" ON public.church_members
    FOR UPDATE USING (public.is_church_leader(church_id) OR (auth.uid() = user_id AND status = 'left'));

-- 4. Needs
CREATE POLICY "Needs visibility policy" ON public.needs
    FOR SELECT USING (
        visibility = 'public' OR
        created_by = auth.uid() OR
        (visibility = 'church' AND EXISTS (
            SELECT 1 FROM public.church_members
            WHERE church_id = needs.church_id
              AND user_id = auth.uid()
              AND status = 'approved'
        ))
    );

CREATE POLICY "Users can create their own needs" ON public.needs
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their own needs" ON public.needs
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete their own needs" ON public.needs
    FOR DELETE USING (auth.uid() = created_by);

-- 5. Need Responses
CREATE POLICY "Need responses viewable by author or responder" ON public.need_responses
    FOR SELECT USING (auth.uid() = responder_id OR auth.uid() = need_author_id);

CREATE POLICY "Users create their own response" ON public.need_responses
    FOR INSERT WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Participants update their responses" ON public.need_responses
    FOR UPDATE USING (auth.uid() = responder_id OR auth.uid() = need_author_id);

-- 6. Resources
CREATE POLICY "Resources visibility policy" ON public.resources
    FOR SELECT USING (
        status != 'closed' OR
        owner_id = auth.uid()
    );

CREATE POLICY "Users can create resources for themselves" ON public.resources
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their resources" ON public.resources
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their resources" ON public.resources
    FOR DELETE USING (auth.uid() = owner_id);

-- 7. Collaborations
CREATE POLICY "Collaborations viewable by participants" ON public.collaborations
    FOR SELECT USING (auth.uid() = need_owner_id OR auth.uid() = resource_owner_id);

CREATE POLICY "Collaborations insert by participants" ON public.collaborations
    FOR INSERT WITH CHECK (auth.uid() = need_owner_id OR auth.uid() = resource_owner_id);

CREATE POLICY "Collaborations update by participants" ON public.collaborations
    FOR UPDATE USING (auth.uid() = need_owner_id OR auth.uid() = resource_owner_id);

-- 8. Events & Participants
CREATE POLICY "Events select policy" ON public.events
    FOR SELECT USING (
        visibility = 'public' OR
        organizer_id = auth.uid() OR
        (visibility = 'church' AND EXISTS (
            SELECT 1 FROM public.church_members
            WHERE church_id = events.church_id
              AND user_id = auth.uid()
              AND status = 'approved'
        ))
    );

CREATE POLICY "Organizers create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers update events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id OR public.is_church_leader(church_id));

CREATE POLICY "Organizers delete events" ON public.events
    FOR DELETE USING (auth.uid() = organizer_id OR public.is_church_leader(church_id));

CREATE POLICY "Event participants view policy" ON public.event_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_participants.event_id AND e.organizer_id = auth.uid())
    );

CREATE POLICY "Event participant insert policy" ON public.event_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event participant update own status" ON public.event_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. Community Posts & Comments
CREATE POLICY "Posts select policy" ON public.posts
    FOR SELECT USING (
        visibility = 'public' OR
        author_id = auth.uid() OR
        (visibility = 'church' AND EXISTS (
            SELECT 1 FROM public.church_members
            WHERE church_id = posts.church_id
              AND user_id = auth.uid()
              AND status = 'approved'
        ))
    );

CREATE POLICY "Posts insert policy" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Posts update policy" ON public.posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Posts delete policy" ON public.posts
    FOR DELETE USING (auth.uid() = author_id OR public.is_church_leader(church_id));

CREATE POLICY "Comments select policy" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = comments.post_id
              AND (
                  p.visibility = 'public' OR
                  p.author_id = auth.uid() OR
                  (p.visibility = 'church' AND EXISTS (
                      SELECT 1 FROM public.church_members
                      WHERE church_id = p.church_id AND user_id = auth.uid() AND status = 'approved'
                  ))
              )
        )
    );

CREATE POLICY "Comments insert policy" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comments update policy" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Comments delete policy" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- 10. Opportunities & Responses
CREATE POLICY "Opportunities select policy" ON public.opportunities
    FOR SELECT USING (
        visibility = 'public' OR
        author_id = auth.uid() OR
        (visibility = 'church' AND EXISTS (
            SELECT 1 FROM public.church_members
            WHERE church_id = opportunities.church_id
              AND user_id = auth.uid()
              AND status = 'approved'
        ))
    );

CREATE POLICY "Opportunities insert policy" ON public.opportunities
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Opportunities update policy" ON public.opportunities
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Opportunities delete policy" ON public.opportunities
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Opportunity responses select policy" ON public.opportunity_responses
    FOR SELECT USING (auth.uid() = responder_id OR auth.uid() = opportunity_author_id);

CREATE POLICY "Opportunity responses insert policy" ON public.opportunity_responses
    FOR INSERT WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "Opportunity responses update policy" ON public.opportunity_responses
    FOR UPDATE USING (auth.uid() = responder_id OR auth.uid() = opportunity_author_id);

-- 11. Contact Requests
CREATE POLICY "Contact requests select policy" ON public.contact_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Contact requests insert policy" ON public.contact_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Contact requests update policy" ON public.contact_requests
    FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- 12. Notifications
CREATE POLICY "Notifications select policy" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Notifications update policy" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 13. Support Tickets
CREATE POLICY "Support tickets select policy" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Support tickets insert policy" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- SECURE STORED PROCEDURES & EDGE FUNCTIONS (RPC)
-- ====================================================================

-- Trigger to create initial profiles when user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, photo_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.public_profiles (id, display_name, photo_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Join church with secure code verification (Zero-Trust)
CREATE OR REPLACE FUNCTION public.join_church_with_code(p_church_id UUID, p_join_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_user_name TEXT;
    v_church_name TEXT;
    v_valid BOOLEAN := FALSE;
    v_existing_membership RECORD;
    v_membership_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentification requise';
    END IF;

    -- Verify code in church_secrets
    SELECT c.name, (s.join_code = trim(upper(p_join_code)))
    INTO v_church_name, v_valid
    FROM public.churches c
    JOIN public.church_secrets s ON s.church_id = c.id
    WHERE c.id = p_church_id;

    IF NOT FOUND OR NOT v_valid THEN
        RAISE EXCEPTION 'Code d''adhésion invalide pour cette église';
    END IF;

    -- Check if user is already a member
    v_membership_id := p_church_id::text || '_' || v_user_id::text;
    SELECT * INTO v_existing_membership FROM public.church_members WHERE id = v_membership_id;

    IF FOUND AND v_existing_membership.status = 'approved' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Vous êtes déjà membre actif de cette église');
    END IF;

    -- Get user details
    SELECT email, display_name INTO v_user_email, v_user_name FROM public.profiles WHERE id = v_user_id;

    -- Upsert membership with approved status
    INSERT INTO public.church_members (
        id, church_id, user_id, church_name, display_name, email, role, status, joined_at, updated_at
    ) VALUES (
        v_membership_id, p_church_id, v_user_id, v_church_name, COALESCE(v_user_name, 'Membre'), COALESCE(v_user_email, ''), 'MEMBER', 'approved', NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        status = 'approved',
        updated_at = NOW();

    -- Create notification
    INSERT INTO public.notifications (user_id, title, body, church_id, church_name, type)
    VALUES (v_user_id, 'Bienvenue dans la communauté', 'Vous avez rejoint ' || v_church_name || ' avec succès.', p_church_id, v_church_name, 'membership_approved');

    RETURN jsonb_build_object('success', true, 'churchId', p_church_id, 'churchName', v_church_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Atomic event registration with strict capacity enforcement
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT;
    v_user_name TEXT;
    v_event RECORD;
    v_participant_id TEXT;
    v_current_count INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentification requise';
    END IF;

    -- Lock event row for atomic transaction
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Événement introuvable';
    END IF;

    IF v_event.status != 'published' THEN
        RAISE EXCEPTION 'Les inscriptions pour cet événement ne sont pas ouvertes';
    END IF;

    IF v_event.start_at < NOW() THEN
        RAISE EXCEPTION 'Cet événement est déjà passé';
    END IF;

    v_participant_id := p_event_id::text || '_' || v_user_id::text;

    IF EXISTS (SELECT 1 FROM public.event_participants WHERE id = v_participant_id AND status = 'registered') THEN
        RETURN jsonb_build_object('success', true, 'message', 'Vous êtes déjà inscrit à cet événement');
    END IF;

    SELECT COUNT(*) INTO v_current_count FROM public.event_participants WHERE event_id = p_event_id AND status = 'registered';

    IF v_event.capacity IS NOT NULL AND v_current_count >= v_event.capacity THEN
        RAISE EXCEPTION 'Capacité maximale atteinte pour cet événement';
    END IF;

    SELECT email, display_name INTO v_user_email, v_user_name FROM public.profiles WHERE id = v_user_id;

    INSERT INTO public.event_participants (
        id, event_id, user_id, display_name, email, status, created_at, updated_at
    ) VALUES (
        v_participant_id, p_event_id, v_user_id, COALESCE(v_user_name, 'Participant'), COALESCE(v_user_email, ''), 'registered', NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        status = 'registered',
        updated_at = NOW();

    UPDATE public.events SET registered_count = v_current_count + 1 WHERE id = p_event_id;

    RETURN jsonb_build_object('success', true, 'eventId', p_event_id, 'registeredCount', v_current_count + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
