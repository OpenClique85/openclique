/**
 * =============================================================================
 * DOC CHANGE TRACKING HOOK
 * =============================================================================
 * 
 * Tracks document changes between exports using content hashes.
 * Provides visual indicators for modified documents.
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocChangeInfo {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  content_hash: string | null;
  last_exported_at: string | null;
  updated_at: string;
  is_changed: boolean;
}

export interface ExportHistoryEntry {
  id: string;
  exported_at: string;
  exported_by: string;
  pack_type: 'cto' | 'coo' | 'full';
  export_format: 'json' | 'markdown' | 'llm_xml';
  included_categories: string[];
  document_count: number;
  total_size_bytes: number | null;
  file_path: string | null;
  file_url: string | null;
  expires_at: string | null;
}

export interface ChangeStats {
  totalDocs: number;
  changedDocs: number;
  unchangedDocs: number;
  neverExported: number;
  lastExportDate: Date | null;
  changesByCategory: Record<string, { total: number; changed: number }>;
}

export function useDocChangeTracking(autoRefreshInterval?: number) {
  const queryClient = useQueryClient();

  // Fetch all docs with change tracking info
  const { data: docsWithChanges, isLoading: isLoadingDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['doc-change-tracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_docs')
        .select('id, title, category, subcategory, content_hash, last_exported_at, updated_at, is_published')
        .eq('is_published', true)
        .order('category')
        .order('sort_order');

      if (error) throw error;

      // A document is "changed" if:
      // 1. It was never exported (last_exported_at is null), or
      // 2. It was updated after the last export (updated_at > last_exported_at)
      const docsWithChangeInfo: DocChangeInfo[] = (data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        subcategory: doc.subcategory,
        content_hash: doc.content_hash,
        last_exported_at: doc.last_exported_at,
        updated_at: doc.updated_at,
        is_changed: !doc.last_exported_at || new Date(doc.updated_at) > new Date(doc.last_exported_at),
      }));

      return docsWithChangeInfo;
    },
    refetchInterval: autoRefreshInterval, // Auto-refresh if interval provided
  });

  // Fetch export history
  const { data: exportHistory, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['doc-export-history'],
    queryFn: async () => {
      // Cast to any since doc_export_history table was just created
      const { data, error } = await (supabase
        .from('doc_export_history' as any)
        .select('*')
        .order('exported_at', { ascending: false })
        .limit(50) as any);

      if (error) throw error;
      return (data || []) as ExportHistoryEntry[];
    },
    refetchInterval: autoRefreshInterval, // Auto-refresh if interval provided
  });

  // Compute change statistics
  const changeStats: ChangeStats | null = docsWithChanges ? {
    totalDocs: docsWithChanges.length,
    changedDocs: docsWithChanges.filter(d => d.is_changed).length,
    unchangedDocs: docsWithChanges.filter(d => !d.is_changed).length,
    neverExported: docsWithChanges.filter(d => !d.last_exported_at).length,
    lastExportDate: exportHistory?.[0]?.exported_at ? new Date(exportHistory[0].exported_at) : null,
    changesByCategory: docsWithChanges.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = { total: 0, changed: 0 };
      }
      acc[doc.category].total++;
      if (doc.is_changed) acc[doc.category].changed++;
      return acc;
    }, {} as Record<string, { total: number; changed: number }>),
  } : null;

  // Mark documents as exported
  const markExported = useMutation({
    mutationFn: async ({ 
      packType, 
      exportFormat, 
      categories 
    }: { 
      packType: 'cto' | 'coo' | 'full';
      exportFormat: 'json' | 'markdown' | 'llm_xml';
      categories: string[];
    }) => {
      const now = new Date().toISOString();

      // Update last_exported_at for all docs in the export
      const { error: updateError } = await supabase
        .from('system_docs')
        .update({ last_exported_at: now })
        .in('category', categories)
        .eq('is_published', true);

      if (updateError) throw updateError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate document count
      const docCount = docsWithChanges?.filter(d => categories.includes(d.category)).length || 0;

      // Record export in history (cast to any since table was just created)
      const { error: historyError } = await (supabase
        .from('doc_export_history' as any)
        .insert({
          exported_by: user.id,
          pack_type: packType,
          export_format: exportFormat,
          included_categories: categories,
          document_count: docCount,
        }) as any);

      if (historyError) throw historyError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-change-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['doc-export-history'] });
    },
  });

  // Get changes for specific categories (for section-level change indicators)
  const getChangesForCategories = (categories: string[]): { total: number; changed: number } => {
    if (!docsWithChanges) return { total: 0, changed: 0 };
    
    const filtered = docsWithChanges.filter(d => categories.includes(d.category));
    return {
      total: filtered.length,
      changed: filtered.filter(d => d.is_changed).length,
    };
  };

  // Refresh signed URLs for expired exports
  const refreshExportUrl = async (exportId: string, filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('doc-exports')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days
      
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (err) {
      console.error('Failed to refresh export URL:', err);
      return null;
    }
  };

  return {
    docsWithChanges,
    exportHistory,
    changeStats,
    isLoading: isLoadingDocs || isLoadingHistory,
    markExported,
    getChangesForCategories,
    refetchDocs,
    refetchHistory,
    refreshExportUrl,
  };
}
