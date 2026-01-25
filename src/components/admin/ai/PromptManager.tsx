/**
 * =============================================================================
 * PromptManager - Admin UI for managing AI prompts with version control
 * =============================================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Save,
  RotateCcw,
  History,
  ChevronDown,
  Plus,
  Trash2,
  Code,
  Bot,
  Sparkles,
  Variable,
} from 'lucide-react';
import { useAIPrompts, type AIPrompt, type AIPromptVersion, type AIPromptVariable } from '@/hooks/useAIPrompts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function PromptManager() {
  const {
    prompts,
    isLoading,
    usePromptVersions,
    usePromptVariables,
    updatePrompt,
    rollbackPrompt,
    addVariable,
    deleteVariable,
    isUpdating,
  } = useAIPrompts();

  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [editedPersonality, setEditedPersonality] = useState('');
  const [changelog, setChangelog] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showAddVariable, setShowAddVariable] = useState(false);
  const [newVariable, setNewVariable] = useState({ name: '', description: '' });

  // Hooks for selected prompt details
  const { data: versions = [] } = usePromptVersions(selectedPrompt?.id || '');
  const { data: variables = [] } = usePromptVariables(selectedPrompt?.id || '');

  const handleSelectPrompt = (prompt: AIPrompt) => {
    setSelectedPrompt(prompt);
    setEditedTemplate(prompt.prompt_template);
    setEditedPersonality(prompt.personality_context || '');
    setChangelog('');
  };

  const handleSave = async () => {
    if (!selectedPrompt || !changelog.trim()) return;

    await updatePrompt({
      promptId: selectedPrompt.id,
      template: editedTemplate,
      personality: editedPersonality || null,
      changelog,
    });

    setChangelog('');
  };

  const handleRollback = async (version: AIPromptVersion) => {
    if (!selectedPrompt) return;

    await rollbackPrompt({
      promptId: selectedPrompt.id,
      versionId: version.id,
    });

    // Refresh the edited content
    setEditedTemplate(version.prompt_template);
    setEditedPersonality(version.personality_context || '');
    setShowHistory(false);
  };

  const handleAddVariable = async () => {
    if (!selectedPrompt || !newVariable.name.trim()) return;

    await addVariable({
      promptId: selectedPrompt.id,
      variableName: newVariable.name.trim(),
      description: newVariable.description.trim() || undefined,
    });

    setNewVariable({ name: '', description: '' });
    setShowAddVariable(false);
  };

  const insertVariable = (varName: string) => {
    const insertion = `{{${varName}}}`;
    setEditedTemplate((prev) => prev + insertion);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse text-muted-foreground">Loading prompts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>AI Prompt Manager</CardTitle>
          </div>
          <CardDescription>
            Manage AI prompts with version control and template variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prompt List */}
            <div className="space-y-2">
              <Label>Select Prompt</Label>
              <ScrollArea className="h-[400px] border rounded-lg p-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    className={cn(
                      'w-full text-left p-3 rounded-lg mb-2 transition-colors',
                      'hover:bg-muted',
                      selectedPrompt?.id === prompt.id && 'bg-primary/10 border border-primary'
                    )}
                    onClick={() => handleSelectPrompt(prompt)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{prompt.prompt_name}</span>
                      <Badge variant="outline" className="text-xs">
                        v{prompt.version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {prompt.prompt_key}
                    </p>
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 space-y-4">
              {selectedPrompt ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedPrompt.prompt_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Version {selectedPrompt.version} • Updated{' '}
                        {format(new Date(selectedPrompt.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(true)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        History
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="template">
                    <TabsList>
                      <TabsTrigger value="template" className="gap-2">
                        <Code className="h-4 w-4" />
                        Template
                      </TabsTrigger>
                      <TabsTrigger value="personality" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Personality
                      </TabsTrigger>
                      <TabsTrigger value="variables" className="gap-2">
                        <Variable className="h-4 w-4" />
                        Variables
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="template" className="space-y-4">
                      <Textarea
                        value={editedTemplate}
                        onChange={(e) => setEditedTemplate(e.target.value)}
                        className="min-h-[250px] font-mono text-sm"
                        placeholder="Enter prompt template..."
                      />
                      
                      {/* Quick variable insert */}
                      {variables.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">Insert:</span>
                          {variables.map((v) => (
                            <Button
                              key={v.id}
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => insertVariable(v.variable_name)}
                            >
                              {`{{${v.variable_name}}}`}
                            </Button>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="personality" className="space-y-4">
                      <Textarea
                        value={editedPersonality}
                        onChange={(e) => setEditedPersonality(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                        placeholder="Enter Buggs personality context..."
                      />
                      <p className="text-xs text-muted-foreground">
                        This context shapes how Buggs communicates. Keep it warm, encouraging, and non-judgmental.
                      </p>
                    </TabsContent>

                    <TabsContent value="variables" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Template Variables</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddVariable(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Variable
                        </Button>
                      </div>

                      {variables.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Variable</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {variables.map((v) => (
                              <TableRow key={v.id}>
                                <TableCell className="font-mono text-sm">
                                  {`{{${v.variable_name}}}`}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {v.description || '—'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deleteVariable(v.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No variables defined. Add variables to make prompts dynamic.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Save section */}
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <Label>Changelog (required)</Label>
                      <Input
                        value={changelog}
                        onChange={(e) => setChangelog(e.target.value)}
                        placeholder="Describe what changed..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSelectPrompt(selectedPrompt)}
                        disabled={isUpdating}
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={
                          isUpdating ||
                          !changelog.trim() ||
                          (editedTemplate === selectedPrompt.prompt_template &&
                            editedPersonality === (selectedPrompt.personality_context || ''))
                        }
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Version {selectedPrompt.version + 1}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Select a prompt to edit
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {versions.length > 0 ? (
              <div className="space-y-3">
                {versions.map((v) => (
                  <Collapsible key={v.id}>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{v.version}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(v.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {v.changelog && (
                          <p className="text-sm mt-1">{v.changelog}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(v)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap">
                          {v.prompt_template}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No version history yet
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Variable Dialog */}
      <Dialog open={showAddVariable} onOpenChange={setShowAddVariable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Template Variable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Variable Name</Label>
              <Input
                value={newVariable.name}
                onChange={(e) =>
                  setNewVariable((prev) => ({
                    ...prev,
                    name: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
                  }))
                }
                placeholder="e.g., user_preferences"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be used as {`{{${newVariable.name || 'variable_name'}}}`}
              </p>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={newVariable.description}
                onChange={(e) =>
                  setNewVariable((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="What data this variable contains"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVariable(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVariable} disabled={!newVariable.name.trim()}>
              Add Variable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
