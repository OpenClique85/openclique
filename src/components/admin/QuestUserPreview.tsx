/**
 * Quest User Preview
 * 
 * Shows what users and creators will see when viewing the quest.
 * Used in admin review modal to ensure WYSIWYG approval.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Clock, Users, DollarSign, MapPin, Gift, 
  Target, UserCheck, Eye, Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type QuestObjective = Tables<'quest_objectives'>;
type QuestRole = Tables<'quest_roles'>;
type QuestConstraints = Tables<'quest_constraints'>;
type QuestPersonalityAffinity = Tables<'quest_personality_affinity'>;

interface QuestWithCreator extends Quest {
  creator_profile?: { display_name: string } | null;
  sponsor_profiles?: { name: string } | null;
}

interface QuestUserPreviewProps {
  quest: QuestWithCreator;
  objectives: QuestObjective[] | null;
  roles: QuestRole[] | null;
  constraints: QuestConstraints | null;
  affinities: QuestPersonalityAffinity[] | null;
}

// Map constraint values to user-friendly labels
const CONSTRAINT_LABELS = {
  alcohol: {
    none: '🚫 No Alcohol',
    optional: '🍻 Drinks Optional',
    primary: '🍷 Alcohol-Focused',
  },
  age_requirement: {
    all_ages: '👨‍👩‍👧 All Ages',
    '18_plus': '🔞 18+',
    '21_plus': '🍸 21+',
  },
  physical_intensity: {
    low: '🧘 Low Activity',
    medium: '🚶 Moderate Activity',
    high: '🏃 High Activity',
  },
  indoor_outdoor: {
    indoor: '🏠 Indoor',
    outdoor: '🌳 Outdoor',
    mixed: '🔄 Indoor & Outdoor',
  },
  noise_level: {
    quiet: '🤫 Quiet',
    moderate: '🗣️ Moderate Noise',
    loud: '🔊 Loud/Party',
  },
};

export function QuestUserPreview({
  quest,
  objectives,
  roles,
  constraints,
  affinities,
}: QuestUserPreviewProps) {
  const topAffinity = affinities?.sort((a, b) => b.trait_weight - a.trait_weight)[0];

  return (
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="user" className="gap-2">
          <Eye className="h-4 w-4" />
          User View
        </TabsTrigger>
        <TabsTrigger value="card" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Card Preview
        </TabsTrigger>
      </TabsList>

      {/* User Detail View */}
      <TabsContent value="user" className="mt-4 space-y-4">
        {/* Hero Image */}
        {quest.image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <img
              src={quest.image_url}
              alt={quest.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{quest.icon || '🎯'}</span>
                <h3 className="text-lg font-bold text-white">{quest.title}</h3>
              </div>
              {quest.theme && (
                <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                  {quest.theme}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Facts */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {quest.start_datetime && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{format(new Date(quest.start_datetime), 'EEE, MMM d @ h:mm a')}</span>
            </div>
          )}
          {quest.default_duration_minutes && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{quest.default_duration_minutes} min</span>
            </div>
          )}
          {quest.capacity_total && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Up to {quest.capacity_total} people</span>
            </div>
          )}
          {quest.cost_description && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{quest.cost_description}</span>
            </div>
          )}
          {quest.meeting_location_name && (
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{quest.meeting_location_name}</span>
            </div>
          )}
        </div>

        {/* Constraint Badges (what users filter by) */}
        {constraints && (
          <div className="flex flex-wrap gap-2">
            {constraints.alcohol && (
              <Badge variant="outline" className="text-xs">
                {CONSTRAINT_LABELS.alcohol[constraints.alcohol] || constraints.alcohol}
              </Badge>
            )}
            {constraints.age_requirement && (
              <Badge variant="outline" className="text-xs">
                {CONSTRAINT_LABELS.age_requirement[constraints.age_requirement] || constraints.age_requirement}
              </Badge>
            )}
            {constraints.indoor_outdoor && (
              <Badge variant="outline" className="text-xs">
                {CONSTRAINT_LABELS.indoor_outdoor[constraints.indoor_outdoor] || constraints.indoor_outdoor}
              </Badge>
            )}
          </div>
        )}

        {/* Why This Fits (Affinity Match) */}
        {topAffinity && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-primary">✨ Why this fits you</p>
            <p className="text-sm text-muted-foreground mt-1">
              {topAffinity.explanation}
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <h4 className="font-semibold mb-2">About This Quest</h4>
          <p className="text-sm text-muted-foreground">
            {quest.short_description || 'No description provided.'}
          </p>
          {quest.full_description && (
            <p className="text-sm text-muted-foreground mt-2">
              {quest.full_description}
            </p>
          )}
        </div>

        {/* Objectives */}
        {objectives && objectives.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Your Mission
            </h4>
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={obj.id} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className={obj.is_required ? 'text-foreground' : 'text-muted-foreground'}>
                    {obj.objective_text}
                    {obj.is_required && <span className="text-destructive ml-1">*</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Squad Roles */}
        {roles && roles.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Squad Roles
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <Card key={role.id} className="p-2">
                  <p className="font-medium text-sm">{role.role_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {role.role_description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        {quest.rewards && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <h4 className="font-semibold mb-1 flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-600" />
              What You'll Earn
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {quest.rewards}
            </p>
          </div>
        )}
      </TabsContent>

      {/* Card Preview (Feed View) */}
      <TabsContent value="card" className="mt-4">
        <Card className="overflow-hidden max-w-sm mx-auto">
          {quest.image_url && (
            <div className="relative h-36">
              <img
                src={quest.image_url}
                alt={quest.title}
                className="w-full h-full object-cover"
              />
              {quest.is_sponsored && (
                <Badge className="absolute top-2 right-2 bg-sunset text-white text-xs">
                  Sponsored
                </Badge>
              )}
            </div>
          )}
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-xl">{quest.icon || '🎯'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{quest.title}</h3>
                {quest.theme && (
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {quest.theme}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {quest.start_datetime 
                  ? format(new Date(quest.start_datetime), 'MMM d')
                  : 'TBD'}
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                {quest.cost_description || 'Free'}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {quest.capacity_total || 6} spots
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {quest.default_duration_minutes || 120} min
              </div>
            </div>

            {/* Affinity match reason on card */}
            {topAffinity && (
              <p className="text-xs text-primary italic">
                ✨ {topAffinity.explanation?.slice(0, 60)}...
              </p>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2">
              {quest.short_description}
            </p>

            {quest.rewards && (
              <div className="bg-primary/5 rounded-md p-2 flex items-start gap-2">
                <Gift className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-primary line-clamp-2">
                  {quest.rewards}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
