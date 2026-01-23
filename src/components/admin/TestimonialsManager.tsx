import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MoreHorizontal, Check, X, Eye, Quote, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  testimonial_text: string | null;
  recommendation_text: string | null;
  consent_type: string | null;
  is_testimonial_approved: boolean | null;
  submitted_at: string;
  user_id: string;
  quest_id: string;
  rating_1_5: number | null;
  profile: {
    display_name: string;
    city: string | null;
  } | null;
  quest: {
    title: string;
    icon: string | null;
  } | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function TestimonialsManager() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('feedback')
        .select(`
          id,
          testimonial_text,
          recommendation_text,
          consent_type,
          is_testimonial_approved,
          submitted_at,
          user_id,
          quest_id,
          rating_1_5,
          profile:profiles!feedback_user_id_fkey(display_name, city),
          quest:quests!feedback_quest_id_fkey(title, icon)
        `)
        .or('testimonial_text.neq.null,recommendation_text.neq.null')
        .order('submitted_at', { ascending: false });

      // Apply filter
      if (filterStatus === 'pending') {
        query = query.is('is_testimonial_approved', null);
      } else if (filterStatus === 'approved') {
        query = query.eq('is_testimonial_approved', true);
      } else if (filterStatus === 'rejected') {
        query = query.eq('is_testimonial_approved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTestimonials((data || []) as unknown as Testimonial[]);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load testimonials',
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [filterStatus]);

  const updateApprovalStatus = async (id: string, approved: boolean | null) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ is_testimonial_approved: approved })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: approved === true 
          ? 'Testimonial approved' 
          : approved === false 
          ? 'Testimonial rejected' 
          : 'Status reset',
        description: approved === true 
          ? 'It will now appear on the homepage.' 
          : 'Status updated successfully.',
      });

      fetchTestimonials();
      setIsPreviewOpen(false);
    } catch (error) {
      console.error('Failed to update testimonial:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: 'Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (approved: boolean | null) => {
    if (approved === true) {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
    } else if (approved === false) {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getConsentLabel = (consentType: string | null) => {
    if (consentType === 'first_name_city') return 'First name + city';
    if (consentType === 'anonymous') return 'Anonymous';
    return 'No consent';
  };

  const getDisplayName = (t: Testimonial) => {
    if (!t.consent_type) return 'No consent given';
    if (t.consent_type === 'anonymous') return 'Anonymous Quester';
    const firstName = t.profile?.display_name?.split(' ')[0] || 'User';
    const city = t.profile?.city || 'Austin';
    return `${firstName}, ${city}`;
  };

  const truncateText = (text: string | null, maxLength = 80) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const pendingCount = testimonials.filter(t => t.is_testimonial_approved === null).length;
  const approvedCount = testimonials.filter(t => t.is_testimonial_approved === true).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                Testimonials Manager
              </CardTitle>
              <CardDescription>
                Review and approve user testimonials for the homepage
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{pendingCount}</span> pending
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-green-600">{approvedCount}</span> approved
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Testimonials</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTestimonials}>
              Refresh
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No testimonials found for this filter.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Quest</TableHead>
                    <TableHead className="max-w-[300px]">Testimonial</TableHead>
                    <TableHead>Consent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.profile?.display_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{t.profile?.city || 'Austin'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{t.quest?.icon || '🎯'}</span>
                          <span className="text-sm">{t.quest?.title || 'Unknown Quest'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {truncateText(t.testimonial_text || t.recommendation_text)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getConsentLabel(t.consent_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(t.is_testimonial_approved)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(t.submitted_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTestimonial(t);
                              setIsPreviewOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            {t.is_testimonial_approved !== true && (
                              <DropdownMenuItem 
                                onClick={() => updateApprovalStatus(t.id, true)}
                                className="text-green-600"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {t.is_testimonial_approved !== false && (
                              <DropdownMenuItem 
                                onClick={() => updateApprovalStatus(t.id, false)}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Testimonial Preview</DialogTitle>
            <DialogDescription>
              Review how this testimonial will appear on the homepage
            </DialogDescription>
          </DialogHeader>

          {selectedTestimonial && (
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                    {selectedTestimonial.profile?.display_name?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="font-semibold">{getDisplayName(selectedTestimonial)}</h4>
                    <p className="text-sm text-muted-foreground">OpenClique Quester</p>
                  </div>
                </div>

                {selectedTestimonial.rating_1_5 && (
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < (selectedTestimonial.rating_1_5 || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                )}

                <div className="relative mb-4">
                  <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
                  <p className="text-foreground pl-5 text-sm leading-relaxed">
                    {selectedTestimonial.testimonial_text || selectedTestimonial.recommendation_text}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                    {selectedTestimonial.quest?.icon} {selectedTestimonial.quest?.title}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Consent Type</p>
                  <p className="font-medium">{getConsentLabel(selectedTestimonial.consent_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Status</p>
                  <p>{getStatusBadge(selectedTestimonial.is_testimonial_approved)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rating</p>
                  <p className="font-medium">{selectedTestimonial.rating_1_5 || 'N/A'} / 5</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(selectedTestimonial.submitted_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Recommendation text if different */}
              {selectedTestimonial.recommendation_text && selectedTestimonial.testimonial_text && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Recommendation to a friend:</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedTestimonial.recommendation_text}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {selectedTestimonial?.is_testimonial_approved !== false && (
              <Button
                variant="destructive"
                onClick={() => selectedTestimonial && updateApprovalStatus(selectedTestimonial.id, false)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                Reject
              </Button>
            )}
            {selectedTestimonial?.is_testimonial_approved !== true && (
              <Button
                onClick={() => selectedTestimonial && updateApprovalStatus(selectedTestimonial.id, true)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
