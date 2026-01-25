/**
 * ProfileEditModal - Allows users to edit their profile preferences
 * Loads existing data and updates on save
 */

import { useState, useEffect } from 'react';
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

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

const INTEREST_OPTIONS = [
  { id: 'culture', label: '🎨 Culture & Arts' },
  { id: 'wellness', label: '🏃 Wellness & Fitness' },
  { id: 'connector', label: '🤝 Social & Networking' },
];

export function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Demographics
  const [ageRange, setAgeRange] = useState<AgeRange | undefined>();
  const [area, setArea] = useState<AustinArea | undefined>();
  
  // School/University
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

  // Load existing profile data when modal opens
  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || '');
      
      const prefs = profile.preferences as UserPreferences | null;
      if (prefs) {
        setInterests(prefs.interest_tags || []);
        setAgeRange(prefs.demographics?.age_range);
        setArea(prefs.demographics?.area);
        
        // School data
        setSchool(prefs.demographics?.school);
        setIsStudent(prefs.demographics?.school ? true : undefined);
        setShowSchoolPublicly(prefs.demographics?.show_school_publicly !== false);
        
        setGroupSize(prefs.social_style?.group_size || []);
        setGroupTendency(prefs.social_style?.group_tendency || []);
        setPostEventEnergy(prefs.social_style?.post_event_energy);
        setVibePreference(prefs.social_style?.vibe_preference || 3);
        setGoals(prefs.intent?.goals || []);
        setQuestFrequency(prefs.intent?.quest_frequency);
        setTimeSlots(prefs.availability?.time_slots || []);
        setPreferredLength(prefs.availability?.preferred_length);
        setConstraints(prefs.availability?.constraints || []);
        setQuestTypes(prefs.interests?.quest_types || []);
        setNotMyThing(prefs.interests?.not_my_thing || []);
        setComfortWith(prefs.group_comfort?.comfort_with || []);
        setOpenTo(prefs.group_comfort?.open_to || []);
        setContextTags(prefs.context_tags || []);
        setIdealExperience(prefs.ideal_experience || '');
      }
    }
  }, [open, profile]);

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

  // Trigger AI trait inference
  const triggerTraitInference = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase.functions.invoke('infer-traits', {
        body: {
          user_id: user.id,
          run_type: 'intake',
        },
      });
      
      if (error) {
        console.error('Trait inference error:', error);
        // Don't show error to user - inference is a background enhancement
      } else {
        toast({
          title: 'Analyzing your preferences...',
          description: 'Check "Your Algorithm" tab for new trait suggestions!',
        });
      }
    } catch (err) {
      console.error('Failed to trigger trait inference:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    
    if (!user) return;
    
    setIsSubmitting(true);
    setError('');
    
    const preferences = JSON.parse(JSON.stringify(buildPreferences()));
    
    // Check if preferences have meaningful data for trait inference
    const hasEnoughPreferences = !!(
      preferences.social_style || 
      preferences.intent || 
      preferences.group_comfort ||
      preferences.interests
    );
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        preferences,
      })
      .eq('id', user.id);
    
    setIsSubmitting(false);
    
    if (updateError) {
      setError('Failed to save profile. Please try again.');
      return;
    }
    
    await refreshProfile();
    toast({
      title: 'Profile updated!',
      description: 'Your preferences have been saved.'
    });
    
    // Trigger AI inference if we have enough preference data
    if (hasEnoughPreferences) {
      triggerTraitInference();
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="font-display text-xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your preferences to improve quest matching.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="Your name or nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>
            
            {/* Basic Interests */}
            <div className="space-y-3">
              <Label>Interests</Label>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <div key={interest.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`edit-${interest.id}`}
                      checked={interests.includes(interest.id)}
                      onCheckedChange={() => handleInterestToggle(interest.id)}
                    />
                    <Label
                      htmlFor={`edit-${interest.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {interest.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Expand/Collapse */}
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
              <span>{showMoreOptions ? 'Show fewer options' : 'More preferences'}</span>
              {showMoreOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showMoreOptions && (
              <div className="space-y-6 animate-fade-in">
                <SectionHeader title="A Little About You" icon="👤" />
                
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

                <SectionHeader title="Quest Interests" icon="✨" />
                
                <MultiSelect
                  label="What kinds of quests sound fun?"
                  options={QUEST_TYPE_OPTIONS}
                  selected={questTypes}
                  onChange={setQuestTypes}
                />
                
                <MultiSelect
                  label="What usually isn't your thing?"
                  options={NOT_MY_THING_OPTIONS}
                  selected={notMyThing}
                  onChange={setNotMyThing}
                />

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

                <SectionHeader title="Life Stage" icon="🙋" />
                
                <MultiSelect
                  label="Which describe you right now?"
                  options={CONTEXT_TAG_OPTIONS}
                  selected={contextTags}
                  onChange={setContextTags}
                />
                
                <TextQuestion
                  label="A great group experience for me feels like..."
                  sublabel="140 chars max"
                  placeholder="e.g., Laughing with strangers who don't feel like strangers anymore"
                  value={idealExperience}
                  onChange={setIdealExperience}
                  maxLength={140}
                />
              </div>
            )}
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
