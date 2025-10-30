-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Anyone can create users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
DROP POLICY IF EXISTS "Users can view their current partner" ON public.users;
DROP POLICY IF EXISTS "Searching users can view other searching users" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own record" ON public.users;

-- Drop ALL existing policies on reports table
DROP POLICY IF EXISTS "Anyone can create reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
DROP POLICY IF EXISTS "Only admins can view reports" ON public.reports;

-- Drop ALL existing policies on chat_sessions table
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.chat_sessions;

-- =========== NEW SECURE POLICIES ===========

-- USERS TABLE: Keep INSERT public for anonymous sign-up, but secure everything else
CREATE POLICY "Anyone can create users"
ON public.users
FOR INSERT
WITH CHECK (true);

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

CREATE POLICY "Users can update only their own record"
ON public.users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete only their own record"
ON public.users
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- REPORTS TABLE: Secure completely - only admins can view
CREATE POLICY "Anyone can create reports"
ON public.reports
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CHAT_SESSIONS TABLE: Secure to participants only
CREATE POLICY "Anyone can create sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view only their own sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (
  user1_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
  OR user2_id IN (SELECT id FROM public.users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update only their own sessions"
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