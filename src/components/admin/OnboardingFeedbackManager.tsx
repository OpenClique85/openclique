import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Download, Star, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';

interface OnboardingFeedback {
  id: string;
  user_id: string;
  signup_experience_rating: number | null;
  clarity_rating: number | null;
  excitement_rating: number | null;
  what_excited_you: string | null;
  what_confused_you: string | null;
  suggestions: string | null;
  would_recommend: boolean | null;
  created_at: string;
  profiles: { display_name: string; email: string | null } | null;
  invite_redemptions: { 
    invite_codes: { code: string; type: string; label: string | null } | null 
  }[] | null;
}

export function OnboardingFeedbackManager() {
  // Fetch feedback with user and code info
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['onboarding-feedback'],
    queryFn: async () => {
      // Get feedback data
      const { data: feedbackData, error } = await supabase
        .from('onboarding_feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Get profiles for each user
      const userIds = [...new Set(feedbackData.map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Get redemptions for each user
      const { data: redemptions } = await supabase
        .from('invite_redemptions')
        .select('user_id, invite_codes(code, type, label)')
        .in('user_id', userIds);
      const redemptionMap = new Map(redemptions?.map(r => [r.user_id, r]) || []);
      
      return feedbackData.map(f => ({
        ...f,
        profiles: profileMap.get(f.user_id) || null,
        invite_redemptions: redemptionMap.get(f.user_id) ? [redemptionMap.get(f.user_id)] : null,
      })) as OnboardingFeedback[];
    },
  });

  // Calculate analytics
  const totalResponses = feedback?.length || 0;
  const avgSignupRating = feedback?.length
    ? feedback.reduce((acc, f) => acc + (f.signup_experience_rating || 0), 0) / feedback.filter(f => f.signup_experience_rating).length
    : 0;
  const avgClarityRating = feedback?.length
    ? feedback.reduce((acc, f) => acc + (f.clarity_rating || 0), 0) / feedback.filter(f => f.clarity_rating).length
    : 0;
  const avgExcitementRating = feedback?.length
    ? feedback.reduce((acc, f) => acc + (f.excitement_rating || 0), 0) / feedback.filter(f => f.excitement_rating).length
    : 0;
  const recommendRate = feedback?.length
    ? (feedback.filter(f => f.would_recommend === true).length / feedback.filter(f => f.would_recommend !== null).length) * 100
    : 0;

  const exportToCSV = () => {
    if (!feedback?.length) {
      toast.error('No feedback to export');
      return;
    }

    const headers = [
      'User',
      'Email',
      'Invite Code',
      'Code Type',
      'Signup Rating',
      'Clarity Rating',
      'Excitement Rating',
      'Would Recommend',
      'What Excited',
      'What Confused',
      'Suggestions',
      'Submitted At',
    ];

    const rows = feedback.map(f => [
      f.profiles?.display_name || '',
      f.profiles?.email || '',
      f.invite_redemptions?.[0]?.invite_codes?.code || '',
      f.invite_redemptions?.[0]?.invite_codes?.type || '',
      f.signup_experience_rating || '',
      f.clarity_rating || '',
      f.excitement_rating || '',
      f.would_recommend === null ? '' : f.would_recommend ? 'Yes' : 'No',
      `"${(f.what_excited_you || '').replace(/"/g, '""')}"`,
      `"${(f.what_confused_you || '').replace(/"/g, '""')}"`,
      `"${(f.suggestions || '').replace(/"/g, '""')}"`,
      format(new Date(f.created_at), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding-feedback-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Feedback exported');
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Responses</CardDescription>
            <CardTitle className="text-2xl">{totalResponses}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Signup Experience</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-1">
              {avgSignupRating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clarity</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-1">
              {avgClarityRating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Excitement</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-1">
              {avgExcitementRating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Would Recommend</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-1">
              {recommendRate.toFixed(0)}%
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* NPS-style breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Onboarding Feedback</CardTitle>
            <CardDescription>Feedback collected after users complete signup with an invite code</CardDescription>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : feedback?.length === 0 ? (
            <p className="text-muted-foreground">No feedback collected yet. Users will be prompted after signing up with an invite code.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Clarity</TableHead>
                  <TableHead>Excitement</TableHead>
                  <TableHead>Recommend</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback?.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{f.profiles?.display_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{f.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {f.invite_redemptions?.[0]?.invite_codes ? (
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {f.invite_redemptions[0].invite_codes.code}
                          </code>
                          {f.invite_redemptions[0].invite_codes.label && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {f.invite_redemptions[0].invite_codes.label}
                            </p>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{renderStars(f.signup_experience_rating)}</TableCell>
                    <TableCell>{renderStars(f.clarity_rating)}</TableCell>
                    <TableCell>{renderStars(f.excitement_rating)}</TableCell>
                    <TableCell>
                      {f.would_recommend === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : f.would_recommend ? (
                        <Badge variant="default" className="bg-green-500">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(f.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Qualitative feedback section */}
          {feedback && feedback.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="font-semibold text-lg">Qualitative Feedback</h3>
              <div className="grid gap-4">
                {feedback.filter(f => f.what_excited_you || f.what_confused_you || f.suggestions).map(f => (
                  <Card key={`qual-${f.id}`} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium">{f.profiles?.display_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(f.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {f.what_excited_you && (
                          <div>
                            <span className="font-medium text-green-600">What excited them:</span>
                            <p className="text-muted-foreground">{f.what_excited_you}</p>
                          </div>
                        )}
                        {f.what_confused_you && (
                          <div>
                            <span className="font-medium text-amber-600">What confused them:</span>
                            <p className="text-muted-foreground">{f.what_confused_you}</p>
                          </div>
                        )}
                        {f.suggestions && (
                          <div>
                            <span className="font-medium text-blue-600">Suggestions:</span>
                            <p className="text-muted-foreground">{f.suggestions}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}