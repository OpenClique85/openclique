/**
 * Quest Data Completeness Checker
 * 
 * Shows admins what data is missing before approving a quest.
 * Critical for ensuring quests show up properly in feed and matching.
 */

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, AlertTriangle, XCircle, 
  Filter, Target, Users, Brain, Image, Calendar
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
  status: 'complete' | 'warning' | 'missing';
  message: string;
}

export function QuestDataCompleteness({
  quest,
  objectives,
  roles,
  constraints,
  affinities,
}: QuestDataCompletenessProps) {
  const checks: CheckItem[] = [
    // Image
    {
      label: 'Quest Image',
      icon: <Image className="h-4 w-4" />,
      status: quest.image_url ? 'complete' : 'missing',
      message: quest.image_url 
        ? 'Image uploaded' 
        : 'No image - quest will show placeholder in feed',
    },
    // Date/Time
    {
      label: 'Date & Time',
      icon: <Calendar className="h-4 w-4" />,
      status: quest.start_datetime ? 'complete' : 'warning',
      message: quest.start_datetime
        ? 'Date set'
        : 'No date - quest may not sort correctly',
    },
    // Constraints (Hard Filters)
    {
      label: 'Filter Constraints',
      icon: <Filter className="h-4 w-4" />,
      status: constraints ? 'complete' : 'missing',
      message: constraints
        ? `${Object.values(constraints).filter(v => v && typeof v !== 'string' || (typeof v === 'string' && !v.includes('-'))).length - 4} filters configured`
        : 'Missing - quest won\'t be filterable in discovery',
    },
    // Objectives
    {
      label: 'Objectives',
      icon: <Target className="h-4 w-4" />,
      status: objectives && objectives.length > 0 ? 'complete' : 'warning',
      message: objectives?.length
        ? `${objectives.length} objectives (${objectives.filter(o => o.is_required).length} required)`
        : 'No objectives - users won\'t know what to do',
    },
    // Roles
    {
      label: 'Squad Roles',
      icon: <Users className="h-4 w-4" />,
      status: roles && roles.length > 0 ? 'complete' : 'warning',
      message: roles?.length
        ? `${roles.length} roles defined`
        : 'No roles - squads may lack structure',
    },
    // Personality Affinities (Matching)
    {
      label: 'Matching Logic',
      icon: <Brain className="h-4 w-4" />,
      status: affinities && affinities.length > 0 ? 'complete' : 'missing',
      message: affinities?.length
        ? `${affinities.length} personality affinities for matching`
        : 'Missing - quest won\'t show "Why this fits" in feed',
    },
  ];

  const missingCount = checks.filter(c => c.status === 'missing').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const completeCount = checks.filter(c => c.status === 'complete').length;

  const overallStatus = missingCount > 0 ? 'missing' : warningCount > 0 ? 'warning' : 'complete';

  const statusConfig = {
    complete: {
      variant: 'default' as const,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      title: 'Quest Data Complete',
      description: 'All required data is present for proper feed display and matching.',
    },
    warning: {
      variant: 'default' as const,
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      title: 'Some Data Missing',
      description: `${warningCount} optional item(s) missing - quest will work but may have reduced visibility.`,
    },
    missing: {
      variant: 'destructive' as const,
      icon: <XCircle className="h-4 w-4" />,
      title: 'Critical Data Missing',
      description: `${missingCount} required item(s) missing - quest may not appear correctly in feed or matching.`,
    },
  };

  const config = statusConfig[overallStatus];

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

      <div className="grid gap-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              check.status === 'complete'
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : check.status === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : 'bg-destructive/10'
            }`}
          >
            <div
              className={`p-1.5 rounded-full ${
                check.status === 'complete'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300'
                  : check.status === 'warning'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300'
                  : 'bg-destructive/20 text-destructive'
              }`}
            >
              {check.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{check.label}</p>
              <p className="text-xs text-muted-foreground truncate">{check.message}</p>
            </div>
            <Badge
              variant={
                check.status === 'complete'
                  ? 'secondary'
                  : check.status === 'warning'
                  ? 'outline'
                  : 'destructive'
              }
              className="text-xs"
            >
              {check.status === 'complete'
                ? '✓'
                : check.status === 'warning'
                ? '!'
                : '✗'}
            </Badge>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <span>Completeness Score</span>
        <span className="font-medium">
          {Math.round((completeCount / checks.length) * 100)}%
        </span>
      </div>
    </div>
  );
}
