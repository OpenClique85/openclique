import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type QuestStatus = Enums<'quest_status'>;

const STATUS_COLORS: Record<QuestStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface QuestWithCounts extends Quest {
  signup_counts?: {
    pending: number;
    confirmed: number;
    standby: number;
    dropped: number;
  };
}

export function QuestsManager() {
  const { toast } = useToast();
  const [quests, setQuests] = useState<QuestWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    icon: '🎯',
    start_datetime: '',
    meeting_location_name: '',
    meeting_address: '',
    briefing_html: '',
    capacity_total: 6,
    whatsapp_invite_link: '',
    status: 'draft' as QuestStatus,
  });

  const fetchQuests = async () => {
    setIsLoading(true);
    
    const { data: questsData, error } = await supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to load quests' });
      setIsLoading(false);
      return;
    }
    
    // Fetch signup counts for each quest
    const questsWithCounts: QuestWithCounts[] = await Promise.all(
      (questsData || []).map(async (quest) => {
        const { data: signups } = await supabase
          .from('quest_signups')
          .select('status')
          .eq('quest_id', quest.id);
        
        const counts = {
          pending: 0,
          confirmed: 0,
          standby: 0,
          dropped: 0,
        };
        
        signups?.forEach((s) => {
          if (s.status && s.status in counts) {
            counts[s.status as keyof typeof counts]++;
          }
        });
        
        return { ...quest, signup_counts: counts };
      })
    );
    
    setQuests(questsWithCounts);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);
  };

  const handleOpenModal = (quest?: Quest) => {
    if (quest) {
      setEditingQuest(quest);
      setFormData({
        title: quest.title,
        slug: quest.slug,
        icon: quest.icon || '🎯',
        start_datetime: quest.start_datetime 
          ? new Date(quest.start_datetime).toISOString().slice(0, 16) 
          : '',
        meeting_location_name: quest.meeting_location_name || '',
        meeting_address: quest.meeting_address || '',
        briefing_html: quest.briefing_html || '',
        capacity_total: quest.capacity_total || 6,
        whatsapp_invite_link: quest.whatsapp_invite_link || '',
        status: quest.status || 'draft',
      });
    } else {
      setEditingQuest(null);
      setFormData({
        title: '',
        slug: '',
        icon: '🎯',
        start_datetime: '',
        meeting_location_name: '',
        meeting_address: '',
        briefing_html: '',
        capacity_total: 6,
        whatsapp_invite_link: '',
        status: 'draft',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast({ variant: 'destructive', title: 'Title and slug are required' });
      return;
    }
    
    setIsSubmitting(true);
    
    const questData = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      icon: formData.icon,
      start_datetime: formData.start_datetime || null,
      meeting_location_name: formData.meeting_location_name || null,
      meeting_address: formData.meeting_address || null,
      briefing_html: formData.briefing_html || null,
      capacity_total: formData.capacity_total,
      whatsapp_invite_link: formData.whatsapp_invite_link || null,
      status: formData.status,
    };
    
    let error;
    
    if (editingQuest) {
      const result = await supabase
        .from('quests')
        .update(questData)
        .eq('id', editingQuest.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('quests')
        .insert(questData);
      error = result.error;
    }
    
    setIsSubmitting(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to save quest',
        description: error.message.includes('unique') 
          ? 'A quest with this slug already exists' 
          : error.message
      });
      return;
    }
    
    toast({ title: editingQuest ? 'Quest updated' : 'Quest created' });
    setShowModal(false);
    fetchQuests();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Quests ({quests.length})</h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quest
        </Button>
      </div>
      
      {quests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No quests yet. Create your first one!</p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quest
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quests.map((quest) => (
            <Card key={quest.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{quest.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{quest.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {quest.start_datetime 
                          ? format(new Date(quest.start_datetime), 'MMM d, yyyy @ h:mm a')
                          : 'Date TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[quest.status || 'draft']}>
                      {quest.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(quest)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Capacity: {quest.capacity_total}</span>
                  </div>
                  {quest.signup_counts && (
                    <>
                      <span className="text-emerald-600">
                        {quest.signup_counts.confirmed} confirmed
                      </span>
                      <span className="text-amber-600">
                        {quest.signup_counts.pending} pending
                      </span>
                      <span className="text-blue-600">
                        {quest.signup_counts.standby} standby
                      </span>
                      {quest.signup_counts.dropped > 0 && (
                        <span className="text-red-500">
                          {quest.signup_counts.dropped} dropped
                        </span>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Quest Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuest ? 'Edit Quest' : 'Create New Quest'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      title: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }));
                  }}
                  placeholder="Mystery Concert Night"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="mystery-concert-jan"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🎸"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as QuestStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_datetime">Date & Time</Label>
                <Input
                  id="start_datetime"
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.capacity_total}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity_total: parseInt(e.target.value) || 6 }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Meeting Location</Label>
              <Input
                id="location"
                value={formData.meeting_location_name}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_location_name: e.target.value }))}
                placeholder="The Continental Club"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.meeting_address}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_address: e.target.value }))}
                placeholder="1315 S Congress Ave, Austin, TX"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Invite Link</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp_invite_link}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_invite_link: e.target.value }))}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="briefing">Briefing / Instructions</Label>
              <Textarea
                id="briefing"
                value={formData.briefing_html}
                onChange={(e) => setFormData(prev => ({ ...prev, briefing_html: e.target.value }))}
                placeholder="What to expect, what to bring, dress code..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingQuest ? 'Save Changes' : 'Create Quest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
