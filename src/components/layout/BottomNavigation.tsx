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
      <div className="grid grid-cols-5 items-center h-16 relative">
        {visibleItems.map((item, index) => {
          const isActive = item.href === '/' 
            ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
            : location.pathname === item.href;

          if (item.isFast) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-center col-start-3 absolute left-1/2 -translate-x-1/2 -top-3"
              >
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: '#ff2389',
                    animation: 'fastButtonSpin 7s linear infinite, spin 1s ease-in-out 0s 1'
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

          // Position items: first two on left, last two on right
          const gridColumn = index < 2 ? index + 1 : index + 2;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 transition-colors",
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
