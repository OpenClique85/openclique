/**
 * Feedback Media Upload Component
 * 
 * Allows users to optionally upload photos/videos from their quest experience
 * with clear consent for marketing use.
 */

import { useState, useRef } from 'react';
import { Camera, Video, X, Loader2, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FeedbackMediaUploadProps {
  questId?: string;
  instanceId?: string;
  userId: string;
  onComplete?: () => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export function FeedbackMediaUpload({ 
  questId, 
  instanceId, 
  userId,
  onComplete 
}: FeedbackMediaUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [caption, setCaption] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentSocialMedia, setConsentSocialMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: UploadedFile[] = selectedFiles
      .filter(file => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
        
        if (!isImage && !isVideo) {
          toast({
            title: 'Invalid file type',
            description: 'Please upload images or videos only',
            variant: 'destructive',
          });
          return false;
        }
        
        if (!isValidSize) {
          toast({
            title: 'File too large',
            description: 'Files must be under 50MB',
            variant: 'destructive',
          });
          return false;
        }
        
        return true;
      })
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video' as 'image' | 'video',
      }));
    
    setFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0 || (!consentMarketing && !consentSocialMedia)) return;
    
    setIsUploading(true);
    
    try {
      for (const uploadedFile of files) {
        // Upload to storage
        const fileExt = uploadedFile.file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ugc-media')
          .upload(fileName, uploadedFile.file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('ugc-media')
          .getPublicUrl(fileName);
        
        // Create submission record
        const { error: dbError } = await supabase
          .from('ugc_submissions')
          .insert({
            user_id: userId,
            quest_id: questId || null,
            instance_id: instanceId || null,
            file_url: urlData.publicUrl,
            file_type: uploadedFile.type,
            caption: caption.trim() || null,
            consent_marketing: consentMarketing,
            consent_social_media: consentSocialMedia,
            status: 'pending',
          });
        
        if (dbError) throw dbError;
      }
      
      toast({
        title: 'Media submitted!',
        description: 'Thank you for sharing your experience. We\'ll review it soon.',
      });
      
      setIsSubmitted(true);
      onComplete?.();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const canSubmit = files.length > 0 && (consentMarketing || consentSocialMedia);

  if (isSubmitted) {
    return (
      <Card className="p-6 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
          <Check className="h-5 w-5" />
          <p className="font-medium">Media submitted for review!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Share Your Quest Moments (Optional)
        </h3>
        <p className="text-xs text-muted-foreground">
          Got any great photos or videos? We'd love to feature them!
        </p>
      </div>

      {/* File upload area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {files.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Click to upload photos or videos</span>
            <span className="text-xs">Up to 5 files, max 50MB each</span>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          {/* Preview grid */}
          <div className="grid grid-cols-3 gap-2">
            {files.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {file.type === 'image' ? (
                  <img 
                    src={file.preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {files.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Caption */}
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            rows={2}
            className="resize-none text-sm"
          />
        </div>
      )}

      {/* Consent checkboxes */}
      {files.length > 0 && (
        <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
          <p className="text-sm font-medium text-foreground">
            How can we use your content? <span className="text-destructive">*</span>
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-marketing"
                checked={consentMarketing}
                onCheckedChange={(checked) => setConsentMarketing(checked as boolean)}
              />
              <label htmlFor="consent-marketing" className="text-sm cursor-pointer">
                Use for OpenClique marketing & website
              </label>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-social"
                checked={consentSocialMedia}
                onCheckedChange={(checked) => setConsentSocialMedia(checked as boolean)}
              />
              <label htmlFor="consent-social" className="text-sm cursor-pointer">
                Share on social media (Instagram, TikTok, etc.)
              </label>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            We'll review all content before use. You can request removal anytime.
          </p>
        </div>
      )}

      {/* Submit button */}
      {files.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Submit Media'
          )}
        </Button>
      )}
    </div>
  );
}
