/**
 * =============================================================================
 * useAIPrompts Hook - Admin management of AI prompts with version control
 * =============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AIPrompt {
  id: string;
  prompt_key: string;
  prompt_name: string;
  prompt_template: string;
  personality_context: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AIPromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  prompt_template: string;
  personality_context: string | null;
  changelog: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AIPromptVariable {
  id: string;
  prompt_id: string;
  variable_name: string;
  description: string | null;
  example_value: Record<string, unknown> | null;
  created_at: string;
}

export function useAIPrompts() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all prompts
  const { data: prompts = [], isLoading: isLoadingPrompts } = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('prompt_key');

      if (error) throw error;
      return (data || []) as AIPrompt[];
    },
    enabled: isAdmin,
  });

  // Fetch version history for a specific prompt
  const usePromptVersions = (promptId: string) => {
    return useQuery({
      queryKey: ['ai-prompt-versions', promptId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ai_prompt_versions')
          .select('*')
          .eq('prompt_id', promptId)
          .order('version', { ascending: false });

        if (error) throw error;
        return (data || []) as AIPromptVersion[];
      },
      enabled: !!promptId && isAdmin,
    });
  };

  // Fetch variables for a specific prompt
  const usePromptVariables = (promptId: string) => {
    return useQuery({
      queryKey: ['ai-prompt-variables', promptId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('ai_prompt_variables')
          .select('*')
          .eq('prompt_id', promptId)
          .order('variable_name');

        if (error) throw error;
        return (data || []) as AIPromptVariable[];
      },
      enabled: !!promptId,
    });
  };

  // Update prompt (creates new version)
  const updatePromptMutation = useMutation({
    mutationFn: async ({
      promptId,
      template,
      personality,
      changelog,
    }: {
      promptId: string;
      template: string;
      personality?: string | null;
      changelog: string;
    }) => {
      if (!user?.id || !isAdmin) throw new Error('Admin access required');

      // Get current prompt to get version number
      const { data: currentPrompt, error: fetchError } = await supabase
        .from('ai_prompts')
        .select('version, prompt_template, personality_context')
        .eq('id', promptId)
        .single();

      if (fetchError) throw fetchError;

      const newVersion = (currentPrompt.version || 0) + 1;

      // Save current version to history
      const { error: historyError } = await supabase
        .from('ai_prompt_versions')
        .insert({
          prompt_id: promptId,
          version: currentPrompt.version,
          prompt_template: currentPrompt.prompt_template,
          personality_context: currentPrompt.personality_context,
          changelog,
          created_by: user.id,
        });

      if (historyError) throw historyError;

      // Update the prompt
      const { data, error: updateError } = await supabase
        .from('ai_prompts')
        .update({
          prompt_template: template,
          personality_context: personality,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data as AIPrompt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-versions', data.id] });
      toast.success(`Prompt updated to version ${data.version}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update prompt: ${error.message}`);
    },
  });

  // Rollback to a previous version
  const rollbackMutation = useMutation({
    mutationFn: async ({
      promptId,
      versionId,
    }: {
      promptId: string;
      versionId: string;
    }) => {
      if (!user?.id || !isAdmin) throw new Error('Admin access required');

      // Get the version to rollback to
      const { data: targetVersion, error: fetchError } = await supabase
        .from('ai_prompt_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (fetchError) throw fetchError;

      // Update prompt with version content
      return updatePromptMutation.mutateAsync({
        promptId,
        template: targetVersion.prompt_template,
        personality: targetVersion.personality_context,
        changelog: `Rollback to version ${targetVersion.version}`,
      });
    },
    onSuccess: () => {
      toast.success('Prompt rolled back successfully');
    },
  });

  // Add a new variable to a prompt
  const addVariableMutation = useMutation({
    mutationFn: async ({
      promptId,
      variableName,
      description,
      exampleValue,
    }: {
      promptId: string;
      variableName: string;
      description?: string;
      exampleValue?: Record<string, unknown>;
    }) => {
      if (!isAdmin) throw new Error('Admin access required');

      const insertData = {
        prompt_id: promptId,
        variable_name: variableName,
        description: description || null,
        example_value: exampleValue || null,
      };

      const { data, error } = await supabase
        .from('ai_prompt_variables')
        .insert([insertData] as any)
        .select()
        .single();

      if (error) throw error;
      return data as AIPromptVariable;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-variables', data.prompt_id] });
      toast.success('Variable added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add variable: ${error.message}`);
    },
  });

  // Delete a variable
  const deleteVariableMutation = useMutation({
    mutationFn: async (variableId: string) => {
      if (!isAdmin) throw new Error('Admin access required');

      const { error } = await supabase
        .from('ai_prompt_variables')
        .delete()
        .eq('id', variableId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-variables'] });
      toast.success('Variable deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete variable: ${error.message}`);
    },
  });

  // Get prompt by key (for edge functions to use)
  const getPromptByKey = (key: string): AIPrompt | undefined => {
    return prompts.find((p) => p.prompt_key === key && p.is_active);
  };

  return {
    prompts,
    isLoading: isLoadingPrompts,
    getPromptByKey,
    usePromptVersions,
    usePromptVariables,

    // Mutations
    updatePrompt: updatePromptMutation.mutateAsync,
    rollbackPrompt: rollbackMutation.mutateAsync,
    addVariable: addVariableMutation.mutateAsync,
    deleteVariable: deleteVariableMutation.mutateAsync,

    isUpdating:
      updatePromptMutation.isPending ||
      rollbackMutation.isPending ||
      addVariableMutation.isPending ||
      deleteVariableMutation.isPending,
  };
}
