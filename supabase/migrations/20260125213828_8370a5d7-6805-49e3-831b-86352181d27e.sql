-- Enable realtime for quest_signups table for live signup count updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_signups;