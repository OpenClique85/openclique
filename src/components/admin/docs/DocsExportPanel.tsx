/**
 * =============================================================================
 * DOCS EXPORT PANEL - Multi-Format Export Interface
 * =============================================================================
 * 
 * Supports CTO Handoff Pack and COO Playbook exports in:
 * - JSON: Structured data for programmatic use
 * - Markdown: Human-readable documentation
 * - LLM: XML-structured context for RAG/embedding
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock,
  Eye,
  Briefcase,
  Cpu,
  FileCode,
  FileJson,
  ClipboardList,
  Target,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { DocPreviewModal, type PreviewDocument } from './DocPreviewModal';

type PackType = 'cto' | 'coo';
type ExportFormat = 'json' | 'markdown' | 'llm';

interface ExportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: 'auto' | 'manual' | 'mixed';
  enabled: boolean;
  category: string;
}

const CTO_SECTIONS: ExportSection[] = [
  { id: 'product', label: 'Product Overview', description: 'Mission, personas, value proposition', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'product' },
  { id: 'flows', label: 'Flows & State Machines', description: 'User journeys and state transitions', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'flow' },
  { id: 'rules', label: 'Business Rules', description: 'Gamification, matching, guardrails', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'rule' },
  { id: 'datamodel', label: 'Data Model & Schema', description: 'Tables, relationships, ERD', icon: <Database className="h-4 w-4" />, type: 'auto', enabled: true, category: 'datamodel' },
  { id: 'apis', label: 'API Documentation', description: 'Edge functions, RPCs', icon: <Code className="h-4 w-4" />, type: 'auto', enabled: true, category: 'api' },
  { id: 'ux', label: 'UX Routes & Components', description: 'Route map, component inventory', icon: <BarChart3 className="h-4 w-4" />, type: 'auto', enabled: true, category: 'ux' },
  { id: 'security', label: 'Security & Compliance', description: 'RBAC, RLS policies, PII handling', icon: <Shield className="h-4 w-4" />, type: 'mixed', enabled: true, category: 'security' },
  { id: 'estimation', label: 'Estimation & Stories', description: 'Epics, risks, unknowns', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'estimation' },
];

const COO_SECTIONS: ExportSection[] = [
  { id: 'playbooks', label: 'Operations Playbooks', description: 'Daily ops, escalation, crisis response', icon: <ClipboardList className="h-4 w-4" />, type: 'manual', enabled: true, category: 'playbook' },
  { id: 'processes', label: 'Business Processes', description: 'Partner onboarding, workflows', icon: <Target className="h-4 w-4" />, type: 'manual', enabled: true, category: 'process' },
  { id: 'slas', label: 'SLAs', description: 'Response times, uptime targets', icon: <Clock className="h-4 w-4" />, type: 'manual', enabled: true, category: 'sla' },
  { id: 'metrics', label: 'Metrics & KPIs', description: 'Dashboards, reporting guidance', icon: <BarChart3 className="h-4 w-4" />, type: 'manual', enabled: true, category: 'metrics' },
];

const FORMAT_OPTIONS = [
  { 
    id: 'json' as ExportFormat, 
    label: 'JSON Bundle', 
    description: 'Structured data for programmatic use',
    icon: <FileJson className="h-5 w-5" />,
    extension: '.json',
  },
  { 
    id: 'markdown' as ExportFormat, 
    label: 'Markdown Document', 
    description: 'Human-readable documentation',
    icon: <FileText className="h-5 w-5" />,
    extension: '.md',
  },
  { 
    id: 'llm' as ExportFormat, 
    label: 'LLM Context File', 
    description: 'XML-structured for RAG/embedding',
    icon: <Cpu className="h-5 w-5" />,
    extension: '.xml',
  },
];

export function DocsExportPanel() {
  const [packType, setPackType] = useState<PackType>('cto');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<PreviewDocument[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  
  const [ctoSections, setCtoSections] = useState<ExportSection[]>(CTO_SECTIONS);
  const [cooSections, setCooSections] = useState<ExportSection[]>(COO_SECTIONS);

  const currentSections = packType === 'cto' ? ctoSections : cooSections;
  const setCurrentSections = packType === 'cto' ? setCtoSections : setCooSections;

  // Fetch all system docs for preview
  const { data: allDocs } = useQuery({
    queryKey: ['system-docs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_docs')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as PreviewDocument[];
    },
  });

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

  // Fetch last export info
  const { data: lastExport } = useQuery({
    queryKey: ['last-handoff-export'],
    queryFn: async () => {
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
    setCurrentSections(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handlePreviewSection = (section: ExportSection) => {
    if (!allDocs) return;
    
    const categoryMap: Record<string, string[]> = {
      'product': ['product'],
      'flows': ['flow', 'state_machine'],
      'rules': ['rule', 'guardrail'],
      'security': ['security', 'ops'],
      'estimation': ['estimation'],
      'playbooks': ['playbook'],
      'processes': ['process'],
      'slas': ['sla'],
      'metrics': ['metrics'],
    };
    
    const categories = categoryMap[section.id] || [section.category];
    const filteredDocs = allDocs.filter(d => categories.includes(d.category));
    
    if (filteredDocs.length === 0) {
      toast.info(`No documents found for ${section.label}`);
      return;
    }
    
    setPreviewDocs(filteredDocs);
    setPreviewTitle(section.label);
    setPreviewOpen(true);
  };

  const handlePreviewAll = () => {
    if (!allDocs || allDocs.length === 0) {
      toast.info('No documents available to preview');
      return;
    }
    
    const categoryMap: Record<string, string[]> = {
      'product': ['product'],
      'flows': ['flow', 'state_machine'],
      'rules': ['rule', 'guardrail'],
      'security': ['security', 'ops'],
      'estimation': ['estimation'],
      'playbooks': ['playbook'],
      'processes': ['process'],
      'slas': ['sla'],
      'metrics': ['metrics'],
    };
    
    const enabledCategories = currentSections
      .filter(s => s.enabled)
      .flatMap(s => categoryMap[s.id] || [s.category]);
    
    const filteredDocs = allDocs.filter(d => enabledCategories.includes(d.category));
    
    setPreviewDocs(filteredDocs);
    setPreviewTitle(packType === 'cto' ? 'CTO Handoff Pack Preview' : 'COO Operations Playbook Preview');
    setPreviewOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const steps = [
        'Fetching documentation...',
        'Processing sections...',
        'Generating diagrams...',
        'Formatting output...',
        'Assembling bundle...',
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 250));
        setExportProgress(((i + 1) / steps.length) * 100);
      }

      const { data, error } = await supabase.functions.invoke('export-handoff-pack', {
        body: {
          sections: currentSections.filter(s => s.enabled).map(s => s.id),
          packType,
          format: exportFormat,
        },
      });

      if (error) throw error;

      // Determine content type and extension
      const formatConfig = FORMAT_OPTIONS.find(f => f.id === exportFormat)!;
      let blob: Blob;
      let filename: string;

      if (exportFormat === 'json') {
        blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `openclique-${packType}-handoff-${format(new Date(), 'yyyy-MM-dd')}.json`;
      } else if (exportFormat === 'markdown') {
        blob = new Blob([data], { type: 'text/markdown' });
        filename = `openclique-${packType}-handoff-${format(new Date(), 'yyyy-MM-dd')}.md`;
      } else {
        blob = new Blob([data], { type: 'application/xml' });
        filename = `openclique-${packType}-context-${format(new Date(), 'yyyy-MM-dd')}.xml`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${packType === 'cto' ? 'CTO Handoff Pack' : 'COO Playbook'} exported as ${formatConfig.label}!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const totalDocs = Object.values(docCounts || {}).reduce((a, b) => a + b, 0);
  const ctoDocs = ['product', 'flow', 'state_machine', 'rule', 'guardrail', 'security', 'estimation']
    .reduce((sum, cat) => sum + (docCounts?.[cat] || 0), 0);
  const cooDocs = ['playbook', 'process', 'sla', 'metrics']
    .reduce((sum, cat) => sum + (docCounts?.[cat] || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Export Center</h2>
        <p className="text-muted-foreground mt-1">
          Generate documentation bundles for CTO handoffs or COO operations.
        </p>
      </div>

      {/* Pack Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${packType === 'cto' ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
          onClick={() => setPackType('cto')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">CTO Handoff Pack</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Technical specification for engineering teams
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{ctoDocs} docs</Badge>
                  <Badge variant="outline">8 sections</Badge>
                </div>
              </div>
              {packType === 'cto' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${packType === 'coo' ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
          onClick={() => setPackType('coo')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <ClipboardList className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">COO Operations Playbook</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Operational procedures for leadership
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{cooDocs} docs</Badge>
                  <Badge variant="outline">4 sections</Badge>
                </div>
              </div>
              {packType === 'coo' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Format</CardTitle>
          <CardDescription>Choose how to format the output</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={exportFormat} 
            onValueChange={(v) => setExportFormat(v as ExportFormat)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {FORMAT_OPTIONS.map((fmt) => (
              <Label
                key={fmt.id}
                htmlFor={fmt.id}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  exportFormat === fmt.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={fmt.id} id={fmt.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {fmt.icon}
                    <span className="font-medium">{fmt.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{fmt.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{fmt.extension}</Badge>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Section Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {packType === 'cto' ? 'CTO Pack Contents' : 'COO Playbook Contents'}
          </CardTitle>
          <CardDescription>
            Select which sections to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentSections.map((section) => (
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
                    {section.type === 'auto' && '📊 Auto'}
                    {section.type === 'manual' && '✍️ Manual'}
                    {section.type === 'mixed' && '🔄 Mixed'}
                  </Badge>
                  {docCounts && docCounts[section.category] && (
                    <Badge variant="secondary" className="text-xs">
                      {docCounts[section.category]} doc{docCounts[section.category] !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {section.type !== 'auto' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePreviewSection(section)}
                    title="Preview section"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {section.icon}
              </div>
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
                <span>Generating {packType === 'cto' ? 'CTO Pack' : 'COO Playbook'}...</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div>
          <p className="font-medium">Ready to export</p>
          <p className="text-sm text-muted-foreground">
            {currentSections.filter(s => s.enabled).length} sections as {FORMAT_OPTIONS.find(f => f.id === exportFormat)?.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handlePreviewAll}
            disabled={isExporting}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || currentSections.filter(s => s.enabled).length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download {FORMAT_OPTIONS.find(f => f.id === exportFormat)?.extension}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* LLM Context Info */}
      {exportFormat === 'llm' && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-purple-800 dark:text-purple-200 text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              LLM Context File Format
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
            <p>The LLM context file is structured XML optimized for:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>RAG retrieval</strong> - Modular sections for vector search chunking</li>
              <li><strong>Context injection</strong> - Paste into Claude/GPT for Q&A about the system</li>
              <li><strong>Automated parsing</strong> - XML tags enable programmatic extraction</li>
              <li><strong>Version tracking</strong> - Metadata includes generation timestamp</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Docs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalDocs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">CTO Docs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{ctoDocs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">COO Docs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{cooDocs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Updated</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {lastExport ? format(lastExport, 'MMM d') : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <DocPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        documents={previewDocs}
        title={previewTitle}
      />
    </div>
  );
}
