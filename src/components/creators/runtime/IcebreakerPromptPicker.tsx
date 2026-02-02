import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Sparkles, Check, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface IcebreakerPromptPickerProps {
  questId: string;
  squadId?: string;
  onPromptSet?: (promptId: string | null) => void;
}

export function IcebreakerPromptPicker({ 
  questId, 
  squadId,
  onPromptSet 
}: IcebreakerPromptPickerProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // Fetch available warm-up prompts
  const { data: prompts, isLoading: loadingPrompts } = useQuery({
    queryKey: ['warm-up-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('category', 'warm_up')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch current quest to get existing prompt
  const { data: quest } = useQuery({
    queryKey: ['quest-warm-up-prompt', questId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('id, warm_up_prompt_id, warm_up_prompt_custom')
        .eq('id', questId)
        .single();
      
      if (error) throw error;
      return data as { id: string; warm_up_prompt_id: string | null; warm_up_prompt_custom: string | null } | null;
    },
  });

  // Set prompt mutation
  const setPrompt = useMutation({
    mutationFn: async ({ promptId, customText }: { promptId: string | null; customText?: string }) => {
      const updates: Record<string, any> = {
        warm_up_prompt_id: promptId,
        warm_up_prompt_custom: customText || null,
      };

      const { error } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', questId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-warm-up-prompt', questId] });
      toast.success('Icebreaker prompt updated!');
      setIsOpen(false);
      onPromptSet?.(selectedPrompt);
    },
    onError: () => {
      toast.error('Failed to update prompt');
    },
  });

  const handleSave = () => {
    if (useCustom) {
      setPrompt.mutate({ promptId: null, customText: customPrompt });
    } else {
      setPrompt.mutate({ promptId: selectedPrompt, customText: undefined });
    }
  };

  // Get currently selected prompt details
  const currentPrompt = prompts?.find(p => p.id === quest?.warm_up_prompt_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Icebreaker Prompt
        </CardTitle>
        <CardDescription>
          The question squad members will answer during warm-up
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quest?.warm_up_prompt_custom ? (
          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Custom
              </Badge>
            </div>
            <p className="text-sm italic">"{quest.warm_up_prompt_custom}"</p>
          </div>
        ) : currentPrompt ? (
          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {currentPrompt.name}
              </Badge>
            </div>
            <p className="text-sm italic">"{currentPrompt.body}"</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed text-center mb-4">
            <Lightbulb className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No icebreaker prompt set</p>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              {currentPrompt || quest?.warm_up_prompt_custom ? 'Change Prompt' : 'Set Prompt'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Choose Icebreaker Prompt</DialogTitle>
              <DialogDescription>
                Select a pre-made prompt or write your own
              </DialogDescription>
            </DialogHeader>

            {loadingPrompts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <RadioGroup 
                  value={useCustom ? 'custom' : selectedPrompt || ''} 
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setUseCustom(true);
                      setSelectedPrompt(null);
                    } else {
                      setUseCustom(false);
                      setSelectedPrompt(value);
                    }
                  }}
                >
                  {/* Pre-made prompts */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {prompts?.map((prompt) => (
                      <div key={prompt.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={prompt.id} id={prompt.id} className="mt-1" />
                        <Label htmlFor={prompt.id} className="flex-1 cursor-pointer">
                          <span className="font-medium block mb-1">{prompt.name}</span>
                          <span className="text-sm text-muted-foreground">{prompt.body}</span>
                        </Label>
                      </div>
                    ))}
                    
                    {/* Custom option */}
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="custom" id="custom" className="mt-1" />
                      <Label htmlFor="custom" className="flex-1 cursor-pointer">
                        <span className="font-medium flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4" />
                          Write your own
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Create a custom icebreaker question
                        </span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Custom prompt textarea */}
                {useCustom && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-prompt">Your custom prompt</Label>
                    <Textarea
                      id="custom-prompt"
                      placeholder="e.g., What's one thing you're hoping to experience during this quest?"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Keep it open-ended and relevant to helping squad members get to know each other
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={setPrompt.isPending || (!selectedPrompt && !useCustom) || (useCustom && !customPrompt.trim())}
                className="gap-2"
              >
                {setPrompt.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Prompt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
