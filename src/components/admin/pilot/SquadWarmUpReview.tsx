/**
 * Squad Warm-Up Review Panel
 * 
 * Admin-facing component for reviewing squad warm-up progress
 * and approving squads for quest instruction access.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  Users, 
  Clock,
  AlertTriangle,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useAdminSquadWarmUp } from '@/hooks/useSquadWarmUp';
import { SQUAD_STATUS_LABELS, SQUAD_STATUS_STYLES, calculateWarmUpProgress, SquadStatus } from '@/lib/squadLifecycle';

interface SquadWarmUpReviewProps {
  squadId: string;
  onClose?: () => void;
}

export function SquadWarmUpReview({ squadId, onClose }: SquadWarmUpReviewProps) {
  const {
    squadData,
    isLoading,
    approveSquad,
    holdSquad,
    isApproving,
    isHolding,
  } = useAdminSquadWarmUp(squadId);

  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showForceApproveDialog, setShowForceApproveDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{ name: string; response: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!squadData) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Squad not found or no data available.
      </div>
    );
  }

  const { squad, members, messages } = squadData;
  const squadStatus = squad.status as SquadStatus;
  const statusStyles = SQUAD_STATUS_STYLES[squadStatus] || SQUAD_STATUS_STYLES.draft;
  
  // Calculate progress
  const progress = calculateWarmUpProgress(
    members.map(m => ({
      prompt_response: m.prompt_response,
      readiness_confirmed_at: m.readiness_confirmed_at,
      status: m.status,
    })),
    100 // Default to 100% required
  );

  const isReadyForApproval = squadStatus === 'ready_for_review';
  const isInWarmUp = squadStatus === 'warming_up';
  const isAlreadyApproved = ['approved', 'active', 'completed'].includes(squadStatus);
  const squadName = squad.name || 'Unnamed Squad';

  const handleApprove = () => {
    approveSquad({ notes: approvalNotes, force: false });
    setShowApproveDialog(false);
    setApprovalNotes('');
  };

  const handleForceApprove = () => {
    approveSquad({ notes: approvalNotes, force: true });
    setShowForceApproveDialog(false);
    setApprovalNotes('');
  };

  const handleHold = () => {
    holdSquad(approvalNotes);
    setShowHoldDialog(false);
    setApprovalNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{squadName}</h3>
          <p className="text-muted-foreground text-sm">
            {squad.quest_instances?.title} · {squad.quest_instances?.scheduled_date && 
              format(new Date(squad.quest_instances.scheduled_date), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge className={`${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border}`}>
          {SQUAD_STATUS_LABELS[squadStatus] || squadStatus}
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Warm-Up Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{progress.readyMembers} of {progress.totalMembers} members ready</span>
              <span className={progress.isComplete ? 'text-emerald-600 font-medium' : ''}>
                {progress.percentage}%
              </span>
            </div>
            <Progress 
              value={progress.percentage} 
              className={`h-3 ${progress.isComplete ? '[&>div]:bg-emerald-500' : ''}`}
            />
            
            {progress.isComplete && !isAlreadyApproved && (
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All required members are ready for approval
              </p>
            )}
            {!progress.isComplete && isInWarmUp && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Waiting for more members to complete warm-up
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs defaultValue="checklist">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Member Checklist</TabsTrigger>
          <TabsTrigger value="responses">Prompt Responses</TabsTrigger>
          <TabsTrigger value="chat">Chat Transcript</TabsTrigger>
        </TabsList>

        {/* Member Checklist */}
        <TabsContent value="checklist">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-center">Prompt Answered</TableHead>
                  <TableHead className="text-center">Readiness Confirmed</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const hasPrompt = !!member.prompt_response;
                  const hasConfirmed = !!member.readiness_confirmed_at;
                  const isComplete = hasPrompt && hasConfirmed;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.display_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {hasPrompt ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span className="text-xs text-muted-foreground">
                              {member.warm_up_progress?.prompt_answered_at
                                ? format(new Date(member.warm_up_progress.prompt_answered_at as string), 'h:mm a')
                                : ''}
                            </span>
                          </div>
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasConfirmed ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(member.readiness_confirmed_at!), 'h:mm a')}
                            </span>
                          </div>
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {member.status === 'dropped' ? (
                          <Badge variant="destructive" className="text-xs">Dropped</Badge>
                        ) : isComplete ? (
                          <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">In Progress</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Prompt Responses */}
        <TabsContent value="responses">
          <Card>
            <CardContent className="pt-4">
              {members.filter(m => m.prompt_response).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No prompt responses yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {members.filter(m => m.prompt_response).map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{member.display_name || 'Unknown'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResponse({
                            name: member.display_name || 'Unknown',
                            response: member.prompt_response!,
                          })}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Full
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {member.prompt_response}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Transcript */}
        <TabsContent value="chat">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[300px]">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No chat messages yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const sender = members.find(m => m.user_id === msg.sender_id);
                      
                      return (
                        <div
                          key={msg.id}
                          className={`text-sm ${msg.is_prompt_response ? 'bg-primary/5 border border-primary/20 rounded-lg p-2' : ''}`}
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {sender?.display_name || 'Unknown'}
                            </span>
                            {msg.is_prompt_response && (
                              <Badge variant="outline" className="text-[10px] h-4">
                                Prompt Response
                              </Badge>
                            )}
                            <span>{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="mt-1">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {!isAlreadyApproved && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admin Actions</CardTitle>
            <CardDescription>
              {isReadyForApproval 
                ? 'Squad is ready for your review and approval.'
                : isInWarmUp
                  ? 'Squad is still in warm-up phase. You can force approve if needed.'
                  : 'Review squad status and take action.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {isReadyForApproval && (
                <Button onClick={() => setShowApproveDialog(true)} disabled={isApproving}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Approve Squad
                </Button>
              )}
              
              {(isInWarmUp || isReadyForApproval) && (
                <Button
                  variant="outline"
                  onClick={() => setShowForceApproveDialog(true)}
                  disabled={isApproving}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Force Approve
                </Button>
              )}
              
              {isReadyForApproval && (
                <Button
                  variant="secondary"
                  onClick={() => setShowHoldDialog(true)}
                  disabled={isHolding}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Hold Squad
                </Button>
              )}
            </div>
            
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Squad</DialogTitle>
            <DialogDescription>
              This will unlock quest instructions for all squad members.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add approval notes (optional)..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve Squad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Approve Dialog */}
      <AlertDialog open={showForceApproveDialog} onOpenChange={setShowForceApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Approve Squad?</AlertDialogTitle>
            <AlertDialogDescription>
              This will override the warm-up requirements and immediately unlock quest instructions.
              This action is logged for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for force approval (required)..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceApprove}
              disabled={!approvalNotes.trim() || isApproving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Force Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hold Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hold Squad</DialogTitle>
            <DialogDescription>
              This will return the squad to warm-up phase. Add notes explaining why.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for holding (optional)..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleHold} disabled={isHolding}>
              {isHolding ? 'Holding...' : 'Hold Squad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedResponse?.name}'s Response</DialogTitle>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4">
            <p className="whitespace-pre-wrap">{selectedResponse?.response}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
