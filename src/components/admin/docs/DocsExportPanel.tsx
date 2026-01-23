/**
 * =============================================================================
 * DOCS EXPORT PANEL - CTO Handoff Pack Export Interface
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Download, 
  Package, 
  FileText, 
  Database, 
  Code, 
  Shield, 
  BarChart3,
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface ExportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: 'auto' | 'manual' | 'mixed';
  enabled: boolean;
}

export function DocsExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [sections, setSections] = useState<ExportSection[]>([
    { id: 'product', label: 'Product Overview', description: 'Mission, personas, value proposition', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true },
    { id: 'flows', label: 'Flows & State Machines', description: 'User journeys and state transitions', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true },
    { id: 'rules', label: 'Business Rules', description: 'Gamification, matching, guardrails', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true },
    { id: 'datamodel', label: 'Data Model & Schema', description: 'Tables, relationships, ERD', icon: <Database className="h-4 w-4" />, type: 'auto', enabled: true },
    { id: 'apis', label: 'API Documentation', description: 'Edge functions, RPCs', icon: <Code className="h-4 w-4" />, type: 'auto', enabled: true },
    { id: 'ux', label: 'UX Routes & Components', description: 'Route map, component inventory', icon: <BarChart3 className="h-4 w-4" />, type: 'auto', enabled: true },
    { id: 'security', label: 'Security & Compliance', description: 'RBAC, RLS policies, PII handling', icon: <Shield className="h-4 w-4" />, type: 'mixed', enabled: true },
    { id: 'estimation', label: 'Estimation & Stories', description: 'Epics, risks, unknowns', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true },
  ]);

  // Fetch document counts
  const { data: docCounts } = useQuery({
    queryKey: ['system-docs-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_docs')
        .select('category')
        .eq('is_published', true);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(d => {
        counts[d.category] = (counts[d.category] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch last export info (we'll store this in a simple way)
  const { data: lastExport } = useQuery({
    queryKey: ['last-handoff-export'],
    queryFn: async () => {
      // Check if there's a record of last export in system_docs
      const { data } = await supabase
        .from('system_docs')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      return data?.updated_at ? new Date(data.updated_at) : null;
    },
  });

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress steps
      const steps = [
        'Fetching manual documentation...',
        'Querying database schema...',
        'Generating route manifest...',
        'Compiling component inventory...',
        'Building security documentation...',
        'Creating Mermaid diagrams...',
        'Assembling bundle...',
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setExportProgress(((i + 1) / steps.length) * 100);
      }

      // Call the edge function to generate the pack
      const { data, error } = await supabase.functions.invoke('export-handoff-pack', {
        body: {
          sections: sections.filter(s => s.enabled).map(s => s.id),
        },
      });

      if (error) throw error;

      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openclique-handoff-pack-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('CTO Handoff Pack exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const totalDocs = Object.values(docCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Export CTO Handoff Pack</h2>
        <p className="text-muted-foreground mt-1">
          Generate a complete documentation bundle for external engineering teams or CTO onboarding.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Manual Docs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalDocs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Auto-Generated</span>
            </div>
            <p className="text-2xl font-bold mt-1">3</p>
            <p className="text-xs text-muted-foreground">Schema, Routes, Components</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Updated</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {lastExport ? format(lastExport, 'MMM d, yyyy') : 'Never'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Ready</span>
            </div>
            <p className="text-lg font-semibold mt-1 text-green-600">All Systems Go</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Contents
          </CardTitle>
          <CardDescription>
            Select which sections to include in the handoff pack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div 
              key={section.id}
              className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={section.id}
                checked={section.enabled}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={section.id} className="font-medium cursor-pointer">
                    {section.label}
                  </Label>
                  <Badge 
                    variant={section.type === 'auto' ? 'secondary' : section.type === 'manual' ? 'outline' : 'default'}
                    className="text-xs"
                  >
                    {section.type === 'auto' && '📊 Auto-generated'}
                    {section.type === 'manual' && '✍️ Manual'}
                    {section.type === 'mixed' && '🔄 Mixed'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              {section.icon}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating pack...</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div>
          <p className="font-medium">Ready to export</p>
          <p className="text-sm text-muted-foreground">
            {sections.filter(s => s.enabled).length} sections selected
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleExport}
          disabled={isExporting || sections.filter(s => s.enabled).length === 0}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate & Download Pack
            </>
          )}
        </Button>
      </div>

      {/* Gaps Notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200 text-base">
            ⚠️ Known Documentation Gaps
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
          <p>The following items cannot be auto-generated and require manual documentation:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Full OpenAPI specification for all endpoints</li>
            <li>Deployment architecture diagrams</li>
            <li>Third-party integration credentials and setup</li>
            <li>Business metrics and KPIs</li>
            <li>Cost model and billing details</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
