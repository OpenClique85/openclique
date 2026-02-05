import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';

export function InstallPrompt() {
  const { canShowPrompt, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const navigate = useNavigate();

  if (!canShowPrompt) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      navigate('/install');
    } else {
      await promptInstall();
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-xl p-4 shadow-xl">
        <button
          onClick={dismissPrompt}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Install OpenClique
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for the best experience
            </p>
            
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="mt-3 w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isIOS ? 'See How' : 'Install App'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
