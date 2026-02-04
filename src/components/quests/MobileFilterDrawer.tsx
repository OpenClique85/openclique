/**
 * Mobile Filter Drawer
 * 
 * A collapsible drawer for quest filters on mobile devices.
 * Keeps the main feed clean and Netflix-like.
 */

import { useState } from 'react';
import { Search, SlidersHorizontal, X, Sparkles, User, ArrowUpDown, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useActiveCreators } from '@/hooks/useCreatorSlugs';
import { useFollowedIds } from '@/hooks/useFollows';
import type { QuestFilters } from '@/components/QuestFilterBar';

type QuestStatus = 'open' | 'closed' | 'coming-soon' | 'completed';

const QUEST_STATUS_CONFIG: Record<QuestStatus, { label: string; color: string }> = {
  'open': { label: 'Open', color: 'bg-emerald-500' },
  'closed': { label: 'Full', color: 'bg-amber-500' },
  'coming-soon': { label: 'Coming Soon', color: 'bg-gray-400' },
  'completed': { label: 'Completed', color: 'bg-muted-foreground' },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = [
  { short: 'S', full: 'Sunday' },
  { short: 'M', full: 'Monday' },
  { short: 'T', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'T', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'S', full: 'Saturday' },
];

const INTEREST_OPTIONS = [
  { id: 'culture', label: 'Culture', emoji: '🎭' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'connector', label: 'Social', emoji: '🤝' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Starting Soon' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
];

interface MobileFilterDrawerProps {
  filters: QuestFilters;
  onFilterChange: (filters: QuestFilters) => void;
}

export function MobileFilterDrawer({ filters, onFilterChange }: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const { data: creators = [] } = useActiveCreators();
  const { hasFollows } = useFollowedIds();

  const activeFilterCount = [
    filters.search.length > 0,
    filters.month !== null,
    filters.days.length > 0,
    filters.statuses.length > 0,
    filters.interests.length > 0,
    filters.creatorId !== null,
    filters.followingOnly,
  ].filter(Boolean).length;

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleMonthChange = (value: string) => {
    onFilterChange({
      ...filters,
      month: value === 'all' ? null : value,
    });
  };

  const handleDayToggle = (dayIndex: number) => {
    const newDays = filters.days.includes(dayIndex)
      ? filters.days.filter(d => d !== dayIndex)
      : [...filters.days, dayIndex];
    onFilterChange({ ...filters, days: newDays });
  };

  const handleStatusToggle = (status: QuestStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const handleInterestToggle = (interest: string) => {
    const newInterests = filters.interests.includes(interest)
      ? filters.interests.filter(i => i !== interest)
      : [...filters.interests, interest];
    onFilterChange({ ...filters, interests: newInterests });
  };

  const handleFollowingToggle = () => {
    onFilterChange({ ...filters, followingOnly: !filters.followingOnly });
  };

  const handleCreatorChange = (value: string) => {
    onFilterChange({
      ...filters,
      creatorId: value === 'all' ? null : value,
    });
  };

  const handleSortChange = (value: string) => {
    onFilterChange({
      ...filters,
      sortBy: value as QuestFilters['sortBy'],
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      month: null,
      days: [],
      statuses: [],
      interests: [],
      creatorId: null,
      sortBy: 'date',
      followingOnly: false,
    });
  };

  const statusOptions = Object.entries(QUEST_STATUS_CONFIG).map(([status, config]) => ({
    status: status as QuestStatus,
    ...config,
  }));

  const selectedCreator = creators.find(c => c.user_id === filters.creatorId);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle>Filter Quests</DrawerTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search quests..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              Sort By
            </label>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interest Filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {hasFollows && (
                <button
                  onClick={handleFollowingToggle}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                    transition-all border
                    ${filters.followingOnly 
                      ? 'border-primary bg-primary/10 text-foreground' 
                      : 'border-border bg-background text-muted-foreground'
                    }
                  `}
                >
                  <Heart className={`h-4 w-4 ${filters.followingOnly ? 'fill-primary' : ''}`} />
                  <span>Following</span>
                </button>
              )}
              {INTEREST_OPTIONS.map(({ id, label, emoji }) => {
                const isActive = filters.interests.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => handleInterestToggle(id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                      transition-all border
                      ${isActive 
                        ? 'border-primary bg-primary/10 text-foreground' 
                        : 'border-border bg-background text-muted-foreground'
                      }
                    `}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Creator Filter */}
          {creators.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <User className="h-3 w-3" />
                Creator
              </label>
              <Select 
                value={filters.creatorId || 'all'} 
                onValueChange={handleCreatorChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedCreator ? selectedCreator.display_name : 'All Creators'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {creators.map((creator) => (
                    <SelectItem key={creator.user_id} value={creator.user_id}>
                      {creator.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Month Filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Month
            </label>
            <Select 
              value={filters.month || 'all'} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month.toLowerCase()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Days Available */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Days Available
            </label>
            <div className="flex gap-1">
              {DAYS_OF_WEEK.map((day, index) => (
                <Toggle
                  key={`${day.short}-${index}`}
                  pressed={filters.days.includes(index)}
                  onPressedChange={() => handleDayToggle(index)}
                  size="sm"
                  className="flex-1 px-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label={`Toggle ${day.full}`}
                >
                  {day.short}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(({ status, label, color }) => {
                const isActive = filters.statuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                      transition-all border
                      ${isActive 
                        ? 'border-primary bg-primary/10 text-foreground' 
                        : 'border-border bg-background text-muted-foreground'
                      }
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <DrawerClose asChild>
            <Button className="w-full">
              Show Results
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
