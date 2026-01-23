import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  Plus, 
  Pencil, 
  Loader2, 
  Users, 
  Upload, 
  Sparkles, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  FileText,
  Settings,
  Share2,
  ExternalLink,
  Bell,
  Send,
  CalendarPlus
} from 'lucide-react';
import { ScheduleInstanceDialog } from './ScheduleInstanceDialog';
import { format, differenceInDays, differenceInWeeks } from 'date-fns';
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

const THEME_COLORS = ['pink', 'green', 'amber', 'purple'] as const;
const PROGRESSION_TREES = ['culture', 'wellness', 'connector'] as const;

const PRESET_TAGS = [
  'outdoor', 'music', 'fitness', 'social', 'food', 'art', 
  'beginner-friendly', 'advanced', 'nightlife', 'family-friendly'
];

const ICON_OPTIONS = [
  '🎸', '🎤', '🎵', '🎧', '🎹', '🎺', '🎭', '🎬',
  '🏃', '🧘', '🚴', '⛰️', '🏊', '🎯', '🏆', '💪',
  '🍕', '🍷', '☕', '🍳', '🎂', '🌮', '🍜', '🍔',
  '🎨', '📸', '✏️', '🎪', '🎠', '🌟', '💫', '🔥',
  '🌳', '🌊', '🌅', '🏕️', '🚣', '🎿', '⛷️', '🏄'
];

interface QuestWithCounts extends Quest {
  signup_counts?: {
    pending: number;
    confirmed: number;
    standby: number;
    dropped: number;
  };
  referral_count?: number;
  instance_count?: number;
}

interface FormData {
  title: string;
  slug: string;
  icon: string;
  status: QuestStatus;
  progression_tree: string;
  theme: string;
  theme_color: string;
  tags: string[];
  start_datetime: string;
  end_datetime: string;
  meeting_location_name: string;
  meeting_address: string;
  short_description: string;
  rewards: string;
  cost_description: string;
  image_url: string;
  objectives: string;
  success_criteria: string;
  briefing_html: string;
  capacity_total: number;
  whatsapp_invite_link: string;
  // Gamification fields
  base_xp: number;
  min_level: number;
  min_tree_xp: number;
}

const defaultFormData: FormData = {
  title: '',
  slug: '',
  icon: '🎯',
  status: 'draft',
  progression_tree: '',
  theme: '',
  theme_color: 'pink',
  tags: [],
  start_datetime: '',
  end_datetime: '',
  meeting_location_name: '',
  meeting_address: '',
  short_description: '',
  rewards: '',
  cost_description: 'Free',
  image_url: '',
  objectives: '',
  success_criteria: '',
  briefing_html: '',
  capacity_total: 6,
  whatsapp_invite_link: '',
  // Gamification defaults
  base_xp: 50,
  min_level: 0,
  min_tree_xp: 0,
};

export function QuestsManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quests, setQuests] = useState<QuestWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState('basics');
  
  // Notify users modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyQuest, setNotifyQuest] = useState<Quest | null>(null);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [matchingUsersCount, setMatchingUsersCount] = useState<number | null>(null);
  
  // Schedule instance modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleQuest, setScheduleQuest] = useState<Quest | null>(null);

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
    
    // Fetch signup counts, referral counts, and instance counts for each quest
    const questsWithCounts: QuestWithCounts[] = await Promise.all(
      (questsData || []).map(async (quest) => {
        const [signupsResult, referralsResult, instancesResult] = await Promise.all([
          supabase
            .from('quest_signups')
            .select('status')
            .eq('quest_id', quest.id),
          supabase
            .from('referrals')
            .select('id')
            .eq('quest_id', quest.id),
          supabase
            .from('quest_instances')
            .select('id')
            .eq('quest_id', quest.id)
            .not('status', 'eq', 'archived')
        ]);
        
        const counts = {
          pending: 0,
          confirmed: 0,
          standby: 0,
          dropped: 0,
        };
        
        signupsResult.data?.forEach((s) => {
          if (s.status && s.status in counts) {
            counts[s.status as keyof typeof counts]++;
          }
        });
        
        return { 
          ...quest, 
          signup_counts: counts,
          referral_count: referralsResult.data?.length || 0,
          instance_count: instancesResult.data?.length || 0
        };
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

  const calculateDuration = () => {
    if (!formData.start_datetime) return null;
    if (!formData.end_datetime) return 'Single day';
    
    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);
    const days = differenceInDays(end, start);
    const weeks = differenceInWeeks(end, start);
    
    if (weeks >= 1) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`;
    return 'Same day';
  };

  const handleOpenModal = (quest?: Quest) => {
    if (quest) {
      setEditingQuest(quest);
      setFormData({
        title: quest.title,
        slug: quest.slug,
        icon: quest.icon || '🎯',
        status: quest.status || 'draft',
        progression_tree: quest.progression_tree || '',
        theme: quest.theme || '',
        theme_color: quest.theme_color || 'pink',
        tags: quest.tags || [],
        start_datetime: quest.start_datetime 
          ? new Date(quest.start_datetime).toISOString().slice(0, 16) 
          : '',
        end_datetime: quest.end_datetime 
          ? new Date(quest.end_datetime).toISOString().slice(0, 16) 
          : '',
        meeting_location_name: quest.meeting_location_name || '',
        meeting_address: quest.meeting_address || '',
        short_description: quest.short_description || '',
        rewards: quest.rewards || '',
        cost_description: quest.cost_description || 'Free',
        image_url: quest.image_url || '',
        objectives: quest.objectives || '',
        success_criteria: quest.success_criteria || '',
        briefing_html: quest.briefing_html || '',
        capacity_total: quest.capacity_total || 6,
        whatsapp_invite_link: quest.whatsapp_invite_link || '',
        base_xp: quest.base_xp ?? 50,
        min_level: quest.min_level ?? 0,
        min_tree_xp: quest.min_tree_xp ?? 0,
      });
    } else {
      setEditingQuest(null);
      setFormData(defaultFormData);
    }
    setActiveTab('basics');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('quest-images')
      .upload(fileName, file);
    
    if (uploadError) {
      toast({ variant: 'destructive', title: 'Failed to upload image', description: uploadError.message });
      setIsUploadingImage(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('quest-images')
      .getPublicUrl(fileName);
    
    setFormData(prev => ({ ...prev, image_url: publicUrl }));
    setIsUploadingImage(false);
    toast({ title: 'Image uploaded!' });
  };

  const handleGenerateImage = async () => {
    if (!formData.title) {
      toast({ variant: 'destructive', title: 'Add a title first to generate an image' });
      return;
    }
    
    setIsGeneratingImage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-quest-image', {
        body: { 
          title: formData.title,
          theme: formData.theme,
          progression_tree: formData.progression_tree
        }
      });
      
      if (error) throw error;
      if (data?.image_url) {
        setFormData(prev => ({ ...prev, image_url: data.image_url }));
        toast({ title: 'Image generated!' });
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to generate image', 
        description: error.message 
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }
    
    const slug = formData.slug.trim() || generateSlug(formData.title);
    
    setIsSubmitting(true);
    
    const questData = {
      title: formData.title.trim(),
      slug,
      icon: formData.icon,
      status: formData.status,
      progression_tree: formData.progression_tree || null,
      theme: formData.theme || null,
      theme_color: formData.theme_color,
      tags: formData.tags,
      start_datetime: formData.start_datetime || null,
      end_datetime: formData.end_datetime || null,
      meeting_location_name: formData.meeting_location_name || null,
      meeting_address: formData.meeting_address || null,
      short_description: formData.short_description || null,
      rewards: formData.rewards || null,
      cost_description: formData.cost_description || 'Free',
      image_url: formData.image_url || null,
      objectives: formData.objectives || null,
      success_criteria: formData.success_criteria || null,
      briefing_html: formData.briefing_html || null,
      capacity_total: formData.capacity_total,
      whatsapp_invite_link: formData.whatsapp_invite_link || null,
      base_xp: formData.base_xp,
      min_level: formData.min_level,
      min_tree_xp: formData.min_tree_xp,
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

  const getQuestUrl = (quest: Quest) => {
    return `${window.location.origin}/quests/${quest.slug}`;
  };

  // Open notify modal and fetch matching users count
  const handleOpenNotifyModal = async (quest: Quest) => {
    setNotifyQuest(quest);
    setNotifyMessage(`We think you'd love "${quest.title}" based on your interests.`);
    setShowNotifyModal(true);
    setMatchingUsersCount(null);
    
    // Fetch count of users with matching interests
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, preferences');
      
      if (error) throw error;
      
      const tree = quest.progression_tree?.toLowerCase();
      const matchingCount = (profiles || []).filter((p: any) => {
        if (!tree) return true;
        const interests = p.preferences?.interest_tags || [];
        return interests.some((tag: string) => 
          tag.toLowerCase().includes(tree) || tree.includes(tag.toLowerCase())
        );
      }).length;
      
      setMatchingUsersCount(matchingCount);
    } catch (err) {
      console.error('Error fetching matching users:', err);
      setMatchingUsersCount(0);
    }
  };

  // Send notifications to matching users
  const handleSendNotifications = async () => {
    if (!notifyQuest) return;
    
    setIsSendingNotifications(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('notify-users', {
        body: {
          type: 'quest_recommendation',
          quest_id: notifyQuest.id,
          custom_message: notifyMessage,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Notifications sent!',
        description: `Notified ${data.notified_count} users, sent ${data.emails_sent} emails.`,
      });
      
      setShowNotifyModal(false);
    } catch (err: any) {
      console.error('Error sending notifications:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to send notifications',
        description: err.message || 'Please try again.',
      });
    } finally {
      setIsSendingNotifications(false);
    }
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        {quest.title}
                        {quest.progression_tree && (
                          <Badge variant="outline" className="text-xs">
                            {quest.progression_tree}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {quest.start_datetime 
                          ? format(new Date(quest.start_datetime), 'MMM d, yyyy @ h:mm a')
                          : 'Date TBD'}
                        {quest.end_datetime && (
                          <> — {format(new Date(quest.end_datetime), 'MMM d, yyyy')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {quest.instance_count !== undefined && quest.instance_count > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {quest.instance_count} instance{quest.instance_count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge className={STATUS_COLORS[quest.status || 'draft']}>
                      {quest.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(getQuestUrl(quest));
                        toast({ title: 'Link copied!' });
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenNotifyModal(quest)}
                      title="Notify matching users"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setScheduleQuest(quest);
                        setShowScheduleModal(true);
                      }}
                      title="Schedule instance"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(quest)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-4 text-sm">
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
                  {quest.referral_count !== undefined && quest.referral_count > 0 && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <Share2 className="h-3 w-3" />
                      {quest.referral_count} referrals
                    </span>
                  )}
                </div>
                {quest.tags && quest.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quest.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Quest Form Modal with Tabs */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingQuest ? 'Edit Quest' : 'Create New Quest'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basics" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="when" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                When
              </TabsTrigger>
              <TabsTrigger value="where" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Where
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Content
              </TabsTrigger>
              <TabsTrigger value="internal" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Internal
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto mt-4">
              {/* BASICS TAB */}
              <TabsContent value="basics" className="space-y-4 mt-0">
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
                  <p className="text-xs text-muted-foreground">
                    URL: /quests/{formData.slug || 'your-quest-slug'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="progression_tree">Progression Tree</Label>
                    <Select
                      value={formData.progression_tree}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, progression_tree: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tree..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culture">🎶 Culture</SelectItem>
                        <SelectItem value="wellness">🏃 Wellness</SelectItem>
                        <SelectItem value="connector">🤝 Connector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Input
                      value={formData.theme}
                      onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                      placeholder="Ladies Night, New Dads, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex gap-2">
                      {THEME_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, theme_color: color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.theme_color === color ? 'border-foreground' : 'border-transparent'
                          } ${
                            color === 'pink' ? 'bg-pink-400' :
                            color === 'green' ? 'bg-emerald-400' :
                            color === 'amber' ? 'bg-amber-400' :
                            'bg-purple-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-24 overflow-y-auto">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`text-2xl p-1 rounded ${
                          formData.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* WHEN TAB */}
              <TabsContent value="when" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_datetime">Start Date & Time</Label>
                    <Input
                      id="start_datetime"
                      type="datetime-local"
                      value={formData.start_datetime}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">When does this quest begin?</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_datetime">End Date & Time (optional)</Label>
                    <Input
                      id="end_datetime"
                      type="datetime-local"
                      value={formData.end_datetime}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for single-day events</p>
                  </div>
                </div>
                
                {calculateDuration() && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <strong>Duration:</strong> {calculateDuration()}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              {/* WHERE TAB */}
              <TabsContent value="where" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="location">Location Name</Label>
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
              </TabsContent>
              
              {/* CONTENT TAB (User-Facing) */}
              <TabsContent value="content" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="A 2-3 sentence teaser that appears on quest cards..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">This is what users see on the quest card.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rewards">Rewards</Label>
                    <Input
                      id="rewards"
                      value={formData.rewards}
                      onChange={(e) => setFormData(prev => ({ ...prev, rewards: e.target.value }))}
                      placeholder="+50 XP, Concert Badge"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      value={formData.cost_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_description: e.target.value }))}
                      placeholder="Free, $20, etc."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Quest Image</Label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  
                  {formData.image_url ? (
                    <div className="mt-2 relative">
                      <img 
                        src={formData.image_url} 
                        alt="Quest preview" 
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 w-full h-32 bg-muted rounded-md flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="image_url">Or paste image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* INTERNAL TAB (Admin-Only) */}
              <TabsContent value="internal" className="space-y-4 mt-0">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ These fields are for admin use only and won't be shown to users.
                  </p>
                </div>
                
                {/* Gamification Section */}
                <div className="border rounded-lg p-4 bg-primary/5">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    🎮 Gamification Settings
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_xp">Base XP</Label>
                      <Input
                        id="base_xp"
                        type="number"
                        min={0}
                        max={500}
                        value={formData.base_xp}
                        onChange={(e) => setFormData(prev => ({ ...prev, base_xp: parseInt(e.target.value) || 50 }))}
                      />
                      <p className="text-xs text-muted-foreground">XP awarded on completion</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_level">Min Level</Label>
                      <Input
                        id="min_level"
                        type="number"
                        min={0}
                        max={20}
                        value={formData.min_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_level: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">0 = no restriction</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_tree_xp">Min Tree XP</Label>
                      <Input
                        id="min_tree_xp"
                        type="number"
                        min={0}
                        max={1000}
                        value={formData.min_tree_xp}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_tree_xp: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-xs text-muted-foreground">In quest's tree</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objectives</Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                    placeholder="What are we trying to achieve with this quest?"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="success_criteria">Success Criteria</Label>
                  <Textarea
                    id="success_criteria"
                    value={formData.success_criteria}
                    onChange={(e) => setFormData(prev => ({ ...prev, success_criteria: e.target.value }))}
                    placeholder="How do we know if this quest was successful?"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      max={50}
                      value={formData.capacity_total}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity_total: parseInt(e.target.value) || 6 }))}
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="briefing">Briefing / Instructions</Label>
                  <Textarea
                    id="briefing"
                    value={formData.briefing_html}
                    onChange={(e) => setFormData(prev => ({ ...prev, briefing_html: e.target.value }))}
                    placeholder="What to expect, what to bring, dress code... (Sent to confirmed participants)"
                    rows={4}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="mt-4">
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

      {/* Notify Users Modal */}
      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notify Matching Users
            </DialogTitle>
          </DialogHeader>
          
          {notifyQuest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{notifyQuest.icon} {notifyQuest.title}</p>
                {notifyQuest.progression_tree && (
                  <p className="text-sm text-muted-foreground">
                    Tree: {notifyQuest.progression_tree}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Matching Users</Label>
                <div className="p-3 bg-primary/5 rounded-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {matchingUsersCount === null ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <span className="font-medium">
                      {matchingUsersCount} users with matching interests
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users will receive both an in-app notification and an email.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notify-message">Custom Message</Label>
                <Textarea
                  id="notify-message"
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="We think you'd love this quest..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendNotifications} 
              disabled={isSendingNotifications || matchingUsersCount === 0}
            >
              {isSendingNotifications ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notifications
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Instance Dialog */}
      <ScheduleInstanceDialog
        quest={scheduleQuest}
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
      />
    </div>
  );
}
