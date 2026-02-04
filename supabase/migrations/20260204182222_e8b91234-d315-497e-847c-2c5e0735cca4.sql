-- Drop the old FK constraint that references squads
ALTER TABLE public.squad_chat_messages 
DROP CONSTRAINT IF EXISTS squad_chat_messages_squad_id_fkey;

-- Add new FK constraint that references quest_squads
ALTER TABLE public.squad_chat_messages 
ADD CONSTRAINT squad_chat_messages_squad_id_fkey 
FOREIGN KEY (squad_id) REFERENCES public.quest_squads(id) ON DELETE CASCADE;

-- Also update the RLS policies to use the correct table reference
-- First, drop and recreate the member SELECT policy to use quest_squads
DROP POLICY IF EXISTS "Squad members can view chat messages" ON public.squad_chat_messages;
DROP POLICY IF EXISTS "Squad members can send messages" ON public.squad_chat_messages;

-- SELECT: Squad members can view their squad's chat (via quest_squads)
CREATE POLICY "Squad members can view chat messages"
ON public.squad_chat_messages FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM squad_members sm
    WHERE sm.squad_id = squad_chat_messages.squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
  ))
  AND (hidden_at IS NULL)
);

-- INSERT: Squad members can send user messages  
CREATE POLICY "Squad members can send messages"
ON public.squad_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND sender_type = 'user'
  AND EXISTS (
    SELECT 1 FROM squad_members sm
    WHERE sm.squad_id = squad_chat_messages.squad_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
  )
);