/**
 * Quest Objectives Panel
 * 
 * Displays quest objectives as a checklist for admin reference.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestObjectivesPanelProps {
  objectives: unknown;
  className?: string;
}

export function QuestObjectivesPanel({ objectives, className }: QuestObjectivesPanelProps) {
  if (!objectives) return null;

  // Handle different objective formats: string, string[], or JSON object
  let objectivesList: string[] = [];
  
  if (typeof objectives === 'string') {
    objectivesList = objectives
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean)
      .map(o => o.replace(/^[-•]\s*/, ''));
  } else if (Array.isArray(objectives)) {
    objectivesList = objectives
      .map(o => (typeof o === 'string' ? o : JSON.stringify(o)))
      .filter(Boolean);
  } else if (typeof objectives === 'object' && objectives !== null) {
    // If it's an object with an objectives array or similar structure
    const obj = objectives as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      objectivesList = obj.items.map((o: unknown) => (typeof o === 'string' ? o : JSON.stringify(o)));
    } else if (Array.isArray(obj.objectives)) {
      objectivesList = obj.objectives.map((o: unknown) => (typeof o === 'string' ? o : JSON.stringify(o)));
    }
  }

  if (objectivesList.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Quest Objectives
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {objectivesList.map((objective, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                  {i + 1}
                </div>
              </div>
              <p className="text-sm text-foreground flex-1">{objective}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
