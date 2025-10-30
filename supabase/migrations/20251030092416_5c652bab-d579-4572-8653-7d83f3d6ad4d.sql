-- Create users table for random chat matching
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  is_searching BOOLEAN NOT NULL DEFAULT false,
  current_partner_id UUID REFERENCES public.users(id),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_sessions table to track active chats
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create reports table for abuse reporting
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (allow anyone to read/write for anonymous matching)
CREATE POLICY "Anyone can create users"
ON public.users
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own record"
ON public.users
FOR UPDATE
USING (true);

-- RLS Policies for chat_sessions (allow anyone to read/write)
CREATE POLICY "Anyone can create sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view sessions"
ON public.chat_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update sessions"
ON public.chat_sessions
FOR UPDATE
USING (true);

-- RLS Policies for reports
CREATE POLICY "Anyone can create reports"
ON public.reports
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view reports"
ON public.reports
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_users_searching ON public.users(is_searching) WHERE is_searching = true;
CREATE INDEX idx_users_last_active ON public.users(last_active DESC);
CREATE INDEX idx_sessions_users ON public.chat_sessions(user1_id, user2_id);

-- Enable realtime for chat functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Configure users table for realtime
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;