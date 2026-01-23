import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  XCircle, 
  Mail, 
  RefreshCw,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface FailedEmail {
  id: string;
  user_id: string | null;
  subject: string | null;
  status: string | null;
  error_message: string | null;
  type: string;
  sent_at: string;
  profile?: { display_name: string; email: string } | null;
}

interface FailurePattern {
  error_type: string;
  count: number;
  last_occurrence: string;
  examples: FailedEmail[];
}

// Common error patterns and their solutions
const ERROR_SOLUTIONS: Record<string, { cause: string; solution: string }> = {
  'bounce': {
    cause: 'Email address does not exist or mailbox is full',
    solution: 'Remove invalid email from user profile or contact user to update their email',
  },
  'spam': {
    cause: 'Email was marked as spam or blocked by recipient',
    solution: 'Review email content for spam triggers, consider using different subject lines',
  },
  'rate_limit': {
    cause: 'Too many emails sent in a short period',
    solution: 'Space out email sends, consider batching or queuing',
  },
  'invalid_email': {
    cause: 'Email address format is invalid',
    solution: 'Add email validation to signup forms',
  },
  'timeout': {
    cause: 'Email service took too long to respond',
    solution: 'Retry the email, check Resend service status',
  },
  'authentication': {
    cause: 'API key or authentication issue with email provider',
    solution: 'Verify RESEND_API_KEY is correctly configured',
  },
};

export function FailureAnalysis() {
  const { data: failedEmails, isLoading, refetch } = useQuery({
    queryKey: ['failed-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comms_log')
        .select('*')
        .in('status', ['failed', 'bounced'])
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, display_name, email').in('id', userIds)
        : { data: [] };

      const profileMap = new Map<string, { id: string; display_name: string; email: string | null }>(
        (profiles || []).map(p => [p.id, p] as const)
      );

      return (data || []).map(log => ({
        ...log,
        profile: log.user_id ? profileMap.get(log.user_id) || null : null,
      })) as FailedEmail[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['email-failure-stats'],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: all } = await supabase
        .from('comms_log')
        .select('status', { count: 'exact' })
        .gte('sent_at', last7d.toISOString());

      const { count: failedCount } = await supabase
        .from('comms_log')
        .select('*', { count: 'exact', head: true })
        .in('status', ['failed', 'bounced'])
        .gte('sent_at', last7d.toISOString());

      const { count: failed24h } = await supabase
        .from('comms_log')
        .select('*', { count: 'exact', head: true })
        .in('status', ['failed', 'bounced'])
        .gte('sent_at', last24h.toISOString());

      const totalCount = all?.length || 1;
      const failureRate = ((failedCount || 0) / totalCount) * 100;

      return {
        total7d: totalCount,
        failed7d: failedCount || 0,
        failed24h: failed24h || 0,
        failureRate: failureRate.toFixed(1),
      };
    },
  });

  // Group failures by error pattern
  const patterns: FailurePattern[] = [];
  if (failedEmails) {
    const patternMap = new Map<string, FailedEmail[]>();
    
    for (const email of failedEmails) {
      const errorType = categorizeError(email.error_message);
      if (!patternMap.has(errorType)) {
        patternMap.set(errorType, []);
      }
      patternMap.get(errorType)?.push(email);
    }

    for (const [error_type, emails] of patternMap) {
      patterns.push({
        error_type,
        count: emails.length,
        last_occurrence: emails[0]?.sent_at || '',
        examples: emails.slice(0, 3),
      });
    }

    patterns.sort((a, b) => b.count - a.count);
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.failed24h || 0}</p>
                <p className="text-xs text-muted-foreground">Failed (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.failed7d || 0}</p>
                <p className="text-xs text-muted-foreground">Failed (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total7d || 0}</p>
                <p className="text-xs text-muted-foreground">Total Sent (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.failureRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Failure Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Error Patterns</CardTitle>
              <CardDescription>
                Grouped failures with diagnosis and recommended actions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No failed emails found</p>
              <p className="text-sm">All emails have been delivered successfully</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {patterns.map((pattern) => {
                const solution = ERROR_SOLUTIONS[pattern.error_type] || {
                  cause: 'Unknown error type',
                  solution: 'Review the error message and check email provider logs',
                };

                return (
                  <AccordionItem
                    key={pattern.error_type}
                    value={pattern.error_type}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        <Badge variant="destructive">{pattern.count}</Badge>
                        <div>
                          <p className="font-medium capitalize">
                            {pattern.error_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last: {format(new Date(pattern.last_occurrence), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {/* Diagnosis */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="font-medium text-red-800 mb-1">Likely Cause</p>
                            <p className="text-red-700">{solution.cause}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-medium text-green-800 mb-1">Recommended Fix</p>
                            <p className="text-green-700">{solution.solution}</p>
                          </div>
                        </div>

                        {/* Example Failures */}
                        <div>
                          <p className="text-sm font-medium mb-2">Recent Examples</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Error</TableHead>
                                <TableHead>Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pattern.examples.map((email) => (
                                <TableRow key={email.id}>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm">{email.profile?.display_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {email.profile?.email}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm max-w-[150px] truncate">
                                    {email.subject}
                                  </TableCell>
                                  <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                                    {email.error_message}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(email.sent_at), 'MMM d, h:mm a')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to categorize errors into patterns
function categorizeError(errorMessage: string | null): string {
  if (!errorMessage) return 'unknown';
  
  const msg = errorMessage.toLowerCase();
  
  if (msg.includes('bounce') || msg.includes('undeliverable') || msg.includes('does not exist')) {
    return 'bounce';
  }
  if (msg.includes('spam') || msg.includes('blocked') || msg.includes('rejected')) {
    return 'spam';
  }
  if (msg.includes('rate') || msg.includes('limit') || msg.includes('throttle')) {
    return 'rate_limit';
  }
  if (msg.includes('invalid') || msg.includes('malformed')) {
    return 'invalid_email';
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'timeout';
  }
  if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('api key')) {
    return 'authentication';
  }
  
  return 'other';
}
