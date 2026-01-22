import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, Trash2, FlaskConical } from 'lucide-react';

interface CreatedUser {
  email: string;
  userId: string;
  status: string;
}

export function DevToolsSection() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUsers, setGeneratedUsers] = useState<CreatedUser[]>([]);

  const handleGenerateTestUsers = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users');

      if (error) {
        console.error('Error generating test users:', error);
        toast.error('Failed to generate test users', {
          description: error.message,
        });
        return;
      }

      if (data?.success) {
        setGeneratedUsers(data.users || []);
        toast.success(`Created ${data.users?.length || 0} test users`, {
          description: 'Test users have been signed up for the demo quest',
        });
      } else {
        toast.error('Failed to generate test users', {
          description: data?.error || 'Unknown error',
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to generate test users');
    } finally {
      setIsGenerating(false);
    }
  };

  const statusColorMap: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    standby: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completed: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Developer Tools</CardTitle>
          </div>
          <CardDescription>
            Generate test data for admin workflow testing. These tools create dummy users and data that can be used to test admin features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleGenerateTestUsers}
              disabled={isGenerating}
              variant="outline"
              className="border-amber-500/50 hover:bg-amber-500/10"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Generate 6 Test Users
            </Button>
          </div>

          {generatedUsers.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Generated Test Users:</h4>
              <div className="grid gap-2">
                {generatedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-2 rounded bg-background border"
                  >
                    <span className="text-sm font-mono">{user.email}</span>
                    <Badge variant="outline" className={statusColorMap[user.status] || ''}>
                      {user.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Password for all test accounts: <code className="bg-muted px-1 py-0.5 rounded">TestUser123!</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
