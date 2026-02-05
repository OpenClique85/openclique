/**
 * =============================================================================
 * Terms Consent Step - Enhanced Scrollable Agreement
 * =============================================================================
 * 
 * Requires users to scroll 100% through terms before enabling agreement.
 * Tracks explicit consent for: Terms, Privacy, Community Guidelines, Safety.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FileText, Shield, Users, AlertTriangle, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { BRAND } from '@/constants/content';
import { cn } from '@/lib/utils';

interface TermsConsentStepProps {
  onAccept: () => void;
  isSubmitting?: boolean;
}

const SECTIONS = [
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms of Service',
    summary: [
      'You are responsible for your own safety at quests',
      'We do not conduct background checks on users',
      'Meet in public places and trust your instincts',
      'The service is provided "as is" during pilot',
      'Disputes resolved through binding arbitration in Texas',
    ],
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy Policy',
    summary: [
      'We only collect data needed to run the service',
      'Your location is used for check-in only, never shared',
      'You can view, download, and delete your data anytime',
      'We never sell your information to third parties',
      'Email communications are optional and can be disabled',
    ],
  },
  {
    id: 'community',
    icon: Users,
    title: 'Community Guidelines',
    summary: [
      'Treat every participant with respect and kindness',
      'Be reliable: show up to quests you commit to',
      'No harassment, discrimination, or unwanted advances',
      'Use your real name and accurate information',
      'Report concerning behavior immediately',
    ],
  },
  {
    id: 'safety',
    icon: AlertTriangle,
    title: 'Safety Acknowledgment',
    summary: [
      'YOU are responsible for your own safety and well-being',
      'Always meet in public, well-lit places',
      'Tell a friend where you are going',
      'Never share sensitive personal info immediately',
      'You assume all risks associated with meeting strangers',
    ],
  },
];

export function TermsConsentStep({ onAccept, isSubmitting }: TermsConsentStepProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    
    if (!container || !content) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = content.scrollHeight - container.clientHeight;
    
    if (scrollHeight <= 0) {
      // Content fits without scrolling
      setScrollProgress(100);
      setHasScrolledToBottom(true);
      return;
    }

    const progress = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
    setScrollProgress(progress);

    // Consider "bottom" as 95%+ scrolled (small tolerance for mobile)
    if (progress >= 95) {
      setHasScrolledToBottom(true);
    }
  }, []);

  // Check initial state (in case content fits without scrolling)
  useEffect(() => {
    const timer = setTimeout(handleScroll, 100);
    return () => clearTimeout(timer);
  }, [handleScroll]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const canAgree = hasScrolledToBottom;
  const canSubmit = canAgree && termsAccepted;

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Before You Begin</CardTitle>
          <CardDescription className="text-base">
            Please read and agree to our terms to use {BRAND.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Scroll to read all sections</span>
              <span className={cn(
                'transition-colors',
                hasScrolledToBottom ? 'text-primary font-medium' : ''
              )}>
                {hasScrolledToBottom ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </span>
                ) : (
                  `${scrollProgress}%`
                )}
              </span>
            </div>
            <Progress 
              value={scrollProgress} 
              className={cn(
                'h-2 transition-colors',
                hasScrolledToBottom ? '[&>div]:bg-primary' : ''
              )} 
            />
          </div>

          {/* Scrollable terms content */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-[340px] overflow-y-auto border rounded-lg bg-muted/30"
          >
            <div ref={contentRef} className="p-4 space-y-6">
              {SECTIONS.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={section.id} className="space-y-3">
                    {index > 0 && <div className="border-t pt-4" />}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{section.title}</h3>
                    </div>
                    <ul className="space-y-2 pl-11">
                      {section.summary.map((point, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Final acknowledgment section */}
              <div className="border-t pt-4 mt-6">
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    <strong>Important:</strong> By using {BRAND.name}, you acknowledge that 
                    you understand and accept all risks associated with meeting strangers 
                    in person. You are solely responsible for your own safety.
                  </p>
                </div>
              </div>

              {/* Links to full documents */}
              <div className="text-center text-xs text-muted-foreground space-y-1 pb-2">
                <p>
                  Read the full{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Scroll helper button */}
          {!hasScrolledToBottom && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={scrollToBottom}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4 mr-1 animate-bounce" />
              Scroll to continue
            </Button>
          )}

          {/* Agreement checkbox */}
          <div className={cn(
            'flex items-start space-x-3 p-3 border rounded-lg transition-colors',
            canAgree ? 'bg-background border-primary/30' : 'bg-muted/50 opacity-60'
          )}>
            <Checkbox
              id="terms-agree"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              disabled={!canAgree}
            />
            <Label 
              htmlFor="terms-agree" 
              className={cn(
                'text-sm cursor-pointer leading-relaxed',
                !canAgree && 'cursor-not-allowed'
              )}
            >
              I confirm I'm 18 years or older and agree to the{' '}
              <span className="text-primary">Terms of Service</span>,{' '}
              <span className="text-primary">Privacy Policy</span>,{' '}
              <span className="text-primary">Community Guidelines</span>, and{' '}
              <span className="text-primary">Safety Acknowledgment</span>.
            </Label>
          </div>

          {/* Submit button */}
          <Button 
            className="w-full" 
            onClick={onAccept}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : !hasScrolledToBottom ? (
              'Please read all sections first'
            ) : !termsAccepted ? (
              'Check the box to agree'
            ) : (
              'I Agree & Continue'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
