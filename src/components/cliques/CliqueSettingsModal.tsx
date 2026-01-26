/**
 * CliqueSettingsModal - Leader-only settings for clique governance
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCliqueGovernance } from '@/hooks/useCliqueGovernance';
import { Loader2, Copy, RefreshCw, Archive, UserMinus, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface CliqueMember {
  user_id: string;
  display_name: string;
  role: 'leader' | 'member';
}

interface CliqueSettings {
  name: string;
  invite_code: string;
  theme_tags: string[];
  commitment_style: string;
  org_code: string | null;
  clique_rules: string | null;
  lfc_listing_enabled: boolean;
  role_rotation_mode: 'manual' | 'per_quest' | 'monthly';
  archived_at: string | null;
}

interface CliqueSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliqueId: string;
  settings: CliqueSettings;
  members: CliqueMember[];
  currentUserId: string;
}

const THEME_TAG_OPTIONS = [
  { value: 'movies', label: '🎬 Movies' },
  { value: 'music', label: '🎵 Music' },
  { value: 'outdoors', label: '🥾 Outdoors' },
  { value: 'food', label: '🍕 Food' },
  { value: 'games', label: '🎮 Games' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'arts', label: '🎨 Arts' },
  { value: 'books', label: '📚 Books' },
  { value: 'tech', label: '💻 Tech' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'nightlife', label: '🌃 Nightlife' },
];

export function CliqueSettingsModal({
  open,
  onOpenChange,
  cliqueId,
  settings,
  members,
  currentUserId,
}: CliqueSettingsModalProps) {
  const governance = useCliqueGovernance(cliqueId);

  // Local state for form
  const [name, setName] = useState(settings.name);
  const [themeTags, setThemeTags] = useState<string[]>(settings.theme_tags || []);
  const [commitmentStyle, setCommitmentStyle] = useState(settings.commitment_style || 'casual');
  const [orgCode, setOrgCode] = useState(settings.org_code || '');
  const [cliqueRules, setCliqueRules] = useState(settings.clique_rules || '');
  const [lfcEnabled, setLfcEnabled] = useState(settings.lfc_listing_enabled || false);
  const [roleRotation, setRoleRotation] = useState<'manual' | 'per_quest' | 'monthly'>(
    settings.role_rotation_mode || 'manual'
  );

  // Dialog states
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(settings.name);
      setThemeTags(settings.theme_tags || []);
      setCommitmentStyle(settings.commitment_style || 'casual');
      setOrgCode(settings.org_code || '');
      setCliqueRules(settings.clique_rules || '');
      setLfcEnabled(settings.lfc_listing_enabled || false);
      setRoleRotation(settings.role_rotation_mode || 'manual');
    }
  }, [open, settings]);

  const handleSave = async () => {
    // Save name if changed
    if (name !== settings.name) {
      await governance.renameClique(name);
    }

    // Save other settings
    await governance.updateSettings({
      theme_tags: themeTags,
      commitment_style: commitmentStyle,
      org_code: orgCode || undefined,
      clique_rules: cliqueRules || undefined,
      lfc_listing_enabled: lfcEnabled,
      role_rotation_mode: roleRotation,
    });

    onOpenChange(false);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(settings.invite_code);
    toast.success('Invite code copied!');
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/join/${settings.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  const handleRegenerateCode = async () => {
    await governance.regenerateInviteCode();
  };

  const handleArchive = async () => {
    await governance.archiveClique();
    setShowArchiveDialog(false);
    onOpenChange(false);
  };

  const handleReactivate = async () => {
    await governance.reactivateClique();
  };

  const handleTransferLeadership = async () => {
    if (!newLeaderId) return;
    await governance.transferLeadership(newLeaderId);
    setShowTransferDialog(false);
    onOpenChange(false);
  };

  const toggleTag = (tag: string) => {
    if (themeTags.includes(tag)) {
      setThemeTags(themeTags.filter(t => t !== tag));
    } else if (themeTags.length < 5) {
      setThemeTags([...themeTags, tag]);
    }
  };

  const isArchived = !!settings.archived_at;
  const otherMembers = members.filter(m => m.user_id !== currentUserId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clique Settings</DialogTitle>
            <DialogDescription>
              Manage your clique's settings and governance options.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Clique Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Clique Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter clique name"
                disabled={isArchived}
              />
            </div>

            {/* Invite Code */}
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                  {settings.invite_code}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleRegenerateCode}
                  disabled={governance.isRegeneratingCode || isArchived}
                >
                  {governance.isRegeneratingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={handleCopyInviteLink}
              >
                Copy shareable link
              </Button>
            </div>

            {/* Theme Tags */}
            <div className="space-y-2">
              <Label>Theme Tags (up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_TAG_OPTIONS.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={themeTags.includes(tag.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => !isArchived && toggleTag(tag.value)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Commitment Style */}
            <div className="space-y-2">
              <Label>Commitment Style</Label>
              <Select
                value={commitmentStyle}
                onValueChange={setCommitmentStyle}
                disabled={isArchived}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual - meet when it works</SelectItem>
                  <SelectItem value="ritual">Ritual - regular schedule</SelectItem>
                  <SelectItem value="quest-based">Quest-Based - specific adventures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organization Code */}
            <div className="space-y-2">
              <Label htmlFor="org">Organization (optional)</Label>
              <Input
                id="org"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                placeholder="e.g. UT-AUSTIN"
                disabled={isArchived}
              />
            </div>

            {/* Clique Rules */}
            <div className="space-y-2">
              <Label htmlFor="rules">Clique Rules (optional)</Label>
              <Textarea
                id="rules"
                value={cliqueRules}
                onChange={(e) => setCliqueRules(e.target.value)}
                placeholder="Any norms or expectations for members..."
                rows={3}
                disabled={isArchived}
              />
            </div>

            {/* LFC Listing */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Looking for Clique Listing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to discover and apply to join
                </p>
              </div>
              <Switch
                checked={lfcEnabled}
                onCheckedChange={setLfcEnabled}
                disabled={isArchived}
              />
            </div>

            {/* Role Rotation */}
            <div className="space-y-2">
              <Label>Role Rotation</Label>
              <Select
                value={roleRotation}
                onValueChange={(v) => setRoleRotation(v as typeof roleRotation)}
                disabled={isArchived}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual - leader assigns</SelectItem>
                  <SelectItem value="per_quest">Per Quest - rotate each quest</SelectItem>
                  <SelectItem value="monthly">Monthly - rotate each month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-destructive">Danger Zone</Label>

              <div className="flex flex-wrap gap-2">
                {otherMembers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransferDialog(true)}
                    disabled={isArchived}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Transfer Leadership
                  </Button>
                )}

                {isArchived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReactivate}
                    disabled={governance.isReactivating}
                  >
                    {governance.isReactivating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Reactivate Clique
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setShowArchiveDialog(true)}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive Clique
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={governance.isUpdatingSettings || governance.isRenaming || isArchived}
            >
              {(governance.isUpdatingSettings || governance.isRenaming) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this clique?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived cliques become read-only. Chat history, lore, and photos are preserved.
              You can reactivate the clique at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {governance.isArchiving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Leadership Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Leadership</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a new leader for this clique. You'll become a regular member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newLeaderId} onValueChange={setNewLeaderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new leader..." />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferLeadership}
              disabled={!newLeaderId || governance.isTransferring}
            >
              {governance.isTransferring && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
