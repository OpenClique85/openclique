/**
 * Chat Media Picker
 * 
 * In-chat photo upload UI with camera/gallery selection,
 * preview, and optional "Quest Proof" toggle.
 */

import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatMediaPickerProps {
  onMediaSelected: (mediaUrl: string, isProof: boolean) => void;
  disabled?: boolean;
}

export function ChatMediaPicker({ onMediaSelected, disabled }: ChatMediaPickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProof, setIsProof] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Compress if too large (max 2MB)
    let processedFile = file;
    if (file.size > 2 * 1024 * 1024) {
      processedFile = await compressImage(file);
    }

    setSelectedFile(processedFile);
    const url = URL.createObjectURL(processedFile);
    setPreviewUrl(url);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUploadAndSend = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `chat-media/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ugc-media')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ugc-media')
        .getPublicUrl(filePath);

      onMediaSelected(urlData.publicUrl, isProof);
      handleCancel();
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsProof(false);
  };

  // Preview mode
  if (previewUrl) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg border">
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-h-48 object-contain rounded-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="quest-proof"
            checked={isProof}
            onCheckedChange={(checked) => setIsProof(checked === true)}
            disabled={isUploading}
          />
          <Label
            htmlFor="quest-proof"
            className="text-sm cursor-pointer"
          >
            Submit as Quest Proof 🏆
          </Label>
        </div>
        
        <Button
          onClick={handleUploadAndSend}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Send Photo
            </>
          )}
        </Button>
      </div>
    );
  }

  // Picker buttons
  return (
    <div className="flex gap-1">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
        title="Take Photo"
      >
        <Camera className="h-5 w-5" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title="Choose from Gallery"
      >
        <ImageIcon className="h-5 w-5" />
      </Button>
    </div>
  );
}
