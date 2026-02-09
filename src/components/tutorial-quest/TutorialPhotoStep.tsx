import { useState, useRef } from 'react';
import { BuggsNarration } from './BuggsNarration';
import { Camera, Upload, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialPhotoStepProps {
  onValid: (valid: boolean) => void;
}

export function TutorialPhotoStep({ onValid }: TutorialPhotoStepProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onValid(true);
  };

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onValid(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Photo Proof</h2>
        <p className="text-muted-foreground text-sm mt-1">Show your clique you were there</p>
      </div>

      <BuggsNarration message="During quests, you submit photos as proof of completion. Your clique can see them in the group chat!" />

      <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-sm font-medium text-primary mb-1">Practice Photo</p>
          <p className="text-foreground">Show us your current view — wherever you are right now! 📸</p>
        </div>

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Your photo"
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <button
              onClick={clearPhoto}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 mt-3 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Photo uploaded — nice!
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-32 border-dashed flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Tap to take or upload a photo</span>
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          This photo won't be saved — it's just for practice
        </p>
      </div>
    </div>
  );
}
