import { Search, Calendar, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';

// Status types matching database
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
  { short: 'Sun', full: 'Sunday' },
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
];

const INTEREST_OPTIONS = [
  { id: 'culture', label: 'Culture & Arts', emoji: '🎭' },
  { id: 'wellness', label: 'Wellness & Fitness', emoji: '🧘' },
  { id: 'connector', label: 'Social & Networking', emoji: '🤝' },
];

export interface QuestFilters {
  search: string;
  month: string | null;
  days: number[];
  statuses: QuestStatus[];
  interests: string[];
}

interface QuestFilterBarProps {
  filters: QuestFilters;
  onFilterChange: (filters: QuestFilters) => void;
}

const QuestFilterBar = ({ filters, onFilterChange }: QuestFilterBarProps) => {
  const hasActiveFilters = 
    filters.search.length > 0 ||
    filters.month !== null || 
    filters.days.length > 0 || 
    filters.statuses.length > 0 ||
    filters.interests.length > 0;

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

  const clearFilters = () => {
    onFilterChange({
      search: '',
      month: null,
      days: [],
      statuses: [],
      interests: [],
    });
  };

  const statusOptions = Object.entries(QUEST_STATUS_CONFIG).map(([status, config]) => ({
    status: status as QuestStatus,
    ...config,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="w-4 h-4" />
          <span>Find Your Quest</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search quests by name or keyword..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Interest / Theme Filter */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map(({ id, label, emoji }) => {
            const isActive = filters.interests.includes(id);
            return (
              <button
                key={id}
                onClick={() => handleInterestToggle(id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all border
                  ${isActive 
                    ? 'border-primary bg-primary/10 text-foreground' 
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
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

      {/* Month Picker */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Month</label>
        <Select 
          value={filters.month || 'all'} 
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Day Availability */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">
          Days I'm Available
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((day, index) => (
            <Toggle
              key={day.short}
              pressed={filters.days.includes(index)}
              onPressedChange={() => handleDayToggle(index)}
              size="sm"
              className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
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
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  transition-all border
                  ${isActive 
                    ? 'border-primary bg-primary/10 text-foreground' 
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
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
  );
};

export default QuestFilterBar;
