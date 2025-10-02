import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Wallet, Trophy, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: '/', icon: TrendingUp, label: 'Mercados' },
    { href: '/wallet', icon: Wallet, label: 'Carteira', authRequired: true },
    { href: '/fast', icon: Zap, label: 'Fast', authRequired: true, isFast: true },
    { href: '/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/profile', icon: User, label: 'Perfil', authRequired: true }
  ];

  const visibleItems = navItems.filter(item => !item.authRequired || (item.authRequired && user));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-2 h-16 relative">
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
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-pulse"
                  style={{ 
                    backgroundColor: '#ff2389',
                    animation: 'fastButtonSpin 7s linear infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                >
                  <item.icon className="w-6 h-6 text-white animate-[fastIconPulse_7s_ease-in-out_infinite]" />
                </div>
                <span className="text-xs font-medium text-foreground mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          // Position first item (Mercados) on far left, second (Carteira) slightly right
          // Position third item (Ranking) slightly left, fourth (Perfil) on far right
          let positionClass = "";
          if (index === 0) positionClass = "mr-auto"; // Mercados - far left
          if (index === 1) positionClass = ""; // Carteira - will be positioned between left and center
          if (index === 2) positionClass = ""; // Ranking - will be positioned between center and right
          if (index === 3) positionClass = "ml-auto"; // Perfil - far right

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground",
                positionClass
              )}
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
