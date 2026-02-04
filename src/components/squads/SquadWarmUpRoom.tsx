/**
 * Squad Warm-Up Room
 * 
 * User-facing component for squad warm-up phase.
 * Includes chat, prompt response, and readiness confirmation.
 */

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Users, CheckCircle2, MessageCircle, Lock, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSquadWarmUp } from '@/hooks/useSquadWarmUp';
import { SQUAD_STATUS_LABELS, shouldShowInstructions, SquadStatus } from '@/lib/squadLifecycle';
import { MemberProfileSheet } from './MemberProfileSheet';

interface SquadWarmUpRoomProps {
  squadId: string;
  onInstructionsUnlocked?: () => void;
}

export function SquadWarmUpRoom({ squadId, onInstructionsUnlocked }: SquadWarmUpRoomProps) {
  const {
    squad,
    members,
    prompt,
    messages,
    isLoading,
    currentMember,
    hasAnsweredPrompt,
    hasConfirmedReadiness,
    progress,
    sendMessage,
    submitPromptResponse,
    confirmReadiness,
    isSending,
    isSubmittingPrompt,
    isConfirmingReadiness,
  } = useSquadWarmUp(squadId);

  const [chatInput, setChatInput] = useState('');
  const [promptResponse, setPromptResponse] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notify when instructions unlock
  useEffect(() => {
    if (squad && shouldShowInstructions(squad.status)) {
      onInstructionsUnlocked?.();
    }
  }, [squad?.status, onInstructionsUnlocked]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleSubmitPrompt = () => {
    if (!promptResponse.trim()) return;
    submitPromptResponse(promptResponse.trim());
    setPromptResponse('');
  };

  const handleConfirmReadiness = () => {
    confirmReadiness();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!squad) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Squad not found</AlertTitle>
        <AlertDescription>Unable to load warm-up room data.</AlertDescription>
      </Alert>
    );
  }

  const questInstance = squad.quest_instances;
  const isApproved = shouldShowInstructions(squad.status);
  const squadName = squad.name || 'Your Squad';

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">{squadName}</h2>
          <p className="text-sm text-muted-foreground">
            {questInstance?.title} · {questInstance?.scheduled_date && format(new Date(questInstance.scheduled_date), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant="outline" className="text-xs sm:text-sm">
          {SQUAD_STATUS_LABELS[squad.status as SquadStatus] || squad.status}
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Squad Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.readyMembers} of {progress.totalMembers} fully ready</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            
            {/* Progress breakdown */}
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <div className="flex justify-between">
                <span>Answered prompts</span>
                <span>{progress.promptAnswered}/{progress.totalMembers} (50%)</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmed ready</span>
                <span>{progress.readinessConfirmed}/{progress.totalMembers} (50%)</span>
              </div>
            </div>
            
            {/* Member Status List */}
            <div className="flex flex-wrap gap-2 mt-3">
              {members.map((member) => {
                const hasPrompt = !!member.prompt_response;
                const hasReadiness = !!member.readiness_confirmed_at;
                const isFullyReady = hasPrompt && hasReadiness;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedMemberId(member.user_id);
                      setProfileSheetOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={isFullyReady ? 'bg-emerald-500/20' : hasPrompt || hasReadiness ? 'bg-amber-500/20' : 'bg-muted'}>
                        {member.display_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={isFullyReady ? 'text-emerald-600' : hasPrompt || hasReadiness ? 'text-amber-600' : 'text-muted-foreground'}>
                      {member.display_name || 'Member'}
                    </span>
                    {/* Show individual checkmarks */}
                    {hasReadiness && <CheckCircle2 className="h-3 w-3 text-emerald-500" title="Ready" />}
                    {hasPrompt && !hasReadiness && <CheckCircle2 className="h-3 w-3 text-amber-500" title="Answered prompt" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approved State */}
      {isApproved && (
        <Alert className="bg-emerald-500/10 border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-700 dark:text-emerald-300">Squad Approved!</AlertTitle>
          <AlertDescription className="text-emerald-600 dark:text-emerald-400">
            Quest instructions are now unlocked. Check your quest details page for briefing info.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      {!isApproved && (
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Chat Section */}
          <Card className="flex flex-col h-[300px] sm:h-[400px]">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Squad Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col px-4 sm:px-6 overflow-hidden">
              <ScrollArea className="flex-1 pr-2 sm:pr-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Be the first to say hello! 👋
                    </p>
                  )}
                  {messages.map((msg) => {
                    const isBuggs = msg.sender_type === 'buggs';
                    const isAdmin = msg.sender_type === 'admin';
                    const isSystem = msg.sender_type === 'system';
                    const isPromptResponse = msg.message.startsWith('📝 **Prompt Response:**');
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col rounded-lg p-2 ${
                          isBuggs 
                            ? 'bg-orange-500/10 border border-orange-500/30' 
                            : isAdmin
                              ? 'bg-primary/5 border border-primary/20'
                              : isSystem
                                ? 'bg-muted border border-border'
                                : isPromptResponse
                                  ? 'bg-primary/5 border border-primary/20'
                                  : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {isBuggs ? '🐰 BUGGS' : isAdmin ? '🛡️ Admin' : isSystem ? '⚙️ System' : msg.sender_name}
                          </span>
                          {isPromptResponse && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              Prompt Response
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{msg.message}</p>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <Separator className="my-2 sm:my-3" />
              
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Say something to your squad..."
                  className="min-h-[50px] sm:min-h-[60px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isSending}
                  className="min-h-[48px] min-w-[48px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prompt & Readiness Section */}
          <div className="space-y-4">
            {/* Warm-Up Prompt */}
            <Card className={hasAnsweredPrompt ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Step 1: Answer the Prompt
                  </span>
                  {hasAnsweredPrompt && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prompt && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-4 border">
                    <p className="font-medium text-sm mb-1">{prompt.name}</p>
                    <p className="text-foreground">{prompt.body}</p>
                  </div>
                )}
                
                {hasAnsweredPrompt ? (
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    You've answered the prompt!
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={promptResponse}
                      onChange={(e) => setPromptResponse(e.target.value)}
                      placeholder="Share your response with the squad..."
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={handleSubmitPrompt}
                      disabled={!promptResponse.trim() || isSubmittingPrompt}
                      className="w-full min-h-[48px]"
                    >
                      {isSubmittingPrompt ? 'Submitting...' : 'Submit Response'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Readiness Confirmation */}
            <Card className={hasConfirmedReadiness ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Step 2: Confirm You're Ready
                  </span>
                  {hasConfirmedReadiness && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasConfirmedReadiness ? (
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    You're ready! Waiting for admin approval...
                  </div>
                ) : !hasAnsweredPrompt ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Complete Step 1 first
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>By confirming, you acknowledge that:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>You understand the quest timing and expectations</li>
                        <li>You're committed to showing up with your squad</li>
                        <li>Quest instructions will unlock after admin approval</li>
                      </ul>
                    </div>
                    <Button
                      onClick={handleConfirmReadiness}
                      disabled={isConfirmingReadiness}
                      className="w-full min-h-[48px]"
                      variant="default"
                    >
                      {isConfirmingReadiness ? 'Confirming...' : "I'm Ready"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      I understand the quest timing and expectations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waiting for Approval */}
            {progress.isComplete && squad.status === 'ready_for_review' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Waiting for Admin Approval</AlertTitle>
                <AlertDescription>
                  Your squad is ready! An admin will review and unlock the quest instructions shortly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Member Profile Sheet */}
      <MemberProfileSheet
        userId={selectedMemberId}
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
      />
    </div>
  );
}
