import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export default function OrderFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 font-['Poppins',sans-serif] text-[13px]"
        />
      </div>

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px] font-['Poppins',sans-serif] text-[13px]">
          <ArrowUpDown className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date" className="font-['Poppins',sans-serif] text-[13px]">
            Date (Newest)
          </SelectItem>
          <SelectItem value="amount" className="font-['Poppins',sans-serif] text-[13px]">
            Amount (Highest)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

