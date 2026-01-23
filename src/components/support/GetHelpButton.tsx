/**
 * =============================================================================
 * GET HELP BUTTON - Floating/inline trigger for support ticket modal
 * =============================================================================
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { SupportTicketModal } from './SupportTicketModal';
import { cn } from '@/lib/utils';

interface GetHelpButtonProps {
  variant?: 'floating' | 'inline' | 'link';
  contextQuestId?: string | null;
  contextQuestTitle?: string | null;
  contextSquadId?: string | null;
  contextSquadName?: string | null;
  className?: string;
}

export function GetHelpButton({
  variant = 'inline',
  contextQuestId,
  contextQuestTitle,
  contextSquadId,
  contextSquadName,
  className,
}: GetHelpButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'h-12 w-12 rounded-full',
            'bg-primary text-primary-foreground shadow-lg',
            'flex items-center justify-center',
            'hover:scale-105 transition-transform',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            className
          )}
          aria-label="Get Help"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
        <SupportTicketModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          contextQuestId={contextQuestId}
          contextQuestTitle={contextQuestTitle}
          contextSquadId={contextSquadId}
          contextSquadName={contextSquadName}
        />
      </>
    );
  }

  if (variant === 'link') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={cn(
            'text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5',
            className
          )}
        >
          <HelpCircle className="h-4 w-4" />
          Get Help
        </button>
        <SupportTicketModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          contextQuestId={contextQuestId}
          contextQuestTitle={contextQuestTitle}
          contextSquadId={contextSquadId}
          contextSquadName={contextSquadName}
        />
      </>
    );
  }

  // Default: inline button
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className={cn('gap-2', className)}
      >
        <HelpCircle className="h-4 w-4" />
        Get Help
      </Button>
      <SupportTicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contextQuestId={contextQuestId}
        contextQuestTitle={contextQuestTitle}
        contextSquadId={contextSquadId}
        contextSquadName={contextSquadName}
      />
    </>
  );
}
