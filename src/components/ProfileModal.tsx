import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  MultiSelect,
  SingleSelect,
  VibeSlider,
  TextQuestion,
  SectionHeader,
} from '@/components/profile/QuestionSection';
import { SchoolSelect } from '@/components/profile/SchoolSelect';
import {
  UserPreferences,
  SchoolInfo,
  GroupSize,
  GroupTendency,
  PostEventEnergy,
  Goal,
  QuestFrequency,
  TimeSlot,
  PreferredLength,
  Constraint,
  QuestType,
  NotMyThing,
  ComfortWith,
  OpenTo,
  ContextTag,
  AgeRange,
  AustinArea,
  GROUP_SIZE_OPTIONS,
  GROUP_TENDENCY_OPTIONS,
  POST_EVENT_ENERGY_OPTIONS,
  GOAL_OPTIONS,
  QUEST_FREQUENCY_OPTIONS,
  TIME_SLOT_OPTIONS,
  PREFERRED_LENGTH_OPTIONS,
  CONSTRAINT_OPTIONS,
  QUEST_TYPE_OPTIONS,
  NOT_MY_THING_OPTIONS,
  COMFORT_WITH_OPTIONS,
  OPEN_TO_OPTIONS,
  CONTEXT_TAG_OPTIONS,
  AGE_RANGE_OPTIONS,
  AUSTIN_AREA_OPTIONS,
} from '@/types/profile';

interface ProfileModalProps {
  open: boolean;
  onComplete: () => void;
}

const INTEREST_OPTIONS = [
  { id: 'culture', label: '🎨 Culture & Arts' },
  { id: 'wellness', label: '🏃 Wellness & Fitness' },
  { id: 'connector', label: '🤝 Social & Networking' },
];

export function ProfileModal({ open, onComplete }: ProfileModalProps) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  // Basic required fields
  const [displayName, setDisplayName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Demographics (optional)
  const [ageRange, setAgeRange] = useState<AgeRange | undefined>();
  const [area, setArea] = useState<AustinArea | undefined>();
  
  // School/University (optional)
  const [isStudent, setIsStudent] = useState<boolean | undefined>();
  const [school, setSchool] = useState<SchoolInfo | undefined>();
  const [showSchoolPublicly, setShowSchoolPublicly] = useState(true);

  // Extended preferences
  const [groupSize, setGroupSize] = useState<GroupSize[]>([]);
  const [groupTendency, setGroupTendency] = useState<GroupTendency[]>([]);
  const [postEventEnergy, setPostEventEnergy] = useState<PostEventEnergy | undefined>();
  const [vibePreference, setVibePreference] = useState(3);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [questFrequency, setQuestFrequency] = useState<QuestFrequency | undefined>();
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [preferredLength, setPreferredLength] = useState<PreferredLength | undefined>();
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  
  const [questTypes, setQuestTypes] = useState<QuestType[]>([]);
  const [notMyThing, setNotMyThing] = useState<NotMyThing[]>([]);
  
  const [comfortWith, setComfortWith] = useState<ComfortWith[]>([]);
  const [openTo, setOpenTo] = useState<OpenTo[]>([]);
  
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [idealExperience, setIdealExperience] = useState('');

  const handleInterestToggle = (interestId: string) => {
    setInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const buildPreferences = (): UserPreferences => {
    const prefs: UserPreferences = {
      interest_tags: interests,
    };

    // Demographics (including school)
    if (ageRange || area || school) {
      prefs.demographics = {
        ...(ageRange && { age_range: ageRange }),
        ...(area && { area }),
        ...(school && { school }),
        show_school_publicly: showSchoolPublicly,
      };
    }

    // Only include fields that have values
    if (groupSize.length || groupTendency.length || postEventEnergy || vibePreference !== 3) {
      prefs.social_style = {
        ...(groupSize.length && { group_size: groupSize }),
        ...(groupTendency.length && { group_tendency: groupTendency }),
        ...(postEventEnergy && { post_event_energy: postEventEnergy }),
        vibe_preference: vibePreference,
      };
    }

    if (goals.length || questFrequency) {
      prefs.intent = {
        ...(goals.length && { goals }),
        ...(questFrequency && { quest_frequency: questFrequency }),
      };
    }

    if (timeSlots.length || preferredLength || constraints.length) {
      prefs.availability = {
        ...(timeSlots.length && { time_slots: timeSlots }),
        ...(preferredLength && { preferred_length: preferredLength }),
        ...(constraints.length && { constraints }),
      };
    }

    if (questTypes.length || notMyThing.length) {
      prefs.interests = {
        ...(questTypes.length && { quest_types: questTypes }),
        ...(notMyThing.length && { not_my_thing: notMyThing }),
      };
    }

    if (comfortWith.length || openTo.length) {
      prefs.group_comfort = {
        ...(comfortWith.length && { comfort_with: comfortWith }),
        ...(openTo.length && { open_to: openTo }),
      };
    }

    if (contextTags.length) {
      prefs.context_tags = contextTags;
    }

    if (idealExperience.trim()) {
      prefs.ideal_experience = idealExperience.trim();
    }

    return prefs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    
    if (!consentGiven) {
      setError('Please agree to the terms to continue');
      return;
    }
    
    if (!user) return;
    
    setIsSubmitting(true);
    setError('');
    
    const preferences = JSON.parse(JSON.stringify(buildPreferences()));
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        display_name: displayName.trim(),
        preferences,
        consent_given_at: new Date().toISOString()
      }]);
    
    setIsSubmitting(false);
    
    if (insertError) {
      if (insertError.code === '23505') {
        // Profile already exists, try to update instead
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
            preferences,
            consent_given_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          setError('Failed to save profile. Please try again.');
          return;
        }
      } else {
        setError('Failed to save profile. Please try again.');
        return;
      }
    }
    
    await refreshProfile();
    toast({
      title: 'Profile created!',
      description: 'You\'re all set to join quests.'
    });
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="font-display text-xl">Complete Your Profile</DialogTitle>
          <DialogDescription>
            Help us match you with the right quests and cliques. Takes about a minute!
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Display Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="displayName">What should we call you? *</Label>
              <Input
                id="displayName"
                placeholder="Your name or nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">This is what your squadmates will see</p>
            </div>
            
            {/* Basic Interests */}
            <div className="space-y-3">
              <Label>What interests you? (optional)</Label>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <div key={interest.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={interest.id}
                      checked={interests.includes(interest.id)}
                      onCheckedChange={() => handleInterestToggle(interest.id)}
                    />
                    <Label
                      htmlFor={interest.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {interest.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Expand/Collapse for more options */}
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
              <span>{showMoreOptions ? 'Show fewer options' : 'Improve your matches (optional)'}</span>
              {showMoreOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showMoreOptions && (
              <div className="space-y-6 animate-fade-in">
                {/* Demographics Section */}
                <SectionHeader title="A Little About You" icon="👤" />
                <p className="text-xs text-muted-foreground -mt-4">
                  Helps us match you with similar folks. Totally optional!
                </p>
                
                <SingleSelect<AgeRange>
                  label="Age range"
                  options={AGE_RANGE_OPTIONS}
                  selected={ageRange}
                  onChange={(v) => setAgeRange(v)}
                />
                
                <SingleSelect<AustinArea>
                  label="Where in Austin are you based?"
                  options={AUSTIN_AREA_OPTIONS}
                  selected={area}
                  onChange={(v) => setArea(v)}
                />

                {/* School/University Section */}
                <SchoolSelect
                  isStudent={isStudent}
                  onIsStudentChange={setIsStudent}
                  selectedSchool={school}
                  onSchoolChange={setSchool}
                  showPublicly={showSchoolPublicly}
                  onShowPubliclyChange={setShowSchoolPublicly}
                />

                {/* Social Style Section */}
                <SectionHeader title="Social Style" icon="💬" />
                
                <MultiSelect
                  label="How do you usually like to socialize?"
                  options={GROUP_SIZE_OPTIONS}
                  selected={groupSize}
                  onChange={setGroupSize}
                />
                
                <MultiSelect
                  label="In group settings, I tend to..."
                  options={GROUP_TENDENCY_OPTIONS}
                  selected={groupTendency}
                  onChange={setGroupTendency}
                />
                
                <SingleSelect<PostEventEnergy>
                  label="After social events, I usually feel..."
                  options={POST_EVENT_ENERGY_OPTIONS}
                  selected={postEventEnergy}
                  onChange={(v) => setPostEventEnergy(v)}
                />
                
                <VibeSlider
                  label="Preferred vibe"
                  leftLabel="Chill"
                  rightLabel="High-energy"
                  value={vibePreference}
                  onChange={setVibePreference}
                />

                {/* Intent Section */}
                <SectionHeader title="Intent & Motivation" icon="🎯" />
                
                <MultiSelect
                  label="What are you hoping to get out of OpenClique?"
                  sublabel="Pick up to 2"
                  options={GOAL_OPTIONS}
                  selected={goals}
                  onChange={setGoals}
                  maxSelect={2}
                />
                
                <SingleSelect<QuestFrequency>
                  label="How often would you ideally do quests?"
                  options={QUEST_FREQUENCY_OPTIONS}
                  selected={questFrequency}
                  onChange={(v) => setQuestFrequency(v)}
                />

                {/* Availability Section */}
                <SectionHeader title="Availability" icon="📅" />
                
                <MultiSelect
                  label="When are you usually free?"
                  options={TIME_SLOT_OPTIONS}
                  selected={timeSlots}
                  onChange={setTimeSlots}
                />
                
                <SingleSelect<PreferredLength>
                  label="Preferred event length"
                  options={PREFERRED_LENGTH_OPTIONS}
                  selected={preferredLength}
                  onChange={(v) => setPreferredLength(v)}
                />
                
                <MultiSelect
                  label="Anything that helps us plan better?"
                  options={CONSTRAINT_OPTIONS}
                  selected={constraints}
                  onChange={setConstraints}
                />

                {/* Interests Section */}
                <SectionHeader title="Quest Interests" icon="✨" />
                
                <MultiSelect
                  label="What kinds of quests sound fun?"
                  options={QUEST_TYPE_OPTIONS}
                  selected={questTypes}
                  onChange={setQuestTypes}
                />
                
                <MultiSelect
                  label="What usually isn't your thing? (optional)"
                  options={NOT_MY_THING_OPTIONS}
                  selected={notMyThing}
                  onChange={setNotMyThing}
                />

                {/* Group Comfort Section */}
                <SectionHeader title="Group Comfort" icon="👥" />
                
                <MultiSelect
                  label="I'm comfortable being grouped with..."
                  options={COMFORT_WITH_OPTIONS}
                  selected={comfortWith}
                  onChange={setComfortWith}
                />
                
                <MultiSelect
                  label="I'm open to quests with..."
                  options={OPEN_TO_OPTIONS}
                  selected={openTo}
                  onChange={setOpenTo}
                />

                {/* Context Section */}
                <SectionHeader title="Life Stage" icon="🙋" />
                
                <MultiSelect
                  label="Which describe you right now? (optional)"
                  options={CONTEXT_TAG_OPTIONS}
                  selected={contextTags}
                  onChange={setContextTags}
                />
                
                <TextQuestion
                  label="A great group experience for me feels like..."
                  sublabel="Optional, 140 chars max"
                  placeholder="e.g., Laughing with strangers who don't feel like strangers anymore"
                  value={idealExperience}
                  onChange={setIdealExperience}
                  maxLength={140}
                />
              </div>
            )}
            
            {/* Consent Checkbox */}
            <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked === true)}
              />
              <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
                I agree to OpenClique's{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Let's Go!
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              You can update these preferences anytime in your profile settings
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
