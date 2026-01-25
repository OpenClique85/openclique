/**
 * =============================================================================
 * MY QUESTS PAGE - Redirects to unified Profile page
 * =============================================================================
 * 
 * This page now redirects to /profile?tab=quests for backward compatibility.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function MyQuests() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified profile with quests tab
    navigate('/profile?tab=quests', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
