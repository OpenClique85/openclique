/**
 * QuestRolesDisplay
 * 
 * Displays quest squad roles with descriptions.
 * Used in admin review to inspect AI-generated or manually created roles.
 */

import { Badge } from '@/components/ui/badge';
import { Users, Sparkles } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type QuestRole = Tables<'quest_roles'>;

interface QuestRolesDisplayProps {
  roles: QuestRole[] | null;
  compact?: boolean;
}

// Role icons and descriptions
const ROLE_CONFIG: Record<string, { emoji: string; color: string }> = {
  Navigator: { emoji: '🧭', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  Timekeeper: { emoji: '⏰', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  'Vibe Curator': { emoji: '🎵', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  Photographer: { emoji: '📸', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  Connector: { emoji: '🤝', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  Wildcard: { emoji: '🃏', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function QuestRolesDisplay({ roles, compact = false }: QuestRolesDisplayProps) {
  if (!roles || roles.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No squad roles defined
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Users className="h-4 w-4 text-muted-foreground" />
        {roles.map((role) => {
          const config = ROLE_CONFIG[role.role_name] || { emoji: '👤', color: '' };
          return (
            <Badge key={role.id} variant="outline" className={config.color}>
              {config.emoji} {role.role_name}
            </Badge>
          );
        })}
        {roles.some(r => r.ai_generated) && (
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
        <Users className="h-4 w-4" />
        Squad Roles ({roles.length})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {roles.map((role) => {
          const config = ROLE_CONFIG[role.role_name] || { emoji: '👤', color: '' };
          return (
            <div
              key={role.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
            >
              <span className="text-xl">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{role.role_name}</span>
                  {role.ai_generated && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>
                {role.role_description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {role.role_description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
