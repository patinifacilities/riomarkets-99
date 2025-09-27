import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategoryBarChips from '@/components/categories/CategoryBarChips';

interface FilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const FilterToolbar = ({ 
  searchTerm, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange, 
  sortBy, 
  onSortChange 
}: FilterToolbarProps) => {
  return (
    <div className="sticky top-16 z-30 backdrop-blur-md bg-black/60 border-b border-border-soft shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mercados..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-bg-card border-border-soft text-foreground shadow-[var(--glow-green)]/0 hover:shadow-[var(--glow-green)] transition-shadow"
            />
          </div>
          
          {/* Ordenação */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48 h-10 bg-bg-card border-border-soft">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border-soft">
              <SelectItem value="recentes">Mais recentes</SelectItem>
              <SelectItem value="populares">Mais populares</SelectItem>
              <SelectItem value="liquidez">Maior liquidez</SelectItem>
              <SelectItem value="prazo">Prazo menor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Chips de categoria */}
        <div className="mt-4">
          <CategoryBarChips 
            selectedCategoryId={selectedCategory}
            onCategorySelect={onCategoryChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;