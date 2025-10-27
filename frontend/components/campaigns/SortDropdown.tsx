/**
 * Sort Dropdown Component
 * Allows users to sort campaigns by various criteria
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'most-funded'
  | 'least-funded'
  | 'ending-soon'
  | 'most-contributors';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-funded', label: 'Most Funded' },
  { value: 'least-funded', label: 'Least Funded' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'most-contributors', label: 'Most Contributors' },
];

export function SortDropdown({ value, onChange, className = '' }: SortDropdownProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Label htmlFor="sort-select" className="text-sm font-medium">
        Sort by
      </Label>
      <Select value={value} onValueChange={(val) => onChange(val as SortOption)}>
        <SelectTrigger id="sort-select" className="w-[200px]">
          <SelectValue placeholder="Sort campaigns" />
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
  );
}
