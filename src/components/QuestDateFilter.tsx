import { useState, useMemo } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { QUEST_STATUS_CONFIG, type QuestStatus } from '@/constants/quests/types';

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

interface QuestDateFilterProps {
  onFilterChange: (filters: {
    month: string | null;
    days: number[];
    statuses: QuestStatus[];
  }) => void;
  activeFilters: {
    month: string | null;
    days: number[];
    statuses: QuestStatus[];
  };
}

const statusOptions: { status: QuestStatus; color: string }[] = [
  { status: 'open', color: 'bg-emerald-500' },
  { status: 'limited', color: 'bg-amber-500' },
  { status: 'closed', color: 'bg-red-500' },
  { status: 'past', color: 'bg-gray-400' },
  { status: 'coming-soon', color: 'bg-muted-foreground' },
];

const QuestDateFilter = ({ onFilterChange, activeFilters }: QuestDateFilterProps) => {
  const hasActiveFilters = activeFilters.month !== null || 
    activeFilters.days.length > 0 || 
    activeFilters.statuses.length > 0;

  const handleMonthChange = (value: string) => {
    onFilterChange({
      ...activeFilters,
      month: value === 'all' ? null : value,
    });
  };

  const handleDayToggle = (dayIndex: number) => {
    const newDays = activeFilters.days.includes(dayIndex)
      ? activeFilters.days.filter(d => d !== dayIndex)
      : [...activeFilters.days, dayIndex];
    
    onFilterChange({
      ...activeFilters,
      days: newDays,
    });
  };

  const handleStatusToggle = (status: QuestStatus) => {
    const newStatuses = activeFilters.statuses.includes(status)
      ? activeFilters.statuses.filter(s => s !== status)
      : [...activeFilters.statuses, status];
    
    onFilterChange({
      ...activeFilters,
      statuses: newStatuses,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      month: null,
      days: [],
      statuses: [],
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="w-4 h-4" />
          <span>Filter Quests</span>
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

      {/* Month Picker */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Month</label>
        <Select 
          value={activeFilters.month || 'all'} 
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
              pressed={activeFilters.days.includes(index)}
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

      {/* Status Legend / Filter */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Status</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(({ status, color }) => {
            const isActive = activeFilters.statuses.includes(status);
            const config = QUEST_STATUS_CONFIG[status];
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
                <span>{config.label.replace(' - Join Now', '').replace(' Spots', '')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestDateFilter;
