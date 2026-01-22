import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, BarChart3, Users, TrendingUp, MessageSquare } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Quest = Tables<'quests'>;
type Feedback = Tables<'feedback'>;

interface QuestStats {
  signups: number;
  confirmed: number;
  dropped: number;
  noShow: number;
  completed: number;
  feedbackCount: number;
  avgRating: number | null;
  avgBelonging: number | null;
  dropRate: number;
  noShowRate: number;
  feedbackRate: number;
}

export function Analytics() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string>('all');
  const [stats, setStats] = useState<QuestStats | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchQuests = async () => {
      const { data } = await supabase
        .from('quests')
        .select('*')
        .order('start_datetime', { ascending: false });
      
      if (data) {
        setQuests(data);
      }
      setIsLoading(false);
    };
    
    fetchQuests();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedQuestId]);

  const fetchStats = async () => {
    let signupsQuery = supabase.from('quest_signups').select('*');
    let feedbackQuery = supabase.from('feedback').select('*');
    
    if (selectedQuestId !== 'all') {
      signupsQuery = signupsQuery.eq('quest_id', selectedQuestId);
      feedbackQuery = feedbackQuery.eq('quest_id', selectedQuestId);
    }
    
    const [signupsResult, feedbackResult] = await Promise.all([
      signupsQuery,
      feedbackQuery
    ]);
    
    const signups = signupsResult.data || [];
    const feedbackData = feedbackResult.data || [];
    
    const confirmed = signups.filter(s => s.status === 'confirmed').length;
    const dropped = signups.filter(s => s.status === 'dropped').length;
    const noShow = signups.filter(s => s.status === 'no_show').length;
    const completed = signups.filter(s => s.status === 'completed').length;
    
    const ratings = feedbackData.filter(f => f.rating_1_5).map(f => f.rating_1_5!);
    const belongings = feedbackData.filter(f => f.belonging_delta !== null).map(f => f.belonging_delta!);
    
    setStats({
      signups: signups.length,
      confirmed,
      dropped,
      noShow,
      completed,
      feedbackCount: feedbackData.length,
      avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      avgBelonging: belongings.length > 0 ? belongings.reduce((a, b) => a + b, 0) / belongings.length : null,
      dropRate: signups.length > 0 ? (dropped / signups.length) * 100 : 0,
      noShowRate: confirmed > 0 ? (noShow / confirmed) * 100 : 0,
      feedbackRate: completed > 0 ? (feedbackData.length / completed) * 100 : 0,
    });
    
    setFeedback(feedbackData);
  };

  const exportCSV = async (type: 'signups' | 'feedback' | 'comms') => {
    setIsExporting(true);
    
    let data: any[] = [];
    let filename = '';
    
    if (type === 'signups') {
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('*')
        .order('signed_up_at', { ascending: false });
      
      data = (signups || []).map(s => ({
        status: s.status,
        signed_up_at: s.signed_up_at,
        cancellation_reason: s.cancellation_reason
      }));
      filename = 'signups.csv';
    } else if (type === 'feedback') {
      const { data: fb } = await supabase
        .from('feedback')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      data = (fb || []).map(f => ({
        rating: f.rating_1_5,
        belonging_delta: f.belonging_delta,
        best_part: f.best_part,
        friction_point: f.friction_point,
        would_do_again: f.would_do_again,
        submitted_at: f.submitted_at
      }));
      filename = 'feedback.csv';
    } else if (type === 'comms') {
      const { data: comms } = await supabase
        .from('comms_log')
        .select(`*, quest:quests(title)`)
        .order('sent_at', { ascending: false });
      
      data = (comms || []).map(c => ({
        quest: c.quest?.title,
        type: c.type,
        subject: c.subject,
        sent_at: c.sent_at
      }));
      filename = 'comms_log.csv';
    }
    
    // Convert to CSV
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(v => 
          typeof v === 'string' && v.includes(',') ? `"${v}"` : v
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }
    
    setIsExporting(false);
  };

  const exportJSON = async () => {
    setIsExporting(true);
    
    const selectedQuest = selectedQuestId !== 'all' 
      ? quests.find(q => q.id === selectedQuestId) 
      : null;
    
    let signupsQuery = supabase.from('quest_signups').select(`*, profile:profiles(display_name)`);
    let feedbackQuery = supabase.from('feedback').select('*');
    let commsQuery = supabase.from('comms_log').select('*');
    
    if (selectedQuestId !== 'all') {
      signupsQuery = signupsQuery.eq('quest_id', selectedQuestId);
      feedbackQuery = feedbackQuery.eq('quest_id', selectedQuestId);
      commsQuery = commsQuery.eq('quest_id', selectedQuestId);
    }
    
    const [signupsResult, feedbackResult, commsResult] = await Promise.all([
      signupsQuery,
      feedbackQuery,
      commsQuery
    ]);
    
    const bundle = {
      exported_at: new Date().toISOString(),
      quest: selectedQuest ? {
        title: selectedQuest.title,
        date: selectedQuest.start_datetime,
        location: selectedQuest.meeting_location_name,
        briefing: selectedQuest.briefing_html
      } : 'All quests',
      stats,
      signups: (signupsResult.data || []).map(s => ({
        status: s.status,
        cancellation_reason: s.cancellation_reason
      })),
      feedback: (feedbackResult.data || []).map(f => ({
        rating: f.rating_1_5,
        belonging_delta: f.belonging_delta,
        best_part: f.best_part,
        friction_point: f.friction_point,
        would_do_again: f.would_do_again
      })),
      comms_timeline: (commsResult.data || []).map(c => ({
        type: c.type,
        subject: c.subject,
        sent_at: c.sent_at
      }))
    };
    
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-bundle-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    setIsExporting(false);
  };

  // Get top friction points
  const frictionPoints = feedback
    .filter(f => f.friction_point)
    .map(f => f.friction_point!)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quest Filter */}
      <div className="flex items-center justify-between">
        <Select value={selectedQuestId} onValueChange={setSelectedQuestId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All quests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quests</SelectItem>
            {quests.map((quest) => (
              <SelectItem key={quest.id} value={quest.id}>
                {quest.icon} {quest.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.signups}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{stats.confirmed}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Drop Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{stats.dropRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                No-Show Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{stats.noShowRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats.avgRating ? `${stats.avgRating.toFixed(1)} ⭐` : '—'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Belonging Δ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats.avgBelonging !== null 
                  ? `${stats.avgBelonging > 0 ? '+' : ''}${stats.avgBelonging.toFixed(1)}` 
                  : '—'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.feedbackCount}</p>
              <p className="text-xs text-muted-foreground">{stats.feedbackRate.toFixed(0)}% response rate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Friction Points */}
      {frictionPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Friction Points</CardTitle>
            <CardDescription>Common issues reported by participants</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {frictionPoints.map((point, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>Download data for analysis or LLM learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportCSV('signups')} disabled={isExporting}>
              Export Signups CSV
            </Button>
            <Button variant="outline" onClick={() => exportCSV('feedback')} disabled={isExporting}>
              Export Feedback CSV
            </Button>
            <Button variant="outline" onClick={() => exportCSV('comms')} disabled={isExporting}>
              Export Comms Log CSV
            </Button>
            <Button onClick={exportJSON} disabled={isExporting}>
              {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Export JSON Bundle (LLM-ready)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
