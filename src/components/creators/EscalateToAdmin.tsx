import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import { SupportTicketModal } from '@/components/support/SupportTicketModal';

interface EscalateToAdminProps {
  questId: string;
  questTitle: string;
}

export function EscalateToAdmin({ questId, questTitle }: EscalateToAdminProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" />
        <span className="hidden sm:inline">Get Help</span>
      </Button>
      
      <SupportTicketModal
        open={open}
        onOpenChange={setOpen}
        contextQuestId={questId}
        contextQuestTitle={questTitle}
      />
    </>
  );
}
