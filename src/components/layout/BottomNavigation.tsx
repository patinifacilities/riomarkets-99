import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Wallet, Trophy, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: '/wallet', icon: Wallet, label: 'Carteira', authRequired: true },
    { href: '/', icon: TrendingUp, label: 'Mercados', position: 'left' },
    { href: '/fast', icon: Zap, label: 'Fast', authRequired: true, isFast: true },
    { href: '/ranking', icon: Trophy, label: 'Ranking', position: 'right' },
    { href: '/profile', icon: User, label: 'Perfil', authRequired: true }
  ];

  const visibleItems = navItems.filter(item => !item.authRequired || (item.authRequired && user));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 relative">
        {visibleItems.map((item) => {
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
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                item.label === 'Mercados' && "-ml-8",
                item.label === 'Ranking' && "-ml-1.5",
                item.position === 'right' && "-mr-2",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
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
