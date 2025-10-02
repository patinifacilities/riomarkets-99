import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Wallet, Trophy, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: '/wallet', icon: Wallet, label: 'Carteira', authRequired: true },
    { href: '/', icon: TrendingUp, label: 'Mercados' },
    { href: '/fast', icon: Zap, label: 'Fast', authRequired: true, isFast: true },
    { href: '/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/profile', icon: User, label: 'Perfil', authRequired: true }
  ];

  const visibleItems = navItems.filter(item => !item.authRequired || (item.authRequired && user));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center h-16 relative px-4">
        {visibleItems.map((item, index) => {
          const isActive = item.href === '/' 
            ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
            : location.pathname === item.href;

          if (item.isFast) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2 -top-3"
              >
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: '#ff2389',
                    animation: 'fastButtonSpin 7s linear infinite'
                  }}
                >
                  <item.icon 
                    className="w-6 h-6 text-white" 
                    style={{
                      animation: 'fastIconPulse 7s ease-in-out infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          // New order: Carteira(0), Mercados(1), Fast(center), Ranking(3), Perfil(4)
          const gridColumn = index < 2 ? index + 1 : index + 2;
          
          // Position adjustments for better spacing
          let additionalClasses = '';
          if (index === 0) additionalClasses = 'justify-self-start ml-[-8px]'; // Carteira - closer to Fast
          else if (index === 1) additionalClasses = 'justify-self-end mr-2'; // Mercados - not cut off
          else if (index === 3) additionalClasses = 'justify-self-start ml-2'; // Ranking
          else if (index === 4) additionalClasses = 'justify-self-end'; // Perfil

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                additionalClasses,
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{ gridColumn }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
