/**
 * CliqueRolesManager - UI for viewing and managing soft clique roles
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCliqueRoles, CLIQUE_ROLE_METADATA, ALL_CLIQUE_ROLES, CliqueRoleType } from '@/hooks/useCliqueRoles';
import { Loader2, UserPlus, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CliqueMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface CliqueRolesManagerProps {
  cliqueId: string;
  members: CliqueMember[];
  isLeader: boolean;
  currentUserId: string;
}

export function CliqueRolesManager({
  cliqueId,
  members,
  isLeader,
  currentUserId,
}: CliqueRolesManagerProps) {
  const {
    roleAssignments,
    isLoading,
    getRoleAssignment,
    assignRole,
    declineRole,
    unassignRole,
    isAssigning,
    isDeclining,
  } = useCliqueRoles(cliqueId);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CliqueRoleType | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const handleAssignRole = async () => {
    if (!selectedRole || !selectedMemberId) return;
    await assignRole(selectedMemberId, selectedRole);
    setAssignDialogOpen(false);
    setSelectedRole(null);
    setSelectedMemberId('');
  };

  const handleDeclineRole = async (role: CliqueRoleType) => {
    await declineRole(role);
  };

  const handleUnassignRole = async (role: CliqueRoleType) => {
    await unassignRole(role);
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return userId === currentUserId ? 'You' : member?.display_name || 'Unknown';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            Clique Roles
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Soft roles help coordinate your clique. They're optional, rotating, and anyone can decline.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          {isLeader && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Assign Role
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ALL_CLIQUE_ROLES.map((role) => {
            const metadata = CLIQUE_ROLE_METADATA[role];
            const assignment = getRoleAssignment(role);
            const isAssignedToMe = assignment?.user_id === currentUserId;

            return (
              <div
                key={role}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{metadata.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metadata.label}</span>
                      {assignment && (
                        <Badge variant="secondary" className="text-xs">
                          {getMemberName(assignment.user_id)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metadata.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAssignedToMe && !assignment?.declined_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => handleDeclineRole(role)}
                      disabled={isDeclining}
                    >
                      Decline
                    </Button>
                  )}
                  {isLeader && assignment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleUnassignRole(role)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {!assignment && (
                    <span className="text-sm text-muted-foreground italic">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Choose a role and member. Roles are soft and can be declined.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRole || ''}
                onValueChange={(v) => setSelectedRole(v as CliqueRoleType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CLIQUE_ROLES.map((role) => {
                    const metadata = CLIQUE_ROLE_METADATA[role];
                    const isAssigned = !!getRoleAssignment(role);
                    return (
                      <SelectItem key={role} value={role} disabled={isAssigned}>
                        <span className="flex items-center gap-2">
                          <span>{metadata.icon}</span>
                          <span>{metadata.label}</span>
                          {isAssigned && (
                            <span className="text-muted-foreground text-xs">(assigned)</span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Member</label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user_id === currentUserId ? 'Yourself' : member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedRole || !selectedMemberId || isAssigning}
            >
              {isAssigning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
