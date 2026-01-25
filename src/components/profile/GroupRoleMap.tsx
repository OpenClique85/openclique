/**
 * =============================================================================
 * GroupRoleMap - Shows self vs others group role perception
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Lock, Users, User, Check } from 'lucide-react';
import { useGroupRoles, ROLE_METADATA, type RoleType } from '@/hooks/useGroupRoles';
import { cn } from '@/lib/utils';

interface GroupRoleMapProps {
  userId?: string;
  compact?: boolean;
}

export function GroupRoleMap({ userId, compact = false }: GroupRoleMapProps) {
  const {
    selfTotals,
    othersTotals,
    canShowOthersView,
    signalsUntilOthersView,
    questsUntilOthersView,
    dominantSelfRole,
    positiveOverlaps,
    isLoading,
    isOwner,
    addSelfRole,
    isUpdating,
  } = useGroupRoles(userId);

  const [activeTab, setActiveTab] = useState<'self' | 'others'>('self');
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  if (isLoading) {
    return (
      <Card className={cn(compact ? 'p-4' : '')}>
        <CardContent className="pt-6">
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roles: RoleType[] = ['planner', 'connector', 'stabilizer', 'spark'];
  const currentTotals = activeTab === 'self' ? selfTotals : othersTotals;

  const handleRoleSelect = async (role: RoleType) => {
    if (!isOwner) return;
    setSelectedRole(role);
    await addSelfRole(role);
    setSelectedRole(null);
  };

  return (
    <Card className={cn(compact ? 'p-4' : '')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Group Role Map</CardTitle>
            {positiveOverlaps.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {positiveOverlaps.length} confirmed
              </Badge>
            )}
          </div>
        </div>
        {dominantSelfRole && (
          <p className="text-sm text-muted-foreground">
            You bring {ROLE_METADATA[dominantSelfRole].label.toLowerCase()} to groups
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs for Self vs Others */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'self' | 'others')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="self" className="gap-2">
              <User className="h-4 w-4" />
              Your View
            </TabsTrigger>
            <TabsTrigger value="others" className="gap-2" disabled={!canShowOthersView}>
              <Users className="h-4 w-4" />
              Others Notice
              {!canShowOthersView && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="self" className="space-y-4 mt-4">
            {/* Role bars */}
            {roles.map((role) => {
              const meta = ROLE_METADATA[role];
              const value = currentTotals[role];
              const isOverlap = positiveOverlaps.includes(role);

              return (
                <div key={role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-sm font-medium">{meta.label}</span>
                      {isOverlap && canShowOthersView && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Check className="h-3 w-3" />
                          Others agree
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{value}%</span>
                  </div>
                  <Progress 
                    value={value} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
              );
            })}

            {/* Self-report buttons for owner */}
            {isOwner && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Which role feels most like you?</p>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => {
                    const meta = ROLE_METADATA[role];
                    return (
                      <Button
                        key={role}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => handleRoleSelect(role)}
                        disabled={isUpdating && selectedRole === role}
                      >
                        <span>{meta.icon}</span>
                        <span className="truncate">{meta.label.replace(' Energy', '')}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="others" className="space-y-4 mt-4">
            {canShowOthersView ? (
              <>
                {roles.map((role) => {
                  const meta = ROLE_METADATA[role];
                  const value = othersTotals[role];

                  return (
                    <div key={role} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <span className="text-sm font-medium">{meta.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{value}%</span>
                      </div>
                      <Progress 
                        value={value} 
                        className="h-2" 
                      />
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Based on squad appreciation and feedback
                </p>
              </>
            ) : (
              <div className="py-8 text-center">
                <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-2">Keep questing to unlock</p>
                <p className="text-xs text-muted-foreground">
                  {signalsUntilOthersView > 0 && (
                    <span>{signalsUntilOthersView} more appreciation{signalsUntilOthersView > 1 ? 's' : ''} needed</span>
                  )}
                  {signalsUntilOthersView > 0 && questsUntilOthersView > 0 && ' • '}
                  {questsUntilOthersView > 0 && (
                    <span>{questsUntilOthersView} more quest{questsUntilOthersView > 1 ? 's' : ''} needed</span>
                  )}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
