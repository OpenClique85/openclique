/**
 * =============================================================================
 * FLOATING HELP BUTTON - Always-visible help trigger at bottom right
 * =============================================================================
 * 
 * A floating action button that allows users to report bugs or issues
 * from anywhere in the app. Respects mobile action bar spacing.
 */

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { SupportTicketModal } from './SupportTicketModal';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function FloatingHelpButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Extract context from URL if on quest or clique pages
  const getContext = () => {
    const path = location.pathname;
    const questMatch = path.match(/\/quests?\/([a-zA-Z0-9-]+)/);
    const cliqueMatch = path.match(/\/cliques?\/([a-zA-Z0-9-]+)/);
    
    return {
      questId: questMatch?.[1] || null,
      cliqueId: cliqueMatch?.[1] || null,
    };
  };

  const context = getContext();

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={cn(
          // Position - bottom right with safe area for mobile nav
          'fixed z-40',
          'right-4 md:right-6',
          // Account for mobile action bar (h-16 + safe area)
          user ? 'bottom-20 md:bottom-6' : 'bottom-6',
          // Styling
          'h-12 w-12 rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
        aria-label="Get Help"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
      
      <SupportTicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contextQuestId={context.questId}
        contextSquadId={context.cliqueId}
      />
    </>
  );
}
