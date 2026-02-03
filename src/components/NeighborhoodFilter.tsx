import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Neighborhood {
  id: string;
  name: string;
}

interface NeighborhoodFilterProps {
  neighborhoods: Neighborhood[];
  selectedNeighborhood: string | null;
  onNeighborhoodChange: (neighborhoodId: string | null) => void;
}

export function NeighborhoodFilter({
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
}: NeighborhoodFilterProps) {
  return (
    <Select
      value={selectedNeighborhood || 'all'}
      onValueChange={(value) => onNeighborhoodChange(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-full sm:w-[200px] h-11 bg-card border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="All Neighborhoods" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Neighborhoods</SelectItem>
        {neighborhoods.map((neighborhood) => (
          <SelectItem key={neighborhood.id} value={neighborhood.id}>
            {neighborhood.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
