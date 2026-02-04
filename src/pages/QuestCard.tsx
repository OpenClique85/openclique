/**
 * Mobile Quest Card
 * 
 * Public mobile-first page for quest participants to:
 * - View quest details
 * - Confirm attendance
 * - Check in
 * - Upload proof
 * - View completion/XP
 * 
 * Accessed via tokenized URL - no login required.
 */

import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { GetHelpButton } from '@/components/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, Calendar, Clock, Users, Package, 
  Shield, CheckCircle, Camera, Video, FileText,
  MessageSquare, Loader2, AlertCircle, ExternalLink,
  Star, Trophy, MessageCircleMore, ArrowLeft, Target
} from 'lucide-react';

interface QuestInstanceData {
  id: string;
  title: string;
  icon: string;
  status: string;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  meeting_point_name: string | null;
  meeting_point_address: string | null;
  what_to_bring: string | null;
  safety_notes: string | null;
  check_in_opens_at: string | null;
  check_in_closes_at: string | null;
  xp_rules: any;
  objectives: string | null;
}

interface ParticipantData {
  id: string;
  user_id: string;
  status: string;
  checked_in_at: string | null;
  completed_at: string | null;
  squad_id?: string;
  squad_name?: string;
  squad_status?: string;
}

export default function QuestCard() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textNote, setTextNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch quest instance by token
  const { data, isLoading, error } = useQuery({
    queryKey: ['quest-card', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      
      // Get instance by token
      const { data: instance, error: instanceError } = await supabase
        .from('quest_instances')
        .select('*')
        .eq('quest_card_token', token)
        .single();
      
      if (instanceError) throw instanceError;
      
      // Get participant data if user is logged in
      let participant: ParticipantData | null = null;
      if (user) {
        const { data: signup } = await supabase
          .from('quest_signups')
          .select(`
            id, user_id, status, checked_in_at, completed_at
          `)
          .eq('instance_id', instance.id)
          .eq('user_id', user.id)
          .single();
        
        if (signup) {
          // Get squad membership separately
          const { data: squadMember } = await supabase
            .from('squad_members')
            .select(`
              quest_squads(id, squad_name, status)
            `)
            .eq('user_id', user.id)
            .eq('quest_squads.instance_id', instance.id)
            .maybeSingle();
          
          const squadData = squadMember?.quest_squads as any;
          
          participant = {
            id: signup.id,
            user_id: signup.user_id,
            status: signup.status,
            checked_in_at: signup.checked_in_at,
            completed_at: signup.completed_at,
            squad_id: squadData?.id,
            squad_name: squadData?.squad_name,
            squad_status: squadData?.status,
          };
        }
      }

      // Get proof submission count
      let proofCount = 0;
      if (user) {
        const { count } = await supabase
          .from('participant_proofs')
          .select('*', { count: 'exact', head: true })
          .eq('instance_id', instance.id)
          .eq('user_id', user.id);
        proofCount = count || 0;
      }
      
      return { 
        instance: instance as QuestInstanceData, 
        participant,
        proofCount 
      };
    },
    enabled: !!token,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!data?.participant) throw new Error('Not signed up');
      
      const { error } = await supabase
        .from('quest_signups')
        .update({ 
          checked_in_at: new Date().toISOString(),
          status: 'confirmed'
        })
        .eq('id', data.participant.id);
      
      if (error) throw error;

      // Log event
      await supabase.rpc('log_quest_event', {
        p_instance_id: data.instance.id,
        p_event_type: 'check_in' as any,
        p_actor_type: 'user',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-card', token] });
      toast({ title: 'Checked in! ✅' });
    },
    onError: (err: Error) => {
      toast({ title: 'Check-in failed', description: err.message, variant: 'destructive' });
    }
  });

  // Upload proof mutation
  const uploadProofMutation = useMutation({
    mutationFn: async ({ file, type, text }: { file?: File; type: string; text?: string }) => {
      if (!data?.instance || !user) throw new Error('Not authorized');
      
      let fileUrl = null;
      
      if (file) {
        const filePath = `${data.instance.id}/${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('pilot-proofs')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('pilot-proofs')
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('participant_proofs')
        .insert({
          instance_id: data.instance.id,
          user_id: user.id,
          proof_type: type,
          file_url: fileUrl,
          text_content: text || null,
        });
      
      if (error) throw error;

      // Update signup
      await supabase
        .from('quest_signups')
        .update({ proof_submitted_at: new Date().toISOString() })
        .eq('id', data.participant?.id);

      // Log event
      await supabase.rpc('log_quest_event', {
        p_instance_id: data.instance.id,
        p_event_type: 'proof_submitted' as any,
        p_actor_type: 'user',
        p_payload: { proof_type: type }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quest-card', token] });
      setTextNote('');
      toast({ title: 'Proof submitted! 📸' });
    },
    onError: (err: Error) => {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const type = file.type.startsWith('video/') ? 'video' : 'photo';
    await uploadProofMutation.mutateAsync({ file, type });
    setIsUploading(false);
  };

  const handleTextSubmit = async () => {
    if (!textNote.trim()) return;
    await uploadProofMutation.mutateAsync({ type: 'text_note', text: textNote });
  };

  // Render states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.instance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Quest Not Found</h1>
        <p className="text-muted-foreground text-center">
          This quest link may have expired or is invalid.
        </p>
      </div>
    );
  }

  const { instance, participant, proofCount } = data;
  const isCheckedIn = !!participant?.checked_in_at;
  const isCompleted = !!participant?.completed_at;
  const hasProof = proofCount > 0;
  
  // Check if squad is in warm-up phase
  const isSquadWarmingUp = participant?.squad_status === 'warming_up' || participant?.squad_status === 'ready_for_review';

  // Check-in window
  const now = new Date();
  const checkInOpen = instance.check_in_opens_at ? new Date(instance.check_in_opens_at) <= now : true;
  const checkInClosed = instance.check_in_closes_at ? new Date(instance.check_in_closes_at) < now : false;
  const canCheckIn = checkInOpen && !checkInClosed && !isCheckedIn;

  const eventDate = new Date(`${instance.scheduled_date}T${instance.start_time}`);
  const isPast = eventDate < now;

  return (
    <div className="min-h-dvh bg-background pb-24">
      {/* Floating Help Button */}
      <GetHelpButton
        variant="floating"
        contextQuestId={instance.id}
        contextQuestTitle={instance.title}
        contextSquadId={participant?.squad_id}
        contextSquadName={participant?.squad_name}
      />
      
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sm:p-6 pb-6 sm:pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl sm:text-4xl">{instance.icon}</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">{instance.title}</h1>
              {participant?.squad_name && (
                <Badge variant="secondary" className="mt-1">
                  Squad: {participant.squad_name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 -mt-4 space-y-4">
        {/* Quick Info Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {instance.start_time?.slice(0, 5)} - {instance.end_time?.slice(0, 5) || 'TBD'}
                </p>
              </div>
            </div>

            {instance.meeting_point_name && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{instance.meeting_point_name}</p>
                  {instance.meeting_point_address && (
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(instance.meeting_point_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline flex items-center gap-1"
                    >
                      Get directions <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {instance.what_to_bring && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">What to Bring</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {instance.what_to_bring}
                  </p>
                </div>
              </div>
            )}

            {instance.safety_notes && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Safety Note</p>
                  <p className="text-sm text-amber-700">{instance.safety_notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status-based Action Cards */}
        
        {/* Squad Warm-Up Redirect */}
        {participant && isSquadWarmingUp && participant.squad_id && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircleMore className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Squad Warm-Up in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Meet your squad and confirm readiness before quest details unlock
                  </p>
                </div>
              </div>
              <Link to={`/warmup/${participant.squad_id}`}>
                <Button className="w-full">
                  <MessageCircleMore className="h-4 w-4 mr-2" />
                  Join Warm-Up Chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Check-in */}
        {participant && !isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${isCheckedIn ? 'text-green-600' : 'text-muted-foreground'}`} />
                Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCheckedIn ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Checked in at {new Date(participant.checked_in_at!).toLocaleTimeString()}</span>
                </div>
              ) : canCheckIn ? (
                <Button 
                  className="w-full" 
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Check In Now
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {!checkInOpen ? 'Check-in not open yet' : 'Check-in window closed'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Proof Upload */}
        {participant && isCheckedIn && !isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submit Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a photo, video, or note to prove you completed the quest.
              </p>
              
              {/* File upload */}
              <input
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Photo/Video
                    </>
                  )}
                </Button>
              </div>

              {/* Text note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Or write a quick note about your experience..."
                  value={textNote}
                  onChange={(e) => setTextNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTextSubmit}
                  disabled={!textNote.trim() || uploadProofMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Note
                </Button>
              </div>

              {hasProof && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {proofCount} proof(s) submitted - pending review
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed State */}
        {isCompleted && (
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Quest Complete!</h3>
                <p className="text-sm text-green-700">
                  Completed {new Date(participant!.completed_at!).toLocaleDateString()}
                </p>
              </div>
              
              {/* XP Earned */}
              {instance.xp_rules && (
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-muted-foreground mb-2">XP Earned</p>
                  <p className="text-3xl font-bold text-primary">
                    +{instance.xp_rules.base_xp || 100}
                  </p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = `/feedback/${instance.id}`}
              >
                <Star className="h-4 w-4 mr-2" />
                Leave Feedback (+50 XP)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Not signed up */}
        {!participant && user && (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                You're not signed up for this quest.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Not logged in */}
        {!user && (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Sign in to check in and submit proof.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Report Issue Link */}
        <div className="text-center py-4">
          <Button variant="link" className="text-muted-foreground">
            Report an Issue
          </Button>
        </div>
      </div>
    </div>
  );
}
