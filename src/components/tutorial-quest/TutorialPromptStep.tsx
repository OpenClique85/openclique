import { useState } from 'react';
import { BuggsNarration } from './BuggsNarration';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';

interface TutorialPromptStepProps {
  onValid: (valid: boolean) => void;
}

export function TutorialPromptStep({ onValid }: TutorialPromptStepProps) {
  const [answer, setAnswer] = useState('');
  const isValid = answer.trim().length >= 10;

  const handleChange = (value: string) => {
    setAnswer(value);
    onValid(value.trim().length >= 10);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">Ice-Breaker Prompt</h2>
        <p className="text-muted-foreground text-sm mt-1">Help your clique get to know you</p>
      </div>

      <BuggsNarration message="Before each quest, you'll answer a fun prompt so your clique gets to know you. No wrong answers here!" />

      <div className="bg-card border rounded-xl p-4 md:p-6 space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-sm font-medium text-primary mb-1">Today's Prompt</p>
          <p className="text-foreground font-display text-lg">
            What's a food you could eat every day and never get tired of? 🍕
          </p>
        </div>

        <div className="relative">
          <Textarea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => handleChange(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          {isValid && (
            <CheckCircle2 className="absolute bottom-3 right-3 h-5 w-5 text-green-500" />
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {isValid ? '✅ Great answer!' : `Type at least 10 characters (${answer.trim().length}/10)`}
        </p>
      </div>
    </div>
  );
}
