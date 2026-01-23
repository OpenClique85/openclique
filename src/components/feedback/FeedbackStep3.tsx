import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PRICING_MODELS = [
  { value: 'per_quest', label: 'Pay per quest' },
  { value: 'subscription', label: 'Monthly subscription' },
  { value: 'freemium', label: 'Free quests, paid premium features' },
  { value: 'sponsor_supported', label: 'Mostly sponsor-supported' },
];

const PRICE_OPTIONS = ['$0', '$5', '$8', '$12', '$20+'];

const VALUE_DRIVERS = [
  { value: 'squad_continuity', label: 'Squad continuity' },
  { value: 'better_matching', label: 'Better matching' },
  { value: 'exclusive_quests', label: 'Exclusive quests' },
  { value: 'rewards_discounts', label: 'Rewards/discounts' },
  { value: 'less_awkward', label: 'Less awkward first meetups' },
  { value: 'bring_friend', label: 'Ability to bring a friend' },
];

interface FeedbackStep3Props {
  onSubmit: (data: {
    pricingModelPreference: string;
    tooCheapPrice: string;
    fairPrice: string;
    expensivePrice: string;
    tooExpensivePrice: string;
    valueDrivers: string[];
  }) => void;
  onSkip: () => void;
  isSubmitting: boolean;
  xpReward: number;
}

export function FeedbackStep3({ onSubmit, onSkip, isSubmitting, xpReward }: FeedbackStep3Props) {
  const [pricingModel, setPricingModel] = useState('');
  const [tooCheap, setTooCheap] = useState('');
  const [fair, setFair] = useState('');
  const [expensive, setExpensive] = useState('');
  const [tooExpensive, setTooExpensive] = useState('');
  const [valueDrivers, setValueDrivers] = useState<string[]>([]);

  const toggleValueDriver = (value: string) => {
    if (valueDrivers.includes(value)) {
      setValueDrivers(valueDrivers.filter(v => v !== value));
    } else {
      setValueDrivers([...valueDrivers, value]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      pricingModelPreference: pricingModel,
      tooCheapPrice: tooCheap,
      fairPrice: fair,
      expensivePrice: expensive,
      tooExpensivePrice: tooExpensive,
      valueDrivers,
    });
  };

  return (
    <div className="space-y-8">
      {/* Optional banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-primary font-medium">
          Optional — helps us design pricing fairly (+{xpReward} XP)
        </p>
      </div>

      {/* Preface */}
      <p className="text-sm text-muted-foreground italic text-center">
        If OpenClique made showing up easier, more comfortable, or more fun…
      </p>

      {/* Pricing model preference */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Which pricing model feels most fair?
        </label>
        <div className="space-y-2">
          {PRICING_MODELS.map((model) => (
            <button
              key={model.value}
              type="button"
              onClick={() => setPricingModel(model.value)}
              className={cn(
                "w-full px-4 py-3 rounded-lg text-left text-sm transition-all border",
                pricingModel === model.value
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              )}
            >
              {model.label}
            </button>
          ))}
        </div>
      </div>

      {/* Van Westendorp questions */}
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">
            For a monthly OpenClique membership with:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Better matching</li>
            <li>• Squad continuity</li>
            <li>• Early access</li>
            <li>• Exclusive rewards</li>
          </ul>
        </div>

        {/* Too cheap */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            At what price would it seem too cheap to trust?
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRICE_OPTIONS.map((price) => (
              <button
                key={`cheap-${price}`}
                type="button"
                onClick={() => setTooCheap(price)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border min-w-[60px]",
                  tooCheap === price
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        {/* Fair price */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            At what price would it feel like a fair deal?
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRICE_OPTIONS.map((price) => (
              <button
                key={`fair-${price}`}
                type="button"
                onClick={() => setFair(price)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border min-w-[60px]",
                  fair === price
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        {/* Getting expensive */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            At what price would it start feeling expensive?
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRICE_OPTIONS.map((price) => (
              <button
                key={`expensive-${price}`}
                type="button"
                onClick={() => setExpensive(price)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border min-w-[60px]",
                  expensive === price
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        {/* Too expensive */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            At what price would it be too expensive to consider?
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRICE_OPTIONS.map((price) => (
              <button
                key={`tooexp-${price}`}
                type="button"
                onClick={() => setTooExpensive(price)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border min-w-[60px]",
                  tooExpensive === price
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {price}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Value drivers */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          I'd be more likely to pay for: <span className="text-muted-foreground">(select all that apply)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {VALUE_DRIVERS.map((driver) => (
            <button
              key={driver.value}
              type="button"
              onClick={() => toggleValueDriver(driver.value)}
              className={cn(
                "px-3 py-2 rounded-full text-sm transition-all border",
                valueDrivers.includes(driver.value)
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {driver.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1"
          size="lg"
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? 'Saving...' : `Continue (+${xpReward} XP)`}
        </Button>
      </div>
    </div>
  );
}
