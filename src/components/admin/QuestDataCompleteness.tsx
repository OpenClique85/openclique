/**
 * Quest Data Completeness Checker
 * 
 * Shows admins what data is present/missing for a quest.
 * Aligned with what creators can actually set in the Quest Builder.
 * 
 * Data sources:
 * - Constraints: Set in Step 3 (always present with defaults)
 * - Objectives/Roles/Affinities: Generated in Step 4 (AI Draft) or skipped
 */

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, AlertTriangle, XCircle, 
  Filter, Target, Users, Brain, Image, Calendar, Info
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type QuestObjective = Tables<'quest_objectives'>;
type QuestRole = Tables<'quest_roles'>;
type QuestConstraints = Tables<'quest_constraints'>;
type QuestPersonalityAffinity = Tables<'quest_personality_affinity'>;

interface QuestDataCompletenessProps {
  quest: Quest;
  objectives: QuestObjective[] | null;
  roles: QuestRole[] | null;
  constraints: QuestConstraints | null;
  affinities: QuestPersonalityAffinity[] | null;
}

interface CheckItem {
  label: string;
  icon: React.ReactNode;
  status: 'complete' | 'warning' | 'missing' | 'info';
  message: string;
  helpText?: string;
}

export function QuestDataCompleteness({
  quest,
  objectives,
  roles,
  constraints,
  affinities,
}: QuestDataCompletenessProps) {
  const checks: CheckItem[] = [
    // Image - important for feed visibility
    {
      label: 'Quest Image',
      icon: <Image className="h-4 w-4" />,
      status: quest.image_url ? 'complete' : 'warning',
      message: quest.image_url 
        ? 'Image uploaded' 
        : 'No image - will use placeholder',
      helpText: 'Quests with images get 3x more engagement',
    },
    // Date/Time - important for sorting
    {
      label: 'Date & Time',
      icon: <Calendar className="h-4 w-4" />,
      status: quest.start_datetime ? 'complete' : 'warning',
      message: quest.start_datetime
        ? 'Date set'
        : 'No date - quest may not sort correctly',
    },
    // Constraints (Hard Filters) - auto-populated with defaults
    {
      label: 'Filter Constraints',
      icon: <Filter className="h-4 w-4" />,
      status: constraints ? 'complete' : 'info',
      message: constraints
        ? 'Filters configured'
        : 'Using default filters (can still be discovered)',
      helpText: 'Constraints are auto-set with sensible defaults in the builder',
    },
    // Objectives - from AI Draft or manual entry
    {
      label: 'Objectives',
      icon: <Target className="h-4 w-4" />,
      status: objectives && objectives.length > 0 ? 'complete' : 'info',
      message: objectives?.length
        ? `${objectives.length} objectives (${objectives.filter(o => o.is_required).length} required)`
        : 'No structured objectives',
      helpText: 'Generated via AI Draft step or from manual text',
    },
    // Roles - optional, from AI Draft
    {
      label: 'Squad Roles',
      icon: <Users className="h-4 w-4" />,
      status: roles && roles.length > 0 ? 'complete' : 'info',
      message: roles?.length
        ? `${roles.length} roles defined`
        : 'No squad roles (optional)',
      helpText: 'Roles help squads self-organize',
    },
    // Personality Affinities - for matching algorithm
    {
      label: 'Matching Logic',
      icon: <Brain className="h-4 w-4" />,
      status: affinities && affinities.length > 0 ? 'complete' : 'info',
      message: affinities?.length
        ? `${affinities.length} personality affinities`
        : 'No matching logic (AI Draft optional)',
      helpText: 'Shows "Why this fits" on quest cards',
    },
  ];

  const completeCount = checks.filter(c => c.status === 'complete').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const infoCount = checks.filter(c => c.status === 'info').length;

  // Determine overall status - only warnings matter, info is fine
  const overallStatus = warningCount > 1 ? 'warning' : 'complete';

  const statusConfig = {
    complete: {
      variant: 'default' as const,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      title: 'Ready for Review',
      description: 'Quest has the essentials. Optional items can enhance discovery.',
    },
    warning: {
      variant: 'default' as const,
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      title: 'Could Use Improvement',
      description: `${warningCount} item(s) could improve visibility, but quest is functional.`,
    },
  };

  const config = statusConfig[overallStatus];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'complete':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300',
          badge: 'secondary' as const,
          symbol: '✓',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300',
          badge: 'outline' as const,
          symbol: '!',
        };
      case 'info':
      default:
        return {
          bg: 'bg-muted/50',
          iconBg: 'bg-muted text-muted-foreground',
          badge: 'secondary' as const,
          symbol: '–',
        };
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={config.variant}>
        <div className="flex items-start gap-3">
          {config.icon}
          <div>
            <AlertTitle>{config.title}</AlertTitle>
            <AlertDescription>{config.description}</AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Explanation for admins */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Constraints use defaults if not customized. Objectives, roles, and matching logic 
          come from the optional AI Draft step. All quests can be approved without these.
        </span>
      </div>

      <div className="grid gap-2">
        {checks.map((check, i) => {
          const style = getStatusStyle(check.status);
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-2 rounded-lg ${style.bg}`}
            >
              <div className={`p-1.5 rounded-full ${style.iconBg}`}>
                {check.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{check.label}</p>
                <p className="text-xs text-muted-foreground truncate">{check.message}</p>
              </div>
              <Badge variant={style.badge} className="text-xs">
                {style.symbol}
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <span>Completeness Score</span>
        <span className="font-medium">
          {Math.round(((completeCount + infoCount * 0.5) / checks.length) * 100)}%
        </span>
      </div>
    </div>
  );
}
