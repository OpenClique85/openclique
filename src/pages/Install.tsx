import { Download, Share, Plus, CheckCircle2, Smartphone, Zap, Bell, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const { isIOS, isInstalled, isStandalone, promptInstall, isInstallable } = usePWAInstall();
  const navigate = useNavigate();

  if (isInstalled || isStandalone) {
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
        <Button onClick={() => navigate('/')} variant="outline">
          Go to Home
        </Button>
      </div>
    );
  }

  const handleInstall = async () => {
    if (!isIOS && isInstallable) {
      await promptInstall();
    }
  };

  const benefits = [
    { icon: Zap, title: 'Instant Access', description: 'Launch from your home screen' },
    { icon: Bell, title: 'Stay Updated', description: 'Get notified about your squads' },
    { icon: Wifi, title: 'Works Offline', description: 'Browse quests even without internet' },
  ];

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-6 pt-12 pb-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Install OpenClique
          </h1>
          <p className="text-muted-foreground">
            Add OpenClique to your home screen for the best experience
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        {/* Benefits */}
        <div className="space-y-4 mb-10">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Install Instructions */}
        <div className="bg-card border border-border rounded-xl p-6">
          {isIOS ? (
            <>
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
            </>
          ) : (
            <>
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">📱</span> Install on Android
              </h2>
              {isInstallable ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Click the button below to install OpenClique on your device.
                  </p>
                  <Button onClick={handleInstall} className="w-full" size="lg">
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
            </>
          )}
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back to app
          </Button>
        </div>
      </div>
    </div>
  );
}
