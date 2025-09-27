import React, { memo } from 'react';
import { Grid } from 'lucide-react';
import { useCategories, Category } from '@/hooks/useCategories';

interface CategoryBarProps {
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
}

interface CategoryItem {
  id: string;
  nome: string;
  icon_url?: string;
}

const CategoryBar = memo(({ selectedCategoryId, onCategorySelect }: CategoryBarProps) => {
  const { data: categories = [], isLoading } = useCategories();

  // Create UI items array: only database categories (remove "Todos")
  const categoryItems: CategoryItem[] = [...categories];

  if (isLoading) {
    return (
      <div className="w-full py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-18 h-18 md:w-24 md:h-24 rounded-full border-2 border-[#2A2D35] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 bg-background">
      <div className="container mx-auto px-4">
        <div 
          className="flex gap-4 md:gap-6 overflow-x-auto md:flex-wrap md:justify-center scrollbar-hide snap-x snap-mandatory md:snap-none"
          role="tablist"
          aria-label="Categorias de mercados"
        >
          {categoryItems.map((item) => {
            const isActive = selectedCategoryId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onCategorySelect(item.id)}
                className={`
                  flex-shrink-0 snap-center group
                  flex flex-col items-center gap-3 p-2
                  transition-all duration-300 ease-out
                  focus:outline-none focus:ring-2 focus:ring-[#00FFC2] focus:ring-offset-2
                  ${isActive 
                    ? 'transform scale-105' 
                    : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                aria-label={`Categoria ${item.nome}`}
                tabIndex={0}
              >
                {/* Category Circle */}
                <div
                  className={`
                    w-18 h-18 md:w-24 md:h-24
                    rounded-full border-2
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'border-[#00FFC2] shadow-[0_0_24px_rgba(0,255,194,0.35)]' 
                      : 'border-[#2A2D35] hover:shadow-[0_0_16px_rgba(0,255,194,0.2)]'
                    }
                  `}
                >
                  {item.icon_url ? (
                    <img
                      src={item.icon_url}
                      alt=""
                      className={`
                        w-8 h-8 md:w-10 md:h-10 object-contain
                        ${isActive ? 'filter brightness-0 saturate-100 hue-rotate-90 contrast-200' : ''}
                      `}
                    />
                  ) : (
                    <Grid 
                      className={`
                        w-8 h-8 md:w-10 md:h-10
                        ${isActive ? 'text-[#00FFC2]' : 'text-[#A8B0BF]'}
                      `}
                    />
                  )}
                </div>

                {/* Category Label */}
                <span
                  className={`
                    text-xs md:text-sm font-medium text-center
                    transition-colors duration-300
                    min-w-0 max-w-20 md:max-w-24
                    leading-tight truncate
                    ${isActive 
                      ? 'text-[#00FFC2] font-medium' 
                      : 'text-[#A8B0BF] opacity-80'
                    }
                  `}
                >
                  {item.nome}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CategoryBar.displayName = 'CategoryBar';

export default CategoryBar;