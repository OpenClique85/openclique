/**
 * SchoolSelect - Dropdown for selecting school/university
 * Shows special messaging for UT Austin students about verification
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AUSTIN_SCHOOLS, SchoolInfo, VerificationTier } from '@/types/profile';
import { GraduationCap, Star, Eye, EyeOff } from 'lucide-react';

interface SchoolSelectProps {
  isStudent: boolean | undefined;
  onIsStudentChange: (isStudent: boolean | undefined) => void;
  selectedSchool: SchoolInfo | undefined;
  onSchoolChange: (school: SchoolInfo | undefined) => void;
  showPublicly: boolean;
  onShowPubliclyChange: (show: boolean) => void;
}

export function SchoolSelect({
  isStudent,
  onIsStudentChange,
  selectedSchool,
  onSchoolChange,
  showPublicly,
  onShowPubliclyChange,
}: SchoolSelectProps) {
  
  const handleStudentToggle = (value: string) => {
    if (value === 'yes') {
      onIsStudentChange(true);
    } else if (value === 'no') {
      onIsStudentChange(false);
      onSchoolChange(undefined);
    } else {
      onIsStudentChange(undefined);
      onSchoolChange(undefined);
    }
  };

  const handleSchoolSelect = (schoolId: string) => {
    const school = AUSTIN_SCHOOLS.find(s => s.id === schoolId);
    if (school) {
      const schoolInfo: SchoolInfo = {
        school_id: school.id,
        school_name: school.name,
        verification_tier: 'self_reported' as VerificationTier,
      };
      onSchoolChange(schoolInfo);
    }
  };

  const isUTAustin = selectedSchool?.school_id === 'ut_austin';
  const selectedSchoolData = selectedSchool 
    ? AUSTIN_SCHOOLS.find(s => s.id === selectedSchool.school_id) 
    : null;

  return (
    <div className="space-y-4">
      {/* Are you a student? */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Are you currently in school?
        </Label>
        <Select
          value={isStudent === true ? 'yes' : isStudent === false ? 'no' : 'skip'}
          onValueChange={handleStudentToggle}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="skip">Prefer not to say</SelectItem>
            <SelectItem value="yes">Yes, I'm a student</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* School selection - only show if they said yes */}
      {isStudent === true && (
        <div className="space-y-2 animate-fade-in">
          <Label>Which school?</Label>
          <Select
            value={selectedSchool?.school_id || ''}
            onValueChange={handleSchoolSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your school..." />
            </SelectTrigger>
            <SelectContent>
              {AUSTIN_SCHOOLS.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  <span className="flex items-center gap-2">
                    <span>{school.emoji}</span>
                    <span>{school.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* UT Austin special messaging */}
      {isUTAustin && (
        <div 
          className="p-3 rounded-lg animate-fade-in"
          style={{ backgroundColor: 'rgba(191, 87, 0, 0.1)', borderLeft: '3px solid #BF5700' }}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">🤘</span>
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: '#BF5700' }}>
                Hook 'em! 🐂
              </p>
              <p className="text-xs text-muted-foreground">
                UT Austin students get a special burnt orange profile and the 🤘 badge.
              </p>
              {selectedSchool?.verification_tier === 'self_reported' && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Verify your @utexas.edu email for the star badge!
                  </Badge>
                </div>
              )}
              {selectedSchool?.verification_tier === 'email_verified' && (
                <Badge className="mt-2 text-xs" style={{ backgroundColor: '#BF5700' }}>
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Verified Longhorn ⭐🤘🐂
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other school badge preview */}
      {selectedSchoolData && !isUTAustin && (
        <div className="p-3 bg-muted rounded-lg animate-fade-in">
          <p className="text-sm text-muted-foreground">
            Your profile will show: <span className="font-medium">{selectedSchoolData.emoji} {selectedSchoolData.name}</span>
          </p>
        </div>
      )}

      {/* Privacy toggle - only show if school selected */}
      {selectedSchool && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2">
            {showPublicly ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="show-school" className="text-sm cursor-pointer">
                Show school on my profile
              </Label>
              <p className="text-xs text-muted-foreground">
                {showPublicly 
                  ? 'Other users can see your school' 
                  : 'Used for matching only, not shown publicly'}
              </p>
            </div>
          </div>
          <Switch
            id="show-school"
            checked={showPublicly}
            onCheckedChange={onShowPubliclyChange}
          />
        </div>
      )}
    </div>
  );
}
