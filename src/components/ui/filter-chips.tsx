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
  className = "flex flex-wrap gap-2",
  chipClassName = "px-4 py-2 text-sm"
}: FilterChipsProps) {
  return (
    <div className={className}>
      {chips.map((chip) => {
        const isSelected = selectedChips.includes(chip.id);
        
        return (
          <Badge
            key={chip.id}
            variant={isSelected ? "default" : "outline"}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${chipClassName} ${
              isSelected 
                ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg border-0' 
                : 'border-2 border-border/60 text-foreground hover:border-primary/60 hover:bg-primary/5 bg-background/80'
            }`}
            onClick={() => onChipSelect(chip.id)}
          >
            <span className="font-medium">{chip.label}</span>
            {isSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2 hover:bg-white/20 rounded-full"
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
  );
}