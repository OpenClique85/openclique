/**
 * LinksManager - Admin component to copy and share signup links
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  Megaphone, 
  Users,
  ExternalLink,
  QrCode
} from 'lucide-react';

interface LinkItem {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

const PUBLISHED_URL = 'https://openclique.lovable.app';

const SIGNUP_LINKS: LinkItem[] = [
  {
    id: 'creator',
    label: 'Creator Signup',
    description: 'For local experience leaders & community builders',
    path: '/creators/quest-creators',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  {
    id: 'organization',
    label: 'Organization Signup',
    description: 'For clubs, student orgs, and corporate groups',
    path: '/partners',
    icon: <Building2 className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  {
    id: 'sponsor',
    label: 'Brand / Sponsor Signup',
    description: 'For businesses wanting to sponsor experiences',
    path: '/partners',
    icon: <Megaphone className="h-5 w-5" />,
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
  {
    id: 'user',
    label: 'User Signup',
    description: 'For adventure seekers looking to join quests',
    path: '/auth',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
];

export function LinksManager() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (link: LinkItem) => {
    const fullUrl = `${PUBLISHED_URL}${link.path}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(link.id);
      toast({
        title: 'Link copied!',
        description: `${link.label} link copied to clipboard.`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const openLink = (path: string) => {
    window.open(`${PUBLISHED_URL}${path}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Signup Links</h2>
        <p className="text-muted-foreground">
          Copy and share these links to invite creators, organizations, sponsors, and users.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SIGNUP_LINKS.map((link) => (
          <Card key={link.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${link.color}`}>
                    {link.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.label}</CardTitle>
                    <CardDescription className="text-sm">
                      {link.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${PUBLISHED_URL}${link.path}`}
                  className="font-mono text-sm bg-muted"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => copyToClipboard(link)}
                >
                  {copiedId === link.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLink(link.path)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick reference section */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-muted-foreground" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            {SIGNUP_LINKS.map((link) => (
              <div key={link.id} className="flex items-center justify-between py-1 border-b last:border-0">
                <span className="font-medium">{link.label}</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {link.path}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
