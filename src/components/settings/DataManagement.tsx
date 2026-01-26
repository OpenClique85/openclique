/**
 * =============================================================================
 * DataManagement - Data export and summary
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Database, FileJson, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function DataManagement() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    if (!user?.id) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { userId: user.id }
      });

      if (error) throw error;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openclique-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your OpenClique data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your export will include your profile, preferences, quest history, squad memberships, 
            achievements, and all other data we store about you.
          </p>
          
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Format: JSON</span>
          </div>

          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            What We Store
          </CardTitle>
          <CardDescription>
            A summary of the data we collect and store about you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <DataCategory 
              title="Profile Data" 
              items={['Display name', 'Email address', 'Preferences', 'Bio & interests']}
            />
            <Separator />
            <DataCategory 
              title="Activity Data" 
              items={['Quests joined', 'Squad memberships', 'Feedback submitted']}
            />
            <Separator />
            <DataCategory 
              title="Engagement Data" 
              items={['XP & level', 'Badges & achievements', 'Streaks', 'Trust scores']}
            />
            <Separator />
            <DataCategory 
              title="Matching Data" 
              items={['Personality traits', 'Social energy levels', 'Preference signals']}
            />
            <Separator />
            <DataCategory 
              title="Communications" 
              items={['Notification history', 'Support tickets']}
            />
          </div>

          <div className="pt-4">
            <Link to="/privacy" className="inline-flex items-center text-sm text-primary hover:underline">
              <ExternalLink className="mr-1 h-3 w-3" />
              Read our full Privacy Policy
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
