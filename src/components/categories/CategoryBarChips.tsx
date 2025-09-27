import React, { memo } from 'react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryBarChipsProps {
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
}

interface CategoryItem {
  id: string;
  nome: string;
  icon_url?: string;
}

const CategoryBarChips = memo(({ selectedCategoryId, onCategorySelect }: CategoryBarChipsProps) => {
  const { data: categories = [], isLoading } = useCategories();

  // Create UI items array: "Todos" + database categories
  const categoryItems: CategoryItem[] = [
    { id: 'all', nome: 'Todos' },
    ...categories
  ];

  if (isLoading) {
    return (
      <div className="w-full py-4 bg-bg-app">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-8 w-20 rounded-full bg-bg-card border border-border-soft animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 bg-bg-app">
      <div className="container mx-auto px-4">
        <div 
          className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          role="tablist"
          aria-label="Categorias de mercados"
          style={{
            scrollbarGutter: 'stable',
            maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
          }}
        >
          {categoryItems.map((item) => {
            const isActive = selectedCategoryId === item.id;
            
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onCategorySelect(item.id)}
                className={`
                  flex-shrink-0 snap-center
                  flex items-center gap-2 
                  px-3 py-1.5 rounded-full border text-sm
                  min-h-[44px] min-w-[44px]
                  transition-all duration-200 ease-out
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF91]
                  ${isActive 
                    ? 'border-[#00FF91] shadow-[0_0_0_3px_rgba(0,255,145,0.15)] text-foreground bg-bg-card' 
                    : 'border-border-soft text-foreground/90 bg-transparent hover:bg-white/5 hover:border-border'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                aria-label={`Categoria ${item.nome}`}
                tabIndex={0}
              >
                {item.icon_url && (
                  <img 
                    src={item.icon_url} 
                    alt="" 
                    aria-hidden="true"
                    className="w-4 h-4 flex-shrink-0" 
                  />
                )}
                <span className="whitespace-nowrap">{item.nome}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CategoryBarChips.displayName = 'CategoryBarChips';

export default CategoryBarChips;