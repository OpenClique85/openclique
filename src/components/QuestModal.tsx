import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Quest } from '@/constants/quests';
import QuestProgressionSection from './progression/QuestProgressionSection';

interface QuestModalProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuestModal = ({ quest, open, onOpenChange }: QuestModalProps) => {
  if (!quest) return null;

  const statusStyles = quest.status === 'pilot'
    ? 'bg-sunset/10 text-sunset border-sunset/20'
    : 'bg-muted text-muted-foreground border-border';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <span className="text-5xl" role="img" aria-hidden="true">
              {quest.icon}
            </span>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-2xl font-bold text-foreground mb-2">
                {quest.title}
              </DialogTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles}`}>
                {quest.statusLabel}
              </span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6 space-y-6">
            {quest.sections.map((section, index) => (
              <section key={index} className="space-y-2">
                <h4 className="font-display font-semibold text-foreground">
                  {section.title}
                </h4>
                
                {section.type === 'timeline' && Array.isArray(section.content) && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                    {section.content.map((item, i) => (
                      <p key={i} className="text-muted-foreground text-sm">
                        {item}
                      </p>
                    ))}
                  </div>
                )}

                {section.type === 'list' && Array.isArray(section.content) && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    {section.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.type === 'text' && typeof section.content === 'string' && (
                  <p className="text-muted-foreground text-sm">
                    {section.content}
                  </p>
                )}

                {!section.type && typeof section.content === 'string' && (
                  <p className="text-muted-foreground text-sm">
                    {section.content}
                  </p>
                )}
              </section>
              ))}

              {/* Progression Section */}
              <QuestProgressionSection treeId={quest.progressionTree} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
  );
};

export default QuestModal;
