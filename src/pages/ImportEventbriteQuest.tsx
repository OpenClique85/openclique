/**
 * ImportEventbriteQuest - Quick Quest creation from Eventbrite data
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CreatorPortalNav } from '@/components/creators/CreatorPortalNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { QuickQuestFromEventbrite } from '@/components/eventbrite/QuickQuestFromEventbrite';

export default function ImportEventbriteQuest() {
  const location = useLocation();
  const navigate = useNavigate();
  const eventData = location.state?.eventData;

  // Redirect if no event data
  if (!eventData) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <CreatorPortalNav />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">No Event Data</h1>
          <p className="text-muted-foreground mb-6">
            Please import an event from Eventbrite first.
          </p>
          <Button onClick={() => navigate('/creator/quests')}>
            Back to My Quests
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <CreatorPortalNav />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Create Quest from Eventbrite
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and customize your quest details
            </p>
          </div>
        </div>

        <QuickQuestFromEventbrite
          eventData={eventData}
          onCancel={() => navigate('/creator/quests')}
          onEditFull={() => {
            // Navigate to full quest builder with pre-filled data
            navigate('/creator/quests/new', { state: { eventbriteData: eventData } });
          }}
        />
      </main>
      
      <Footer />
    </div>
  );
}
