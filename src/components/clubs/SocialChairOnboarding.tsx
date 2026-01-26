/**
 * =============================================================================
 * SocialChairOnboarding - Multi-step wizard for new club admins
 * =============================================================================
 * 
 * Steps:
 * 1. Welcome: Explain the Social Chair role
 * 2. Dashboard Tour: Highlight key features
 * 3. Generate Invite Code: Create first club invite code
 * 4. Create First Quest: Quick quest creation
 * 5. Completion: Celebration and link to full dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Ticket,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Copy,
  Sparkles,
  Target,
  Megaphone,
  ArrowRight,
  Loader2,
  PartyPopper,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialChairOnboardingProps {
  clubId: string;
  clubName: string;
  clubSlug: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'tour', title: 'Dashboard Tour', icon: Target },
  { id: 'invite', title: 'Invite Members', icon: Ticket },
  { id: 'quest', title: 'First Quest', icon: Calendar },
  { id: 'complete', title: 'All Set!', icon: PartyPopper },
];

export function SocialChairOnboarding({ 
  clubId, 
  clubName, 
  clubSlug, 
  onComplete 
}: SocialChairOnboardingProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [maxUses, setMaxUses] = useState('50');

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateCode = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // Generate a unique code
      const code = `${clubSlug.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('org_invite_codes')
        .insert({
          org_id: clubId,
          code,
          created_by: user.id,
          max_uses: maxUses ? parseInt(maxUses) : null,
          is_active: true,
        });

      if (error) throw error;

      setGeneratedCode(code);
      toast.success('Invite code created!');
    } catch (error) {
      console.error('Failed to generate code:', error);
      toast.error('Failed to generate invite code');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInviteLink = () => {
    if (!generatedCode) return;
    const link = `${window.location.origin}/auth?org_invite=${generatedCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      // Mark onboarding as complete
      await supabase
        .from('profile_organizations')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('profile_id', user.id)
        .eq('org_id', clubId);

      onComplete();
    } catch (error) {
      console.error('Failed to mark onboarding complete:', error);
      onComplete();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold mb-2">
                Welcome, Social Chair! 🎉
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You're now the Social Chair for <strong>{clubName}</strong>. 
                Let's get you set up to manage events and build community.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-lg bg-muted/50">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Invite Members</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Create Quests</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Megaphone className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Broadcast</p>
              </div>
            </div>
          </div>
        );

      case 1: // Dashboard Tour
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold mb-2">
                Your Dashboard
              </h2>
              <p className="text-muted-foreground">
                Here's what you can do as Social Chair
              </p>
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Event Command Center</h3>
                    <p className="text-sm text-muted-foreground">
                      View RSVPs, manage cliques, and track event health
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Clique Operations</h3>
                    <p className="text-sm text-muted-foreground">
                      See all formed cliques, their status, and ready checks
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Broadcast Composer</h3>
                    <p className="text-sm text-muted-foreground">
                      Send messages to all cliques, leaders, or specific groups
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2: // Generate Invite Code
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold mb-2">
                Invite Your Members
              </h2>
              <p className="text-muted-foreground">
                Generate an invite code to share with your club members
              </p>
            </div>
            
            {!generatedCode ? (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="max-uses">Max Uses (optional)</Label>
                  <Input
                    id="max-uses"
                    type="number"
                    placeholder="50"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited uses
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateCode} 
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      Generate Invite Code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-w-md mx-auto">
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your Invite Code</p>
                    <p className="text-2xl font-mono font-bold text-primary">
                      {generatedCode}
                    </p>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      toast.success('Code copied!');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button className="flex-1" onClick={copyInviteLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Share this code or link with your club members so they can join!
                </p>
              </div>
            )}
          </div>
        );

      case 3: // First Quest
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold mb-2">
                Create Your First Quest
              </h2>
              <p className="text-muted-foreground">
                Ready to plan your first club event?
              </p>
            </div>
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  You can create quests from the dashboard or skip this for now.
                </p>
                <Button 
                  onClick={() => navigate(`/quests/new?org=${clubId}`)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Quest
                </Button>
              </CardContent>
            </Card>
            <p className="text-sm text-center text-muted-foreground">
              You can always create quests later from your dashboard
            </p>
          </div>
        );

      case 4: // Complete
        return (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold mb-2">
                You're All Set! 🎉
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You're ready to manage <strong>{clubName}</strong>. 
                Head to your dashboard to start building community.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={handleComplete} size="lg">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="ghost" onClick={handleComplete}>
                Skip for now
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[500px] flex flex-col">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">
            Step {currentStep + 1} of {STEPS.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep].title}
          </p>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div 
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isCurrent 
                    ? 'text-primary' 
                    : isComplete 
                      ? 'text-green-600' 
                      : 'text-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isCurrent 
                    ? 'bg-primary/10' 
                    : isComplete 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-muted/50'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {currentStep < STEPS.length - 1 && (
        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === STEPS.length - 2 ? 'Finish' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

