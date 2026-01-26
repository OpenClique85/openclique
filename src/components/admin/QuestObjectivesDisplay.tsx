/**
 * QuestObjectivesDisplay
 * 
 * Displays structured quest objectives with proof types and completion rules.
 * Used in admin review to inspect AI-generated or manually created objectives.
 */

import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Camera, 
  QrCode, 
  MapPin, 
  CheckSquare, 
  MessageSquare, 
  ShoppingBag, 
  Navigation,
  Sparkles
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type QuestObjective = Tables<'quest_objectives'>;

interface QuestObjectivesDisplayProps {
  objectives: QuestObjective[] | null;
  compact?: boolean;
}

// Objective type icons and labels
const OBJECTIVE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  checkin: { icon: <MapPin className="h-4 w-4" />, label: 'Check-in' },
  photo: { icon: <Camera className="h-4 w-4" />, label: 'Photo' },
  qr: { icon: <QrCode className="h-4 w-4" />, label: 'QR Scan' },
  task: { icon: <CheckSquare className="h-4 w-4" />, label: 'Task' },
  discussion: { icon: <MessageSquare className="h-4 w-4" />, label: 'Discussion' },
  purchase_optional: { icon: <ShoppingBag className="h-4 w-4" />, label: 'Purchase (Opt)' },
  travel: { icon: <Navigation className="h-4 w-4" />, label: 'Travel' },
};

// Proof type labels
const PROOF_TYPE_LABELS: Record<string, string> = {
  none: 'No proof required',
  photo: 'Photo proof',
  qr: 'QR code scan',
  geo: 'Location check-in',
  text_confirmation: 'Text confirmation',
};

// Completion rule labels
const COMPLETION_RULE_LABELS: Record<string, string> = {
  all_members: 'All squad members',
  majority: 'Majority of squad',
  any_member: 'Any squad member',
  per_member: 'Each member individually',
};

export function QuestObjectivesDisplay({ objectives, compact = false }: QuestObjectivesDisplayProps) {
  if (!objectives || objectives.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No structured objectives set
      </div>
    );
  }

  // Sort by objective_order
  const sortedObjectives = [...objectives].sort((a, b) => a.objective_order - b.objective_order);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{objectives.length} objectives</span>
        {objectives.some(o => o.ai_generated) && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Target className="h-4 w-4" />
        Structured Objectives ({objectives.length})
      </h4>
      <div className="space-y-2">
        {sortedObjectives.map((objective, index) => {
          const typeConfig = OBJECTIVE_TYPE_CONFIG[objective.objective_type] || {
            icon: <CheckSquare className="h-4 w-4" />,
            label: objective.objective_type,
          };

          return (
            <div
              key={objective.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{objective.objective_text}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!objective.is_required && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                    {objective.ai_generated && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs gap-1">
                    {typeConfig.icon}
                    {typeConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {PROOF_TYPE_LABELS[objective.proof_type] || objective.proof_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {COMPLETION_RULE_LABELS[objective.completion_rule] || objective.completion_rule}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
