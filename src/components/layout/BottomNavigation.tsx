import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Wallet, Trophy, Zap, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: '/fast', icon: Zap, label: 'Fast' },
    { href: '/', icon: TrendingUp, label: 'Mercados' },
    { href: '/wallet', icon: Wallet, label: 'Carteira', authRequired: true },
    { href: '/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/profile', icon: User, label: 'Perfil', authRequired: true }
  ];

  const visibleItems = navItems.filter(item => !item.authRequired || (item.authRequired && user));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = item.href === '/' 
            ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
            : location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                item.href === '/fast' && !isActive && "text-[#ff2389]"
              )} />
              <span className={cn(
                "text-xs font-medium",
                item.href === '/fast' && !isActive && "text-[#ff2389]"
              )}>
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
