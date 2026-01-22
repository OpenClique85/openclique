import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, 
  Eye, 
  Copy, 
  ExternalLink, 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  User,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Import the preview-able components
import { CreatorDashboardPreview } from './previews/CreatorDashboardPreview';
import { CreatorQuestsPreview } from './previews/CreatorQuestsPreview';
import { CreatorAnalyticsPreview } from './previews/CreatorAnalyticsPreview';
import { CreatorProfilePreview } from './previews/CreatorProfilePreview';

type CreatorProfile = Tables<'creator_profiles'>;

interface CreatorWithEmail extends CreatorProfile {
  email?: string;
}

export function CreatorPreviewTab() {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch all active creators
  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['admin-all-creators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      return data as CreatorProfile[];
    },
  });

  // Fetch selected creator details (including email from profiles)
  const { data: selectedCreator, isLoading: creatorLoading } = useQuery({
    queryKey: ['admin-creator-detail', selectedCreatorId],
    queryFn: async () => {
      if (!selectedCreatorId) return null;

      const { data: creator, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', selectedCreatorId)
        .single();
      
      if (error) throw error;

      // Also fetch email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', selectedCreatorId)
        .maybeSingle();

      return {
        ...creator,
        email: profile?.email,
      } as CreatorWithEmail;
    },
    enabled: !!selectedCreatorId,
  });

  const handleCopyUserId = () => {
    if (selectedCreatorId) {
      navigator.clipboard.writeText(selectedCreatorId);
      toast.success('User ID copied to clipboard');
    }
  };

  if (creatorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Creator Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Creator Preview Mode
          </CardTitle>
          <CardDescription>
            View the creator portal exactly as a specific creator would see it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={selectedCreatorId || ''}
              onValueChange={(value) => setSelectedCreatorId(value || null)}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Select a creator to preview..." />
              </SelectTrigger>
              <SelectContent>
                {creators?.map((creator) => (
                  <SelectItem key={creator.user_id} value={creator.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={creator.photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {creator.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{creator.display_name}</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        {creator.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCreatorId && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyUserId}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy User ID
                </Button>
                {selectedCreator?.slug && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/creators/${selectedCreator.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Public Profile
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Content */}
      {selectedCreatorId && (
        <>
          {/* Preview Mode Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-400">Preview Mode Active</p>
              <p className="text-sm text-muted-foreground">
                Viewing as: <span className="font-medium">{selectedCreator?.display_name}</span>
                {selectedCreator?.email && (
                  <span className="ml-2 text-muted-foreground">({selectedCreator.email})</span>
                )}
              </p>
            </div>
          </div>

          {/* Creator Debug Info */}
          {selectedCreator && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedCreator.status === 'active' ? 'default' : 'secondary'}>
                      {selectedCreator.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Slug</p>
                    <p className="font-mono text-xs">{selectedCreator.slug || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{selectedCreator.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invited</p>
                    <p>{selectedCreator.invited_at ? format(new Date(selectedCreator.invited_at), 'MMM d, yyyy') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Onboarded</p>
                    <p>{selectedCreator.onboarded_at ? format(new Date(selectedCreator.onboarded_at), 'MMM d, yyyy') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs truncate" title={selectedCreator.user_id}>
                      {selectedCreator.user_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portal Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="quests" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Quests</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 border border-dashed border-amber-500/30 rounded-lg p-4 bg-card">
              <TabsContent value="dashboard" className="mt-0">
                <CreatorDashboardPreview previewUserId={selectedCreatorId} />
              </TabsContent>

              <TabsContent value="quests" className="mt-0">
                <CreatorQuestsPreview previewUserId={selectedCreatorId} />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <CreatorAnalyticsPreview previewUserId={selectedCreatorId} />
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <CreatorProfilePreview previewUserId={selectedCreatorId} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {!selectedCreatorId && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Select a Creator</h3>
            <p className="text-muted-foreground">
              Choose a creator from the dropdown above to preview their portal experience
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
