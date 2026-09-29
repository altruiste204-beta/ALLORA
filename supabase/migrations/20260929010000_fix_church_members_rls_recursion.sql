-- ALLORA — Fix RLS recursion on church_members
-- This migration is safe to run after the initial schema + security hardening.
-- It does not change the data model. It only removes self-referential RLS evaluation.

BEGIN;

-- Helper used by RLS policies. SECURITY DEFINER is intentional: when this
-- function reads church_members, PostgreSQL must not re-enter the
-- church_members RLS policy that called it.
CREATE OR REPLACE FUNCTION public.is_church_member(
  p_church_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_members AS cm
    WHERE cm.church_id = p_church_id
      AND cm.user_id = p_user_id
      AND cm.status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.is_church_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_church_member(UUID, UUID) TO authenticated;

-- Harden the existing leader helper as well.
CREATE OR REPLACE FUNCTION public.is_church_leader(p_church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_members AS cm
    WHERE cm.church_id = p_church_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'approved'
      AND cm.role IN ('OWNER', 'ADMIN')
  );
$$;

REVOKE ALL ON FUNCTION public.is_church_leader(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_church_leader(UUID) TO authenticated;

-- Replace the recursive membership SELECT policy. The previous policy
-- contained an EXISTS query against church_members itself, which caused
-- PostgreSQL error 42P17 (infinite recursion detected in policy).
DROP POLICY IF EXISTS "Members can view church memberships" ON public.church_members;
DROP POLICY IF EXISTS allora_members_select ON public.church_members;

CREATE POLICY allora_members_select ON public.church_members
FOR SELECT
USING (
  public.is_active_user()
  AND (
    auth.uid() = user_id
    OR public.is_church_leader(church_id)
    OR public.is_church_member(church_id)
  )
);

COMMIT;
