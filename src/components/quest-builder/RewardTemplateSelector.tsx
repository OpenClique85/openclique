/**
 * Reward Template Selector
 * 
 * Provides templated reward options that creators can customize.
 * Supports: XP, Discount Code, Gift Card, Merch, Custom
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Gift, Zap, Tag, CreditCard, Package, Plus, X, Check } from 'lucide-react';

export interface RewardItem {
  type: 'xp' | 'discount' | 'giftcard' | 'merch' | 'custom';
  label: string;
  value: string;
  instructions?: string;
}

interface RewardTemplateSelectorProps {
  currentValue: string;
  onUpdate: (value: string) => void;
}

const REWARD_TEMPLATES = [
  {
    type: 'xp' as const,
    icon: Zap,
    label: 'XP Reward',
    description: 'Award experience points toward badges',
    defaultValue: '+50 XP',
    fields: [
      { name: 'amount', label: 'XP Amount', placeholder: '50', type: 'number' },
      { name: 'badge', label: 'Toward Badge (optional)', placeholder: 'Culture Vulture' }
    ]
  },
  {
    type: 'discount' as const,
    icon: Tag,
    label: 'Discount Code',
    description: 'Provide a discount code for a partner',
    defaultValue: '20% off at Partner Store',
    fields: [
      { name: 'discount', label: 'Discount', placeholder: '20% off' },
      { name: 'partner', label: 'Partner Name', placeholder: 'Local Coffee Shop' },
      { name: 'code', label: 'Code (shared after completion)', placeholder: 'QUEST20' },
      { name: 'expiry', label: 'Valid Until (optional)', placeholder: 'Dec 31, 2026' }
    ]
  },
  {
    type: 'giftcard' as const,
    icon: CreditCard,
    label: 'Gift Card',
    description: 'Reward with a gift card',
    defaultValue: '$25 Gift Card',
    fields: [
      { name: 'amount', label: 'Amount', placeholder: '$25' },
      { name: 'vendor', label: 'Vendor/Store', placeholder: 'Amazon, Local Restaurant' },
      { name: 'delivery', label: 'How to receive', placeholder: 'Emailed within 24 hours of completion' }
    ]
  },
  {
    type: 'merch' as const,
    icon: Package,
    label: 'Merchandise',
    description: 'Physical items or swag',
    defaultValue: 'Exclusive Quest T-Shirt',
    fields: [
      { name: 'item', label: 'Item Description', placeholder: 'Limited Edition T-Shirt' },
      { name: 'pickup', label: 'How to receive', placeholder: 'Pick up at event, shipped within 2 weeks' },
      { name: 'sizes', label: 'Sizes Available (if applicable)', placeholder: 'S, M, L, XL' }
    ]
  },
  {
    type: 'custom' as const,
    icon: Gift,
    label: 'Custom Reward',
    description: 'Define your own reward',
    defaultValue: '',
    fields: [
      { name: 'description', label: 'Reward Description', placeholder: 'Describe the reward...', multiline: true }
    ]
  }
];

export function RewardTemplateSelector({ currentValue, onUpdate }: RewardTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof REWARD_TEMPLATES[0] | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [rewards, setRewards] = useState<RewardItem[]>([]);

  // Parse existing rewards from string (simple line-based parsing)
  const parseExistingRewards = (): string[] => {
    if (!currentValue) return [];
    return currentValue.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
  };

  const handleTemplateSelect = (template: typeof REWARD_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setFieldValues({});
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const generateRewardText = (): string => {
    if (!selectedTemplate) return '';

    switch (selectedTemplate.type) {
      case 'xp':
        const xpAmount = fieldValues.amount || '50';
        const badge = fieldValues.badge;
        return badge ? `+${xpAmount} XP toward ${badge} badge` : `+${xpAmount} XP`;
      
      case 'discount':
        const discount = fieldValues.discount || '20% off';
        const partner = fieldValues.partner || 'Partner Store';
        const code = fieldValues.code;
        const expiry = fieldValues.expiry;
        let discountText = `${discount} at ${partner}`;
        if (code) discountText += ` (Code: ${code})`;
        if (expiry) discountText += ` - Valid until ${expiry}`;
        return discountText;
      
      case 'giftcard':
        const amount = fieldValues.amount || '$25';
        const vendor = fieldValues.vendor || 'Gift Card';
        const delivery = fieldValues.delivery;
        let cardText = `${amount} ${vendor} Gift Card`;
        if (delivery) cardText += `\n  → ${delivery}`;
        return cardText;
      
      case 'merch':
        const item = fieldValues.item || 'Exclusive Merchandise';
        const pickup = fieldValues.pickup;
        const sizes = fieldValues.sizes;
        let merchText = item;
        if (sizes) merchText += ` (${sizes})`;
        if (pickup) merchText += `\n  → ${pickup}`;
        return merchText;
      
      case 'custom':
        return fieldValues.description || '';
      
      default:
        return '';
    }
  };

  const addReward = () => {
    const rewardText = generateRewardText();
    if (!rewardText.trim()) return;

    // Append to existing value
    const newValue = currentValue 
      ? `${currentValue}\n- ${rewardText}`
      : `- ${rewardText}`;
    
    onUpdate(newValue);
    setSelectedTemplate(null);
    setFieldValues({});
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        {REWARD_TEMPLATES.map(template => {
          const Icon = template.icon;
          return (
            <Dialog key={template.type} open={isOpen && selectedTemplate?.type === template.type} onOpenChange={(open) => {
              setIsOpen(open);
              if (open) handleTemplateSelect(template);
              else setSelectedTemplate(null);
            }}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {template.label}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-creator" />
                    Add {template.label}
                  </DialogTitle>
                  <DialogDescription>{template.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {template.fields.map(field => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.multiline ? (
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Preview */}
                  {generateRewardText() && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <p className="text-sm whitespace-pre-wrap">- {generateRewardText()}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsOpen(false);
                        setSelectedTemplate(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={addReward}
                      disabled={!generateRewardText().trim()}
                      className="bg-creator hover:bg-creator/90"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Reward
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}
