/**
 * Feedback Progress Component
 * 
 * Shows step progress with animated XP counter.
 */

import { useState, useEffect } from 'react';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  totalXPEarned?: number;
  maxXP?: number;
}

const STEP_LABELS = ['Quick Pulse', 'Quest Insights', 'Pricing', 'Testimonial'];

export function FeedbackProgress({ 
  currentStep, 
  totalSteps, 
  completedSteps,
  totalXPEarned = 0,
  maxXP = 250,
}: FeedbackProgressProps) {
  const [displayedXP, setDisplayedXP] = useState(0);

  // Animate XP counter
  useEffect(() => {
    if (totalXPEarned === displayedXP) return;
    
    const duration = 500; // ms
    const startTime = Date.now();
    const startValue = displayedXP;
    const endValue = totalXPEarned;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);
      
      setDisplayedXP(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [totalXPEarned]);

  return (
    <div className="w-full space-y-3">
      {/* XP Counter */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="h-4 w-4 text-primary" />
          <span>Earn up to {maxXP} XP</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={displayedXP}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-semibold text-primary flex items-center gap-1"
          >
            <span>{displayedXP}</span>
            <span className="text-muted-foreground font-normal">XP earned</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = currentStep === stepNum;
          
          return (
            <div key={i} className="flex items-center flex-1">
              {/* Step circle */}
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                )}
                animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNum
                )}
              </motion.div>
              
              {/* Connector line */}
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-colors",
                    completedSteps.includes(stepNum) ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Step labels (mobile: only current, desktop: all) */}
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent = currentStep === stepNum;
          
          return (
            <div
              key={i}
              className={cn(
                "text-xs text-center flex-1 transition-colors",
                isCurrent
                  ? "text-primary font-medium"
                  : isCompleted
                  ? "text-foreground"
                  : "text-muted-foreground hidden sm:block"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
