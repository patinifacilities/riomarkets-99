import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { usePressStore } from "@/store/usePressStore";
import { track } from "@/lib/analytics";

export function PressFilter() {
  const { filters, vehicles, setFilters, resetFilters } = usePressStore();

  const handleVehicleChange = (value: string) => {
    const vehicle = value === 'all' ? undefined : value;
    setFilters({ vehicle });
    track('apply_filter_press', { filter_type: 'vehicle', value });
  };

  const handlePeriodChange = (value: string) => {
    const period = value === 'all' ? undefined : parseInt(value);
    setFilters({ period });
    track('apply_filter_press', { filter_type: 'period', value });
  };

  const hasActiveFilters = filters.vehicle || filters.period;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filtrar por:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* Vehicle Filter */}
        <Select value={filters.vehicle || 'all'} onValueChange={handleVehicleChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Todos os veículos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os veículos</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle} value={vehicle}>
                {vehicle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Select value={filters.period?.toString() || 'all'} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Todo período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}