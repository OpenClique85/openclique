import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QuestFormData } from '../types';
import { MapPin, Image, MessageCircle, Loader2, Sparkles, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaStepProps {
  formData: QuestFormData;
  updateFormData: (updates: Partial<QuestFormData>) => void;
}

export function MediaStep({ formData, updateFormData }: MediaStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `creator-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('quest-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quest-images')
        .getPublicUrl(filePath);

      updateFormData({ image_url: publicUrl });
      toast({ title: 'Image uploaded!', description: 'Your quest image has been uploaded.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Could not upload image. Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.title) {
      toast({ title: 'Title required', description: 'Please add a quest title first.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quest-image', {
        body: {
          title: formData.title,
          theme: formData.theme,
          progression_tree: formData.progression_tree,
        },
      });

      if (error) throw error;
      if (data?.image_url) {
        updateFormData({ image_url: data.image_url });
        toast({ title: 'Image generated!', description: 'AI created a quest image for you.' });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({ title: 'Generation failed', description: 'Could not generate image. Please upload one instead.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-creator/5 border border-creator/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-creator mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Media & Meeting Point</p>
            <p className="text-sm text-muted-foreground">
              Add a hero image and set where participants will meet.
            </p>
          </div>
        </div>
      </div>

      {/* Image Upload/Generate */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Quest Image</Label>
        
        {formData.image_url ? (
          <div className="relative">
            <img 
              src={formData.image_url} 
              alt="Quest preview" 
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => updateFormData({ image_url: '' })}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
            <Image className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Upload an image or let AI generate one</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                className="relative"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Image
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateImage}
                disabled={isGenerating || !formData.title}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Generate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Location */}
      <div className="space-y-2">
        <Label htmlFor="meeting_location_name" className="text-base font-medium">Meeting Location Name</Label>
        <Input
          id="meeting_location_name"
          placeholder="e.g., Zilker Park - Barton Springs Pool Entrance"
          value={formData.meeting_location_name}
          onChange={(e) => updateFormData({ meeting_location_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting_address" className="text-base font-medium">Meeting Address</Label>
        <Input
          id="meeting_address"
          placeholder="e.g., 2131 William Barton Dr, Austin, TX 78746"
          value={formData.meeting_address}
          onChange={(e) => updateFormData({ meeting_address: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          Full address for GPS navigation.
        </p>
      </div>

      {/* WhatsApp Link */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="whatsapp_invite_link" className="text-base font-medium">WhatsApp Group Link</Label>
        </div>
        <Input
          id="whatsapp_invite_link"
          placeholder="https://chat.whatsapp.com/..."
          value={formData.whatsapp_invite_link}
          onChange={(e) => updateFormData({ whatsapp_invite_link: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          Optional: Create a WhatsApp group for quest communication.
        </p>
      </div>
    </div>
  );
}
