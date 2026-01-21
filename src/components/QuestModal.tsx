import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Quest } from '@/constants/quests';
import { QUEST_STATUS_CONFIG } from '@/constants/quests/types';
import QuestProgressionSection from './progression/QuestProgressionSection';
import { FORM_URLS } from '@/constants/content';

interface QuestModalProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColorStyles: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  yellow: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  red: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  gray: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
  muted: 'bg-muted text-muted-foreground border-border',
};

const ctaColorStyles: Record<string, string> = {
  green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  yellow: 'bg-amber-500 hover:bg-amber-600 text-white',
  red: 'bg-red-400 text-white cursor-not-allowed opacity-60',
  gray: 'bg-gray-400 text-white cursor-not-allowed opacity-60',
  muted: 'bg-primary hover:bg-primary/90 text-primary-foreground',
};

const QuestModal = ({ quest, open, onOpenChange }: QuestModalProps) => {
  if (!quest) return null;

  const statusConfig = QUEST_STATUS_CONFIG[quest.status];
  const statusLabel = quest.statusLabel || statusConfig.label;
  const statusStyles = statusColorStyles[statusConfig.color];
  const ctaStyles = ctaColorStyles[statusConfig.color];

  const handleCTAClick = () => {
    if (!statusConfig.ctaDisabled) {
      window.open(FORM_URLS.pilot, '_blank');
    }
  };

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
                {statusLabel}
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

              {/* CTA Section */}
              <div className="pt-4 border-t border-border">
                <Button
                  size="lg"
                  className={`w-full ${ctaStyles}`}
                  onClick={handleCTAClick}
                  disabled={statusConfig.ctaDisabled}
                >
                  {statusConfig.ctaText}
                </Button>
                {quest.status === 'open' || quest.status === 'limited' ? (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {quest.status === 'limited' ? 'Only a few spots remaining!' : 'Spots available for the Austin pilot'}
                  </p>
                ) : quest.status === 'coming-soon' ? (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Sign up to be notified when this quest opens
                  </p>
                ) : null}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
  );
};

export default QuestModal;
