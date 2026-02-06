-- Create clique_chat_messages table for persistent clique group chat
CREATE TABLE public.clique_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clique_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  thread_id UUID REFERENCES public.clique_chat_messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  media_url TEXT,
  media_type TEXT
);

-- Create indexes for performance
CREATE INDEX idx_clique_chat_messages_clique_id ON public.clique_chat_messages(clique_id);
CREATE INDEX idx_clique_chat_messages_created_at ON public.clique_chat_messages(created_at DESC);
CREATE INDEX idx_clique_chat_messages_sender_id ON public.clique_chat_messages(sender_id);

-- Enable Row Level Security
ALTER TABLE public.clique_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Members can read messages from cliques they belong to
CREATE POLICY "Clique members can read messages"
  ON public.clique_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_chat_messages.clique_id
      AND sm.user_id = auth.uid()
    )
  );

-- RLS Policy: Members can insert messages to cliques they belong to
CREATE POLICY "Clique members can send messages"
  ON public.clique_chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = clique_chat_messages.clique_id
      AND sm.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own messages (for reactions)
CREATE POLICY "Users can update own messages"
  ON public.clique_chat_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policy: Admins have full access
CREATE POLICY "Admins have full access to clique messages"
  ON public.clique_chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Enable realtime for clique chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.clique_chat_messages;