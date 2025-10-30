-- First, let's add user_id column to link to auth.users
ALTER TABLE public.users ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user roles table for admin access to reports
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.chat_sessions;

-- NEW SECURE POLICIES FOR USERS TABLE
-- Users can only view their own record and their current partner's basic info
CREATE POLICY "Users can view their own record"
ON public.users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view their current partner"
ON public.users
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT current_partner_id 
    FROM public.users 
    WHERE user_id = auth.uid()
  )
);

-- Users can only view searching users when they are searching (for matching)
CREATE POLICY "Searching users can view other searching users"
ON public.users
FOR SELECT
TO authenticated
USING (
  is_searching = true 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = auth.uid() AND is_searching = true
  )
);

-- Users can only update their own record
CREATE POLICY "Users can update their own record"
ON public.users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own record
CREATE POLICY "Users can delete their own record"
ON public.users
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- NEW SECURE POLICIES FOR REPORTS TABLE
-- Only admins can view reports
CREATE POLICY "Only admins can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can still create reports (for reporter_id, use the id from users table, not auth.uid)
-- Keep existing insert policy

-- NEW SECURE POLICIES FOR CHAT_SESSIONS TABLE
-- Users can view sessions they are part of
CREATE POLICY "Users can view their own sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (
  user1_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
  OR user2_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);

-- Users can update sessions they are part of
CREATE POLICY "Users can update their own sessions"
ON public.chat_sessions
FOR UPDATE
TO authenticated
USING (
  user1_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
  OR user2_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
)
WITH CHECK (
  user1_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
  OR user2_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);

-- RLS policy for user_roles (only admins can manage roles)
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());