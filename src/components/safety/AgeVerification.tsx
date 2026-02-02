/**
 * =============================================================================
 * Age Verification Component
 * =============================================================================
 * Collects date of birth and verifies user is 18+ before account creation.
 * Required step in the signup flow for legal compliance.
 */

import { useState } from 'react';
import { format, differenceInYears, parse, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Calendar, Shield } from 'lucide-react';

interface AgeVerificationProps {
  onVerified: (dateOfBirth: Date) => void;
  onBack?: () => void;
}

export function AgeVerification({ onVerified, onBack }: AgeVerificationProps) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnder18, setIsUnder18] = useState(false);

  const calculateAge = (dob: Date): number => {
    return differenceInYears(new Date(), dob);
  };

  const handleVerify = () => {
    setError(null);
    setIsUnder18(false);

    // Validate inputs
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    if (!monthNum || !dayNum || !yearNum) {
      setError('Please enter your complete date of birth');
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      setError('Please enter a valid month (1-12)');
      return;
    }

    if (dayNum < 1 || dayNum > 31) {
      setError('Please enter a valid day (1-31)');
      return;
    }

    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) {
      setError('Please enter a valid year');
      return;
    }

    // Construct date
    const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const dob = parse(dateString, 'yyyy-MM-dd', new Date());

    if (!isValid(dob)) {
      setError('Please enter a valid date');
      return;
    }

    // Check if date is in the future
    if (dob > new Date()) {
      setError('Date of birth cannot be in the future');
      return;
    }

    // Calculate age
    const age = calculateAge(dob);

    if (age < 18) {
      setIsUnder18(true);
      return;
    }

    // User is 18+, proceed
    onVerified(dob);
  };

  if (isUnder18) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-display">Age Requirement Not Met</CardTitle>
          <CardDescription className="text-base">
            We're sorry, but you must be 18 or older to use OpenClique. This helps us 
            maintain a safe community for adult social connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Thanks for your understanding!
          </p>
          {onBack && (
            <Button variant="outline" className="w-full" onClick={onBack}>
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-display">Age Verification</CardTitle>
        <CardDescription className="text-base">
          OpenClique connects you with other adults for real-world meetups. To keep 
          our community safe, you must be at least 18 years old to use this service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date of Birth
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="dob-month" className="text-xs text-muted-foreground">Month</Label>
              <Input
                id="dob-month"
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={month}
                onChange={(e) => setMonth(e.target.value.replace(/\D/g, ''))}
                className="text-center"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob-day" className="text-xs text-muted-foreground">Day</Label>
              <Input
                id="dob-day"
                type="text"
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                value={day}
                onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))}
                className="text-center"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob-year" className="text-xs text-muted-foreground">Year</Label>
              <Input
                id="dob-year"
                type="text"
                inputMode="numeric"
                placeholder="YYYY"
                maxLength={4}
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
                className="text-center"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        <Button className="w-full" onClick={handleVerify}>
          Verify Age
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your date of birth is stored securely and never shared with other users.
          We only use it to verify you meet our age requirement.
        </p>
      </CardContent>
    </Card>
  );
}

export function AgeVerifiedBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-4 w-4" />
      <span>Age verified</span>
    </div>
  );
}
