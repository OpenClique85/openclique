import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Feedback() {
  const { questId } = useParams<{ questId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quest, setQuest] = useState<{ title: string; icon: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  
  // Form state
  const [rating, setRating] = useState<number>(0);
  const [belongingDelta, setBelongingDelta] = useState<string>('');
  const [bestPart, setBestPart] = useState('');
  const [frictionPoint, setFrictionPoint] = useState('');
  const [wouldDoAgain, setWouldDoAgain] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!questId || !user) return;
      
      // Fetch quest details
      const { data: questData } = await supabase
        .from('quests')
        .select('title, icon')
        .eq('id', questId)
        .maybeSingle();
      
      if (questData) {
        setQuest({ title: questData.title, icon: questData.icon || '🎯' });
      }
      
      // Check if already submitted
      const { data: existingFeedback } = await supabase
        .from('feedback')
        .select('id')
        .eq('quest_id', questId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingFeedback) {
        setAlreadySubmitted(true);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [questId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questId || !user) return;
    
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Please rate your experience',
        description: 'Select 1-5 stars before submitting.'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('feedback')
      .insert({
        quest_id: questId,
        user_id: user.id,
        rating_1_5: rating,
        belonging_delta: belongingDelta ? parseInt(belongingDelta) : null,
        best_part: bestPart.trim() || null,
        friction_point: frictionPoint.trim() || null,
        would_do_again: wouldDoAgain === 'yes' ? true : wouldDoAgain === 'no' ? false : null
      });
    
    setIsSubmitting(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to submit feedback',
        description: 'Please try again.'
      });
      return;
    }
    
    setIsSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Quest not found</h1>
          <Button asChild>
            <Link to="/my-quests">Back to My Quests</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (alreadySubmitted || isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-lg">
          <Card className="text-center">
            <CardContent className="py-12">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold mb-2">
                {isSubmitted ? 'Thanks for your feedback!' : 'Already submitted'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isSubmitted 
                  ? 'Your feedback helps us create better experiences for everyone.'
                  : 'You\'ve already submitted feedback for this quest.'}
              </p>
              <Button asChild>
                <Link to="/my-quests">Back to My Quests</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <Link 
          to="/my-quests" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Quests
        </Link>
        
        <Card>
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">{quest.icon}</div>
            <CardTitle className="font-display">How was {quest.title}?</CardTitle>
            <CardDescription>
              Your feedback helps us improve. Takes about 60 seconds!
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="space-y-3">
                <Label>Overall, how was your experience?</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Belonging Delta */}
              <div className="space-y-3">
                <Label>After this quest, do you feel more connected to Austin?</Label>
                <RadioGroup
                  value={belongingDelta}
                  onValueChange={setBelongingDelta}
                  className="flex flex-wrap justify-center gap-2"
                >
                  {[
                    { value: '-2', label: 'Much less' },
                    { value: '-1', label: 'Less' },
                    { value: '0', label: 'Same' },
                    { value: '1', label: 'More' },
                    { value: '2', label: 'Much more' },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center">
                      <RadioGroupItem
                        value={option.value}
                        id={`belonging-${option.value}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`belonging-${option.value}`}
                        className={`px-3 py-2 rounded-full text-sm cursor-pointer border transition-colors ${
                          belongingDelta === option.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 hover:bg-muted border-transparent'
                        }`}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* Best Part */}
              <div className="space-y-2">
                <Label htmlFor="bestPart">What was the best part?</Label>
                <Textarea
                  id="bestPart"
                  placeholder="The people, the activity, the vibe..."
                  value={bestPart}
                  onChange={(e) => setBestPart(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>
              
              {/* Friction Point */}
              <div className="space-y-2">
                <Label htmlFor="frictionPoint">Anything we could improve?</Label>
                <Textarea
                  id="frictionPoint"
                  placeholder="Be honest — it helps us get better!"
                  value={frictionPoint}
                  onChange={(e) => setFrictionPoint(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>
              
              {/* Would Do Again */}
              <div className="space-y-3">
                <Label>Would you do another quest like this?</Label>
                <RadioGroup
                  value={wouldDoAgain}
                  onValueChange={setWouldDoAgain}
                  className="flex justify-center gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="again-yes" />
                    <Label htmlFor="again-yes" className="cursor-pointer">Yes!</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="again-no" />
                    <Label htmlFor="again-no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
