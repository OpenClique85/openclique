import { Download, Share, Plus, CheckCircle2, Smartphone, Zap, Bell, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { PUBLISHED_URL } from '@/lib/config';

const INSTALL_URL = `${PUBLISHED_URL}/install`;

const benefits = [
  { icon: Zap, title: 'Instant Access', description: 'Launch from your home screen' },
  { icon: Bell, title: 'Stay Updated', description: 'Get notified about your squads' },
  { icon: Wifi, title: 'Works Offline', description: 'Browse quests even without internet' },
];

function BenefitsList({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {benefits.map((benefit) => (
        <div key={benefit.title} className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-primary/10 rounded-lg flex items-center justify-center`}>
            <benefit.icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
          </div>
          <div>
            <h3 className={`font-medium text-foreground ${compact ? 'text-sm' : ''}`}>{benefit.title}</h3>
            <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>{benefit.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlreadyInstalledView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground text-center mb-2">
        Already Installed!
      </h1>
      <p className="text-muted-foreground text-center mb-8">
        OpenClique is installed on your device.
      </p>
      <Button onClick={onGoHome} variant="outline">
        Go to Home
      </Button>
    </div>
  );
}

function DesktopView({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Install OpenClique
            </h1>
            <p className="text-muted-foreground">
              Scan with your phone's camera to install
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl shadow-lg inline-block mb-4">
            <QRCodeSVG
              value={INSTALL_URL}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
          
          <p className="text-sm text-muted-foreground mb-10">
            openclique.lovable.app
          </p>

          {/* Benefits */}
          <div className="bg-card border border-border rounded-xl p-6 text-left">
            <BenefitsList compact />
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="py-6 text-center">
        <Button variant="ghost" onClick={onGoBack}>
          ← Back to app
        </Button>
      </div>
    </div>
  );
}

function IOSInstructions() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-lg">📱</span> Install on iPhone/iPad
      </h2>
      <ol className="space-y-4">
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            1
          </span>
          <div>
            <p className="text-foreground font-medium flex items-center gap-2">
              Tap the Share button
              <Share className="h-4 w-4 text-muted-foreground" />
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Find it at the bottom of Safari
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            2
          </span>
          <div>
            <p className="text-foreground font-medium flex items-center gap-2">
              Tap "Add to Home Screen"
              <Plus className="h-4 w-4 text-muted-foreground" />
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Scroll down in the share menu to find it
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            3
          </span>
          <div>
            <p className="text-foreground font-medium">Tap "Add"</p>
            <p className="text-sm text-muted-foreground mt-1">
              Confirm and OpenClique will appear on your home screen
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}

function AndroidInstructions({ isInstallable, onInstall }: { isInstallable: boolean; onInstall: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-lg">📱</span> Install on Android
      </h2>
      {isInstallable ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Click the button below to install OpenClique on your device.
          </p>
          <Button onClick={onInstall} className="w-full" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Install OpenClique
          </Button>
        </div>
      ) : (
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </span>
            <div>
              <p className="text-foreground font-medium">
                Tap the menu (⋮)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Find it in the top-right of Chrome
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </span>
            <div>
              <p className="text-foreground font-medium">
                Tap "Install app" or "Add to Home screen"
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              3
            </span>
            <div>
              <p className="text-foreground font-medium">
                Confirm the installation
              </p>
            </div>
          </li>
        </ol>
      )}
    </div>
  );
}

function MobileView({ isIOS, isInstallable, onInstall, onGoBack }: { 
  isIOS: boolean; 
  isInstallable: boolean; 
  onInstall: () => void;
  onGoBack: () => void;
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-6 pt-10 pb-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Install OpenClique
          </h1>
          <p className="text-muted-foreground text-sm">
            Add to your home screen for the best experience
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-6 py-6 space-y-6">
        {/* Benefits */}
        <div className="bg-card border border-border rounded-xl p-5">
          <BenefitsList compact />
        </div>

        {/* Platform-specific instructions */}
        {isIOS ? (
          <IOSInstructions />
        ) : (
          <AndroidInstructions isInstallable={isInstallable} onInstall={onInstall} />
        )}
      </div>

      {/* Back button - with safe area padding */}
      <div className="py-6 pb-safe text-center">
        <Button variant="ghost" onClick={onGoBack}>
          ← Back to app
        </Button>
      </div>
    </div>
  );
}

export default function Install() {
  const { isIOS, isInstalled, isStandalone, promptInstall, isInstallable } = usePWAInstall();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleGoBack = () => navigate(-1);
  const handleGoHome = () => navigate('/');

  const handleInstall = async () => {
    if (!isIOS && isInstallable) {
      await promptInstall();
    }
  };

  // Already installed state
  if (isInstalled || isStandalone) {
    return <AlreadyInstalledView onGoHome={handleGoHome} />;
  }

  // Desktop: show QR code
  if (!isMobile) {
    return <DesktopView onGoBack={handleGoBack} />;
  }

  // Mobile: show platform-specific instructions
  return (
    <MobileView 
      isIOS={isIOS} 
      isInstallable={isInstallable} 
      onInstall={handleInstall}
      onGoBack={handleGoBack}
    />
  );
}
