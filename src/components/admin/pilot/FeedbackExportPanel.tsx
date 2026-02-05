/**
 * =============================================================================
 * Feedback Export Panel - Admin component for exporting feedback data
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Download, FileSpreadsheet, FileJson, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedbackExportPanelProps {
  instanceId?: string;
  questId?: string;
  squadId?: string;
  title?: string;
}

export function FeedbackExportPanel({ 
  instanceId, 
  questId, 
  squadId,
  title = 'Export Feedback Data'
}: FeedbackExportPanelProps) {
  const [scope, setScope] = useState<string>(
    instanceId ? 'instance' : questId ? 'quest' : squadId ? 'clique' : 'date_range'
  );
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeTestimonials, setIncludeTestimonials] = useState(true);
  const [includePricing, setIncludePricing] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const payload: Record<string, any> = {
        scope,
        format,
        includeTestimonials,
        includePricing,
      };

      if (scope === 'instance' && instanceId) {
        payload.instanceId = instanceId;
      } else if (scope === 'quest' && questId) {
        payload.questId = questId;
      } else if (scope === 'clique' && squadId) {
        payload.squadId = squadId;
      } else if (scope === 'date_range') {
        if (!startDate || !endDate) {
          toast.error('Please select both start and end dates');
          setIsExporting(false);
          return;
        }
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      const { data, error } = await supabase.functions.invoke('export-admin-feedback', {
        body: payload,
      });

      if (error) throw error;

      // Handle response based on format
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `feedback-export-${scope}-${new Date().toISOString().split('T')[0]}.json`);
      } else {
        // CSV is returned as text
        const blob = new Blob([data], { type: 'text/csv' });
        downloadBlob(blob, `feedback-export-${scope}-${new Date().toISOString().split('T')[0]}.csv`);
      }

      toast.success('Export downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Export feedback data for analysis and reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scope Selection */}
        {!instanceId && !questId && !squadId && (
          <div className="space-y-2">
            <Label>Export Scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_range">Date Range</SelectItem>
                <SelectItem value="all">All Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Inputs */}
        {scope === 'date_range' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel-compatible)
                </span>
              </SelectItem>
              <SelectItem value="json">
                <span className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON (Structured data)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="include-testimonials" className="cursor-pointer">
              Include testimonials
            </Label>
            <Switch
              id="include-testimonials"
              checked={includeTestimonials}
              onCheckedChange={setIncludeTestimonials}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="include-pricing" className="cursor-pointer">
              Include pricing feedback
            </Label>
            <Switch
              id="include-pricing"
              checked={includePricing}
              onCheckedChange={setIncludePricing}
            />
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {format.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
