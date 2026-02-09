import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import buggsHopping from '@/assets/buggs-hopping.png';

export function TutorialCompleteStep() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 text-center relative overflow-hidden">
      {/* CSS Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 space-y-6">
        <img
          src={buggsHopping}
          alt="BUGGS celebrating"
          className="w-24 h-24 mx-auto object-contain"
        />

        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            You're Ready! 🎉
          </h2>
          <p className="text-muted-foreground mt-2">
            You've mastered the basics. Time to find your first real quest.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-6 py-3 font-semibold">
          <Sparkles className="h-5 w-5" />
          +50 XP Earned!
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button size="lg" onClick={() => navigate('/quests')}>
            Browse Quests
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/profile')}>
            Set Up Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
