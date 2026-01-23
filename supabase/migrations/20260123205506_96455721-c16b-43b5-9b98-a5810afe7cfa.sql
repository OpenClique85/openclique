-- Create storage bucket for UGC media
INSERT INTO storage.buckets (id, name, public)
VALUES ('ugc-media', 'ugc-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create UGC submissions table
CREATE TABLE public.ugc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  instance_id UUID REFERENCES public.quest_instances(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  thumbnail_url TEXT,
  caption TEXT,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  consent_social_media BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ugc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own UGC submissions"
ON public.ugc_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create submissions
CREATE POLICY "Users can create UGC submissions"
ON public.ugc_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all UGC submissions"
ON public.ugc_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update submissions (for review)
CREATE POLICY "Admins can update UGC submissions"
ON public.ugc_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for ugc-media bucket
CREATE POLICY "Users can upload their own UGC media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ugc-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "UGC media is publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ugc-media');

CREATE POLICY "Users can update their own UGC media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'ugc-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own UGC media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ugc-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_ugc_submissions_updated_at
BEFORE UPDATE ON public.ugc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for admin monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.ugc_submissions;