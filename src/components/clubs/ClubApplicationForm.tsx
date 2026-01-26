/**
 * ClubApplicationForm - Form for creating a new club application
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Lock, Globe, FileText } from 'lucide-react';

const CLUB_CATEGORIES = [
  'Academic',
  'Professional',
  'Social',
  'Athletic',
  'Cultural',
  'Arts & Media',
  'Community Service',
  'Technology',
  'Other',
];

interface ClubApplicationFormProps {
  parentOrgId: string;
  parentOrgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClubApplicationForm({
  parentOrgId,
  parentOrgName,
  open,
  onOpenChange,
}: ClubApplicationFormProps) {
  const navigate = useNavigate();
  const { submitApplication } = useOrganizations();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    visibility: 'public' as 'public' | 'private' | 'invite_only',
    intended_audience: '',
    requested_admins: '',
    agreed_to_terms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreed_to_terms) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitApplication.mutateAsync({
        parent_org_id: parentOrgId,
        name: formData.name,
        type: 'club',
        description: formData.description,
        category: formData.category,
        visibility: formData.visibility,
        intended_audience: formData.intended_audience,
        requested_admins: formData.requested_admins
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        agreed_to_terms: formData.agreed_to_terms,
      });

      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        visibility: 'public',
        intended_audience: '',
        requested_admins: '',
        agreed_to_terms: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create a Club
            </DialogTitle>
            <DialogDescription>
              Submit an application to create a new club within{' '}
              <strong>{parentOrgName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Club Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Club Name *</Label>
              <Input
                id="name"
                placeholder="e.g., MBA Class of 2026"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="What is your club about?"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CLUB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can join' },
                  { value: 'private', label: 'Private', icon: Lock, desc: 'Request to join' },
                  { value: 'invite_only', label: 'Invite Only', icon: Lock, desc: 'Invite code required' },
                ].map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-colors ${
                      formData.visibility === option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/30'
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        visibility: option.value as typeof formData.visibility,
                      }))
                    }
                  >
                    <CardContent className="p-3 text-center">
                      <option.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Intended Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience">Intended Audience</Label>
              <Textarea
                id="audience"
                placeholder="Who is this club for? (e.g., First-year MBA students interested in tech)"
                value={formData.intended_audience}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, intended_audience: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Requested Admins */}
            <div className="space-y-2">
              <Label htmlFor="admins">
                Additional Social Chairs{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="admins"
                placeholder="Email addresses, comma-separated"
                value={formData.requested_admins}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requested_admins: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                These people will be invited as club admins (Social Chairs) once approved
              </p>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="terms"
                checked={formData.agreed_to_terms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, agreed_to_terms: checked === true }))
                }
              />
              <div className="text-sm">
                <Label htmlFor="terms" className="cursor-pointer">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => setShowTerms(true)}
                  >
                    Club Guidelines & Terms
                  </button>
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.agreed_to_terms || !formData.name || !formData.description || !formData.category}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Terms Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Club Guidelines & Terms
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4>Club Leader Responsibilities</h4>
            <ul>
              <li>Maintain active club engagement with regular events</li>
              <li>Respond to member questions and requests promptly</li>
              <li>Follow OpenClique community guidelines</li>
              <li>Report any safety concerns to the platform team</li>
            </ul>

            <h4>Content Guidelines</h4>
            <ul>
              <li>No spam, harassment, or discriminatory content</li>
              <li>Events must be legal and safe for all participants</li>
              <li>Respect member privacy and consent</li>
            </ul>

            <h4>Moderation</h4>
            <ul>
              <li>Clubs may be suspended for repeated guideline violations</li>
              <li>OpenClique reserves the right to remove harmful content</li>
              <li>Appeals can be submitted through the support system</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTerms(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
