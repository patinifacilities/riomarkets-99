import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Settings, Users, FileText, Newspaper, DollarSign, Activity, 
  CreditCard, Banknote, Wallet, Menu, LogOut, Zap, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AdminSidebar = ({ isOpen, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { 
      title: 'Dashboard', 
      icon: Home, 
      path: '/admin',
      exact: true
    },
    { 
      title: 'Mercados', 
      icon: Settings, 
      path: '/admin/markets'
    },
    { 
      title: 'Fast', 
      icon: Zap, 
      path: '/admin/fast',
      color: 'text-[#ff2389] hover:text-[#ff2389]'
    },
    { 
      title: 'Usuários', 
      icon: Users, 
      path: '/admin/users'
    },
    { 
      title: 'Categorias', 
      icon: FileText, 
      path: '/admin/categories'
    },
    { 
      title: 'Notícias', 
      icon: Newspaper, 
      path: '/admin/news'
    },
    { 
      title: 'Receita', 
      icon: DollarSign, 
      path: '/admin/revenue'
    },
    { 
      title: 'Payouts', 
      icon: CreditCard, 
      path: '/admin/payouts'
    },
    { 
      title: 'Depósitos', 
      icon: Banknote, 
      path: '/admin/deposits'
    },
    { 
      title: 'Gateways', 
      icon: Wallet, 
      path: '/admin/gateways'
    },
    { 
      title: 'Logs', 
      icon: Activity, 
      path: '/admin/logs'
    },
    { 
      title: 'Recompensas', 
      icon: Gift, 
      path: '/admin/rewards'
    },
    { 
      title: 'Branding', 
      icon: Settings, 
      path: '/admin/branding',
      color: 'text-[#00ff90] hover:text-[#00ff90]'
    }
  ];

  const isActivePath = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-background border-r border-border z-50 transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Admin Panel</h2>
              <Badge variant="destructive" className="text-xs">
                ADMIN
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          {user?.email && (
            <p className="text-xs text-muted-foreground mt-2">
              {user.email}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
            const isActive = isActivePath(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? item.path === '/admin/branding' 
                      ? 'text-black' 
                      : 'bg-primary text-primary-foreground'
                    : `hover:bg-muted text-muted-foreground hover:text-foreground ${item.color || ''}`
                  }
                `}
                style={isActive && item.path === '/admin/branding' ? { backgroundColor: '#00ff90' } : {}}
                onClick={() => {
                  // Keep sidebar open on all screen sizes
                  // Sidebar should remain persistent for navigation
                }}
              >
                <item.icon className={`h-4 w-4 ${!isActive && item.color ? item.color : ''}`} />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sair</span>
          </Button>
        </div>
      </div>
    </>
  );
};