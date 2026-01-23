/**
 * DisplayNameWithBadges - Shows a user's name with school badges and styling
 * UT Austin students get special burnt orange styling and 🤘🐂 emojis
 */

import { cn } from '@/lib/utils';
import { 
  UserPreferences, 
  isUTAustinStudent, 
  isUTAustinVerified, 
  getSchoolById 
} from '@/types/profile';

interface DisplayNameWithBadgesProps {
  displayName: string;
  preferences?: UserPreferences | null;
  className?: string;
  showSchoolBadge?: boolean;
}

export function DisplayNameWithBadges({ 
  displayName, 
  preferences, 
  className,
  showSchoolBadge = true 
}: DisplayNameWithBadgesProps) {
  const school = preferences?.demographics?.school;
  const showPublicly = preferences?.demographics?.show_school_publicly !== false;
  
  const isUT = isUTAustinStudent(preferences);
  const isVerified = isUTAustinVerified(preferences);
  const schoolInfo = school ? getSchoolById(school.school_id) : null;

  // Don't show badges if user opted for privacy
  const showBadges = showSchoolBadge && showPublicly && schoolInfo;

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1',
        isUT && 'text-[#BF5700] font-medium',
        className
      )}
    >
      {displayName}
      {showBadges && (
        <>
          {isVerified ? (
            // Email-verified UT Austin: star + hook em + longhorn
            <span className="ml-1" title="Verified UT Austin Student">
              ⭐🤘🐂
            </span>
          ) : isUT ? (
            // Self-reported UT Austin: just hook em
            <span className="ml-1" title="UT Austin Student">
              🤘
            </span>
          ) : (
            // Other schools: their emoji
            <span className="ml-1" title={schoolInfo.name}>
              {schoolInfo.emoji}
            </span>
          )}
        </>
      )}
    </span>
  );
}

/**
 * Styled profile card border for UT Austin students
 */
export function getProfileBorderClass(preferences?: UserPreferences | null): string {
  if (isUTAustinVerified(preferences)) {
    return 'border-2 border-[#BF5700] ring-2 ring-[#BF5700]/20';
  }
  if (isUTAustinStudent(preferences)) {
    return 'border border-[#BF5700]/50';
  }
  return '';
}
