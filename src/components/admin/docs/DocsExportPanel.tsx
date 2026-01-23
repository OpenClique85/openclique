/**
 * =============================================================================
 * DOCS EXPORT PANEL - Multi-Format Export Interface
 * =============================================================================
 * 
 * Supports CTO Handoff Pack and COO Playbook exports in:
 * - JSON: Structured data for programmatic use
 * - Markdown: Human-readable documentation
 * - LLM: XML-structured context for RAG/embedding
 * 
 * Features:
 * - Change tracking with visual indicators
 * - Export history tracking
 * - Content hash-based change detection
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
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
  FileJson,
  ClipboardList,
  Target,
  AlertCircle,
  RefreshCw,
  History,
  Sparkles,
  Cloud,
  CloudOff,
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { DocPreviewModal, type PreviewDocument } from './DocPreviewModal';
import { useDocChangeTracking } from '@/hooks/useDocChangeTracking';

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
  categories?: string[]; // Multiple categories for a section
}

const CTO_SECTIONS: ExportSection[] = [
  { id: 'product', label: 'Product Overview', description: 'Mission, personas, value proposition', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'product', categories: ['product'] },
  { id: 'flows', label: 'Flows & State Machines', description: 'User journeys and state transitions', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'flow', categories: ['flow', 'state_machine'] },
  { id: 'rules', label: 'Business Rules', description: 'Gamification, matching, guardrails', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'rule', categories: ['rule', 'guardrail'] },
  { id: 'datamodel', label: 'Data Model & Schema', description: 'Tables, relationships, ERD', icon: <Database className="h-4 w-4" />, type: 'auto', enabled: true, category: 'datamodel', categories: ['datamodel'] },
  { id: 'apis', label: 'API Documentation', description: 'Edge functions, RPCs', icon: <Code className="h-4 w-4" />, type: 'auto', enabled: true, category: 'api', categories: ['api'] },
  { id: 'ux', label: 'UX Routes & Components', description: 'Route map, component inventory', icon: <BarChart3 className="h-4 w-4" />, type: 'auto', enabled: true, category: 'ux', categories: ['ux'] },
  { id: 'security', label: 'Security & Compliance', description: 'RBAC, RLS policies, PII handling', icon: <Shield className="h-4 w-4" />, type: 'mixed', enabled: true, category: 'security', categories: ['security', 'ops'] },
  { id: 'estimation', label: 'Estimation & Stories', description: 'Epics, risks, unknowns', icon: <FileText className="h-4 w-4" />, type: 'manual', enabled: true, category: 'estimation', categories: ['estimation'] },
];

const COO_SECTIONS: ExportSection[] = [
  { id: 'playbooks', label: 'Operations Playbooks', description: 'Daily ops, escalation, crisis response', icon: <ClipboardList className="h-4 w-4" />, type: 'manual', enabled: true, category: 'playbook', categories: ['playbook'] },
  { id: 'processes', label: 'Business Processes', description: 'Partner onboarding, workflows', icon: <Target className="h-4 w-4" />, type: 'manual', enabled: true, category: 'process', categories: ['process'] },
  { id: 'slas', label: 'SLAs', description: 'Response times, uptime targets', icon: <Clock className="h-4 w-4" />, type: 'manual', enabled: true, category: 'sla', categories: ['sla'] },
  { id: 'metrics', label: 'Metrics & KPIs', description: 'Dashboards, reporting guidance', icon: <BarChart3 className="h-4 w-4" />, type: 'manual', enabled: true, category: 'metrics', categories: ['metrics'] },
];

const FORMAT_OPTIONS = [
  { 
    id: 'json' as ExportFormat, 
    label: 'JSON Bundle', 
    description: 'Structured data for programmatic use',
    icon: <FileJson className="h-5 w-5" />,
    extension: '.json',
    dbFormat: 'json' as const,
  },
  { 
    id: 'markdown' as ExportFormat, 
    label: 'Markdown Document', 
    description: 'Human-readable documentation',
    icon: <FileText className="h-5 w-5" />,
    extension: '.md',
    dbFormat: 'markdown' as const,
  },
  { 
    id: 'llm' as ExportFormat, 
    label: 'LLM Context File', 
    description: 'XML-structured for RAG/embedding',
    icon: <Cpu className="h-5 w-5" />,
    extension: '.xml',
    dbFormat: 'llm_xml' as const,
  },
];

// Change indicator component
function ChangeIndicator({ changed, total }: { changed: number; total: number }) {
  if (total === 0) return null;
  
  if (changed === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Up to date
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>All {total} document{total !== 1 ? 's' : ''} synced with last export</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
            <Sparkles className="h-3 w-3 mr-1" />
            {changed} changed
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{changed} of {total} document{total !== 1 ? 's' : ''} modified since last export</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DocsExportPanel() {
  const [packType, setPackType] = useState<PackType>('cto');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<PreviewDocument[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [saveToCloud, setSaveToCloud] = useState(true); // Default to saving to cloud
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const [ctoSections, setCtoSections] = useState<ExportSection[]>(CTO_SECTIONS);
  const [cooSections, setCooSections] = useState<ExportSection[]>(COO_SECTIONS);

  const currentSections = packType === 'cto' ? ctoSections : cooSections;
  const setCurrentSections = packType === 'cto' ? setCtoSections : setCooSections;

  // Use change tracking hook with optional auto-refresh (30 seconds)
  const { 
    changeStats, 
    exportHistory, 
    getChangesForCategories, 
    markExported,
    isLoading: isLoadingChanges,
    refetchDocs,
    refetchHistory,
    refreshExportUrl,
  } = useDocChangeTracking(autoRefresh ? 30000 : undefined);

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
      const steps = saveToCloud 
        ? ['Fetching documentation...', 'Processing sections...', 'Generating output...', 'Uploading to Cloud...', 'Recording export...']
        : ['Fetching documentation...', 'Processing sections...', 'Generating output...', 'Preparing download...'];

      for (let i = 0; i < steps.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setExportProgress(((i + 1) / steps.length) * 100);
      }

      const { data, error } = await supabase.functions.invoke('export-handoff-pack', {
        body: {
          sections: currentSections.filter(s => s.enabled).map(s => s.id),
          packType,
          format: exportFormat,
          saveToStorage: saveToCloud,
        },
      });

      if (error) throw error;

      setExportProgress(100);

      const formatConfig = FORMAT_OPTIONS.find(f => f.id === exportFormat)!;

      if (saveToCloud) {
        // Cloud storage mode - edge function handles everything
        toast.success(
          `${packType === 'cto' ? 'CTO Handoff Pack' : 'COO Playbook'} saved to Cloud!`,
          { description: 'Download link available in export history.' }
        );
        // Refresh history to show new export
        refetchHistory();
        refetchDocs();
      } else {
        // Direct download mode
        const includedCategories = currentSections
          .filter(s => s.enabled)
          .flatMap(s => s.categories || [s.category]);
        
        try {
          await markExported.mutateAsync({
            packType: packType === 'cto' ? 'cto' : 'coo',
            exportFormat: formatConfig.dbFormat,
            categories: includedCategories,
          });
        } catch (trackingError) {
          console.warn('Failed to record export in history:', trackingError);
        }

        // Determine content type and extension
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
      }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Export Center</h2>
          <p className="text-muted-foreground mt-1">
            Generate documentation bundles for CTO handoffs or COO operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                    Auto-refresh
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically check for changes every 30 seconds</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { refetchDocs(); refetchHistory(); }}
            disabled={isLoadingChanges}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingChanges ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Change Summary Banner */}
      {changeStats && changeStats.changedDocs > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {changeStats.changedDocs} document{changeStats.changedDocs !== 1 ? 's' : ''} modified since last export
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {changeStats.neverExported > 0 && (
                    <span>{changeStats.neverExported} never exported. </span>
                  )}
                  {changeStats.lastExportDate ? (
                    <span>Last export: {formatDistanceToNow(changeStats.lastExportDate, { addSuffix: true })}</span>
                  ) : (
                    <span>No exports recorded yet.</span>
                  )}
                </p>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {changeStats.changedDocs} pending
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
          {currentSections.map((section) => {
            const sectionCategories = section.categories || [section.category];
            const changes = getChangesForCategories(sectionCategories);
            
            return (
              <div 
                key={section.id}
                className={`flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                  changes.changed > 0 ? 'border-amber-200 dark:border-amber-800' : ''
                }`}
              >
                <Checkbox
                  id={section.id}
                  checked={section.enabled}
                  onCheckedChange={() => toggleSection(section.id)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {changes.total > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {changes.total} doc{changes.total !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {/* Change indicator */}
                    <ChangeIndicator changed={changes.changed} total={changes.total} />
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
            );
          })}
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-medium">Ready to export</p>
                {/* Cloud storage toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
                        <Switch
                          id="save-to-cloud"
                          checked={saveToCloud}
                          onCheckedChange={setSaveToCloud}
                        />
                        <Label htmlFor="save-to-cloud" className="text-xs cursor-pointer flex items-center gap-1">
                          {saveToCloud ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
                          {saveToCloud ? 'Save to Cloud' : 'Direct Download'}
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{saveToCloud 
                        ? 'Export will be saved to Cloud storage with shareable download link' 
                        : 'File will be downloaded directly to your device'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentSections.filter(s => s.enabled).length} sections as {FORMAT_OPTIONS.find(f => f.id === exportFormat)?.label}
                {saveToCloud && ' • Link valid for 7 days'}
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
                    {saveToCloud ? 'Uploading...' : 'Exporting...'}
                  </>
                ) : (
                  <>
                    {saveToCloud ? <Cloud className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    {saveToCloud ? 'Export to Cloud' : `Download ${FORMAT_OPTIONS.find(f => f.id === exportFormat)?.extension}`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Export History */}
      {exportHistory && exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Recent Exports
            </CardTitle>
            <CardDescription>Track your documentation exports with download links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportHistory.slice(0, 10).map((entry) => {
                const isExpired = entry.expires_at && new Date(entry.expires_at) < new Date();
                const hasDownloadLink = entry.file_url && !isExpired;
                
                return (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        entry.pack_type === 'cto' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        {entry.pack_type === 'cto' 
                          ? <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          : <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400" />
                        }
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {entry.pack_type === 'cto' ? 'CTO Pack' : entry.pack_type === 'coo' ? 'COO Playbook' : 'Full Export'}
                          {entry.file_path && (
                            <Badge variant="outline" className="text-xs">
                              <Cloud className="h-3 w-3 mr-1" />
                              Cloud
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.document_count} docs • {entry.export_format.replace('_', ' ').toUpperCase()}
                          {entry.total_size_bytes && ` • ${(entry.total_size_bytes / 1024).toFixed(1)}KB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-muted-foreground">
                          {format(new Date(entry.exported_at), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isExpired ? (
                            <span className="text-destructive">Expired</span>
                          ) : entry.expires_at ? (
                            <span>Expires {formatDistanceToNow(new Date(entry.expires_at), { addSuffix: true })}</span>
                          ) : (
                            formatDistanceToNow(new Date(entry.exported_at), { addSuffix: true })
                          )}
                        </p>
                      </div>
                      {hasDownloadLink && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(entry.file_url!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download export</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isExpired && entry.file_path && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={async () => {
                                  const newUrl = await refreshExportUrl(entry.id, entry.file_path!);
                                  if (newUrl) {
                                    window.open(newUrl, '_blank');
                                    refetchHistory();
                                  } else {
                                    toast.error('Failed to refresh download link');
                                  }
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Refresh download link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Changed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{changeStats?.changedDocs || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Synced</span>
            </div>
            <p className="text-2xl font-bold mt-1">{changeStats?.unchangedDocs || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Export</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {changeStats?.lastExportDate 
                ? format(changeStats.lastExportDate, 'MMM d') 
                : 'Never'}
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
