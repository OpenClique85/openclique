/**
 * =============================================================================
 * SQUAD EXPORT MODAL - Export squad data to JSON/CSV
 * =============================================================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface SquadExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  squadIds: string[];
}

interface ExportOptions {
  format: 'json' | 'csv';
  includeMembers: boolean;
  includeFeedback: boolean;
  includeFormation: boolean;
  includeProfiles: boolean;
}

export function SquadExportModal({ open, onOpenChange, squadIds }: SquadExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeMembers: true,
    includeFeedback: true,
    includeFormation: true,
    includeProfiles: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch export data
  const { data: exportData, isLoading } = useQuery({
    queryKey: ['squad-export-data', squadIds],
    queryFn: async () => {
      if (!squadIds.length) return null;

      // Get squads
      const { data: squads, error: squadsError } = await supabase
        .from('quest_squads')
        .select('*')
        .in('id', squadIds);

      if (squadsError) throw squadsError;

      // Get quest info
      const questIds = [...new Set((squads || []).map(s => s.quest_id).filter(Boolean))];
      
      const { data: instances } = await supabase
        .from('quest_instances')
        .select('id, title, scheduled_date, start_time')
        .in('id', questIds);
      
      const questLookup: Record<string, any> = {};
      instances?.forEach(i => {
        questLookup[i.id] = i;
      });

      // Get members
      const { data: members } = await supabase
        .from('squad_members')
        .select(`
          id,
          squad_id,
          user_id,
          status,
          role,
          added_at,
          profiles(display_name, city, preferences)
        `)
        .in('squad_id', squadIds);

      // Get feedback by quest_id
      const { data: feedback } = await supabase
        .from('feedback')
        .select('*')
        .in('quest_id', questIds);

      return { squads, questLookup, members, feedback };
    },
    enabled: open && squadIds.length > 0,
  });

  const handleExport = async () => {
    if (!exportData) return;

    setIsExporting(true);
    try {
      // Build export object
      const exportPayload = exportData.squads?.map(squad => {
        const questInfo = exportData.questLookup[squad.quest_id] || {};
        const squadMembers = exportData.members?.filter(m => m.squad_id === squad.id) || [];
        const questFeedback = exportData.feedback?.filter(f => f.quest_id === squad.quest_id) || [];

        const result: Record<string, any> = {
          id: squad.id,
          name: squad.squad_name,
          status: squad.status,
          locked: !!squad.locked_at,
          created_at: squad.created_at,
          quest: {
            title: questInfo.title || 'Unknown',
            date: questInfo.scheduled_date,
            time: questInfo.start_time,
          },
        };

        if (options.includeFormation && squad.formation_reason) {
          result.formation_reason = squad.formation_reason;
          result.compatibility_score = squad.compatibility_score;
          result.referral_bonds = squad.referral_bonds;
        }

        if (options.includeMembers) {
          result.members = squadMembers.map((m: any) => {
            const profile = m.profiles;
            const memberData: Record<string, any> = {
              user_id: m.user_id,
              display_name: profile?.display_name,
              status: m.status,
              role: m.role,
              joined_at: m.added_at,
            };
            if (options.includeProfiles) {
              memberData.city = profile?.city;
              memberData.preferences = profile?.preferences;
            }
            return memberData;
          });
        }

        if (options.includeFeedback) {
          result.feedback = {
            count: questFeedback.length,
            avg_rating: questFeedback.length
              ? questFeedback.reduce((sum, f) => sum + (f.rating_1_5 || 0), 0) / questFeedback.filter(f => f.rating_1_5).length
              : null,
            entries: questFeedback.map((f: any) => ({
              rating: f.rating_1_5,
              best_part: f.best_part,
              friction_point: f.friction_point,
              would_do_again: f.would_do_again,
              testimonial: f.is_testimonial_approved ? f.testimonial_text : null,
              submitted_at: f.submitted_at,
            })),
          };
        }

        return result;
      });

      // Generate file
      let content: string;
      let filename: string;
      let mimeType: string;

      if (options.format === 'json') {
        content = JSON.stringify(
          {
            export_date: new Date().toISOString(),
            squad_count: exportPayload?.length || 0,
            squads: exportPayload,
          },
          null,
          2
        );
        filename = `squads-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format - flatten data
        const rows: string[][] = [];
        const headers = [
          'Squad ID', 'Squad Name', 'Status', 'Locked', 'Quest Title', 'Quest Date',
        ];
        if (options.includeMembers) {
          headers.push('Member Count');
        }
        if (options.includeFeedback) {
          headers.push('Avg Rating', 'Feedback Count', 'Testimonial Count');
        }
        rows.push(headers);

        exportPayload?.forEach(squad => {
          const row = [
            squad.id,
            squad.name,
            squad.status,
            squad.locked ? 'Yes' : 'No',
            squad.quest.title || '',
            squad.quest.date || '',
          ];
          if (options.includeMembers) {
            row.push(String(squad.members?.length || 0));
          }
          if (options.includeFeedback) {
            row.push(
              squad.feedback?.avg_rating?.toFixed(1) || '',
              String(squad.feedback?.count || 0),
              String(squad.feedback?.entries?.filter((e: any) => e.testimonial).length || 0)
            );
          }
          rows.push(row);
        });

        content = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        filename = `squads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${squadIds.length} squad(s)`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Squads
          </DialogTitle>
          <DialogDescription>
            Export data for {squadIds.length} selected squad{squadIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as 'json' | 'csv' }))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  JSON (Full Data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Summary)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="members"
                  checked={options.includeMembers}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeMembers: !!checked }))
                  }
                />
                <Label htmlFor="members" className="cursor-pointer">
                  Squad Members
                </Label>
              </div>
              <div className="flex items-center space-x-2 pl-6">
                <Checkbox
                  id="profiles"
                  checked={options.includeProfiles}
                  disabled={!options.includeMembers}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeProfiles: !!checked }))
                  }
                />
                <Label htmlFor="profiles" className="cursor-pointer text-muted-foreground">
                  Include member profiles (city, preferences)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feedback"
                  checked={options.includeFeedback}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeFeedback: !!checked }))
                  }
                />
                <Label htmlFor="feedback" className="cursor-pointer">
                  Feedback & Testimonials
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="formation"
                  checked={options.includeFormation}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeFormation: !!checked }))
                  }
                />
                <Label htmlFor="formation" className="cursor-pointer">
                  Formation Reasoning
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading || isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
