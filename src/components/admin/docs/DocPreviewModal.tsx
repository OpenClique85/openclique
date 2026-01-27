/**
 * =============================================================================
 * DOC PREVIEW MODAL - Full-screen document preview with Markdown + Mermaid
 * =============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Copy, Printer, X, FileText, GitBranch } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// Initialize mermaid with strict security (no JS execution in diagrams)
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'strict', // Sandboxed - prevents XSS via diagram definitions
  fontFamily: 'inherit',
});

export interface PreviewDocument {
  id: string;
  title: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  content_markdown?: string | null;
  mermaid_diagram?: string | null;
  version?: number;
  updated_at?: string;
}

interface DocPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: PreviewDocument[];
  initialDocId?: string;
  title?: string;
}

export function DocPreviewModal({
  open,
  onOpenChange,
  documents,
  initialDocId,
  title = 'Document Preview',
}: DocPreviewModalProps) {
  const [activeDocId, setActiveDocId] = useState<string>(initialDocId || documents[0]?.id || '');
  const mermaidRef = useRef<HTMLDivElement>(null);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  // Render mermaid diagrams
  useEffect(() => {
    if (activeDoc?.mermaid_diagram && mermaidRef.current && open) {
      const renderMermaid = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(
            `mermaid-${activeDoc.id.replace(/-/g, '')}`,
            activeDoc.mermaid_diagram!
          );
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<pre class="text-destructive text-sm">Diagram render error. Check syntax.</pre>`;
          }
        }
      };
      renderMermaid();
    }
  }, [activeDoc, open]);

  // Reset active doc when modal opens
  useEffect(() => {
    if (open && initialDocId) {
      setActiveDocId(initialDocId);
    } else if (open && documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [open, initialDocId, documents]);

  const handleCopy = async () => {
    if (!activeDoc) return;
    
    const content = [
      `# ${activeDoc.title}`,
      activeDoc.description ? `\n${activeDoc.description}\n` : '',
      activeDoc.content_markdown || '',
      activeDoc.mermaid_diagram ? `\n\`\`\`mermaid\n${activeDoc.mermaid_diagram}\n\`\`\`` : '',
    ].join('\n');

    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-display">{title}</DialogTitle>
              <Badge variant="secondary" className="text-xs">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content area with tabs */}
        <div className="flex-1 flex min-h-0">
          {/* Document list sidebar (if multiple docs) */}
          {documents.length > 1 && (
            <div className="w-64 border-r bg-muted/30 flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-1">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeDocId === doc.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs opacity-70 truncate">
                        {doc.category}
                        {doc.subcategory && ` / ${doc.subcategory}`}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeDoc && (
              <>
                {/* Document header */}
                <div className="px-6 py-4 border-b bg-muted/20 flex-shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{activeDoc.title}</h2>
                      {activeDoc.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeDoc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline">{activeDoc.category}</Badge>
                      {activeDoc.subcategory && (
                        <Badge variant="secondary">{activeDoc.subcategory}</Badge>
                      )}
                      {activeDoc.version && (
                        <Badge variant="secondary" className="text-xs">
                          v{activeDoc.version}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content tabs */}
                <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
                  <TabsList className="mx-6 mt-4 w-fit">
                    <TabsTrigger value="content" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Content
                    </TabsTrigger>
                    {activeDoc.mermaid_diagram && (
                      <TabsTrigger value="diagram" className="gap-2">
                        <GitBranch className="h-4 w-4" />
                        Diagram
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="content" className="flex-1 m-0 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="px-6 py-4 prose prose-sm dark:prose-invert max-w-none">
                        {activeDoc.content_markdown ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeDoc.content_markdown}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-muted-foreground italic">
                            No content available.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {activeDoc.mermaid_diagram && (
                    <TabsContent value="diagram" className="flex-1 m-0 min-h-0">
                      <ScrollArea className="h-full">
                        <div className="p-6">
                          <div
                            ref={mermaidRef}
                            className="flex justify-center items-center min-h-[400px] bg-muted/30 rounded-lg p-4"
                          />
                          <details className="mt-4">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                              View diagram source
                            </summary>
                            <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                              {activeDoc.mermaid_diagram}
                            </pre>
                          </details>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}
                </Tabs>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Single document preview - convenience wrapper
 */
interface SingleDocPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PreviewDocument | null;
}

export function SingleDocPreview({ open, onOpenChange, document }: SingleDocPreviewProps) {
  if (!document) return null;

  return (
    <DocPreviewModal
      open={open}
      onOpenChange={onOpenChange}
      documents={[document]}
      title={document.title}
    />
  );
}
