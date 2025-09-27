import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedChips: string[];
  onChipSelect: (chipId: string) => void;
  onRemoveChip: (chipId: string) => void;
  className?: string;
  chipClassName?: string;
}

export function FilterChips({ 
  chips, 
  selectedChips, 
  onChipSelect, 
  onRemoveChip,
  className,
  chipClassName = "px-4 py-2 text-sm"
}: FilterChipsProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isSelected = selectedChips.includes(chip.id);
          
          return (
            <Badge
              key={chip.id}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer transition-colors hover:opacity-80 rounded-xl ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'border-primary/30 text-foreground hover:border-primary/60'
              }`}
              onClick={() => onChipSelect(chip.id)}
            >
              <span>{chip.label}</span>
              {isSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveChip(chip.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}