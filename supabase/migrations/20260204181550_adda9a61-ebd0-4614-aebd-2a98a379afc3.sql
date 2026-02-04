-- Add policy for admins to send messages (as admin, buggs, or system)
CREATE POLICY "Admins can send messages"
ON public.squad_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND sender_type IN ('admin', 'buggs', 'system')
  AND public.has_role(auth.uid(), 'admin')
);

-- Also add policy for admins to view all messages (including hidden)
CREATE POLICY "Admins can view all messages"
ON public.squad_chat_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));