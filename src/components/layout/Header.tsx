import { TrendingUp, Wallet, Trophy, Settings, LogOut, User, LogIn, Receipt, Newspaper, ArrowRightLeft, Menu, Plus, UserCircle, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { TickerBar } from '@/components/ui/ticker-bar';
import { WalletHoverCard } from '@/components/wallet/WalletHoverCard';
import { DarkModeToggle } from './DarkModeToggle';
import { AddBrlModal } from '@/components/exchange/AddBrlModal';

import logoImageWhite from '@/assets/rio-markets-logo-new.png';
import logoImageBlack from '@/assets/rio-markets-logo-new.png';
import menuLogoWhite from '@/assets/riov3-markets-white-menu.png';
import { useTheme } from 'next-themes';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, signOut, loading } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { resolvedTheme } = useTheme();

  // Authentication check - only require session and user, profile should be optional for initial render
  const isLoggedIn = !loading && !!session && !!user;

  console.log('Header auth state:', { 
    loading, 
    hasSession: !!session, 
    hasUser: !!user, 
    hasProfile: !!profile, 
    isLoggedIn 
  });

  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletHoverOpen, setWalletHoverOpen] = useState(false);

  const navItems = [
    { href: '/fast', icon: Zap, label: 'Fast', special: 'pulse' },
    { href: '/', icon: TrendingUp, label: 'Mercados' },
    { href: '/exchange', icon: ArrowRightLeft, label: 'Exchange', authRequired: true },
    { href: '/ranking', icon: Trophy, label: 'Ranking' },
    { href: '/press', icon: Newspaper, label: 'Na mídia' },
    { href: '/admin', icon: Settings, label: 'Admin', adminRequired: true }
  ];

  const getVisibleNavItems = () => {
    return navItems.filter(item => {
      // Hide admin items if not admin
      if (item.adminRequired && !profile?.is_admin) return false;
      return true;
    });
  };

  const visibleNavItems = getVisibleNavItems();

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <TickerBar />
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/95">
        <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden mr-2">
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-black border-border">
                <SheetHeader className="border-b border-border pb-4">
                  <div className="text-left">
                    <img 
                      src={menuLogoWhite} 
                      alt="Rio Markets" 
                      className="h-8 w-auto" 
                    />
                  </div>
                </SheetHeader>
                
                <div className="flex flex-col mt-6 space-y-1">
                  {/* User Info Section */}
                  {isLoggedIn && profile && (
                    <div className="border-b border-border pb-4 mb-4">
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {profile.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{profile.nome || 'Usuário'}</p>
                          <p className="text-xs text-gray-300 capitalize">{profile.nivel || 'iniciante'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation Items */}
                  {visibleNavItems.map((item) => {
                    const isActive = item.href === '/' 
                      ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
                      : location.pathname === item.href;
                    
              const requiresAuth = item.authRequired && !isLoggedIn;
                    const isDisabled = requiresAuth;
                    
                    if (requiresAuth) {
                      return (
                        <Link 
                          key={item.href} 
                          to="/auth"
                          onClick={handleMobileNavClick}
                          className="block"
                        >
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start gap-3 h-12 text-muted-foreground hover:text-foreground hover:bg-muted/10 opacity-60"
                          >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                            <span className="text-xs ml-auto">Login</span>
                          </Button>
                        </Link>
                      );
                    }
                    
                    return (
                      <Link 
                        key={item.href} 
                        to={item.href}
                        onClick={handleMobileNavClick}
                        className="block"
                      >
                        <Button 
                          variant={isActive ? "secondary" : "ghost"} 
                          size="sm" 
                           className={`w-full justify-start gap-3 h-12 ${
                             isActive 
                               ? 'bg-[#00ff90] text-black hover:bg-[#00ff90]/90' 
                               : 'text-white hover:text-foreground hover:bg-muted/10'
                           } ${item.special === 'pulse' ? 'animate-pulse' : ''}`}
                         >
                           <item.icon className={`w-5 h-5 ${item.special === 'pulse' ? 'text-[#ff2389]' : ''}`} />
                           <span className={item.special === 'pulse' ? 'text-[#ff2389]' : ''}>{item.label}</span>
                         </Button>
                      </Link>
                    );
                  })}
                  
                  {/* Auth Actions */}
                  {isLoggedIn ? (
                    <div className="border-t border-border pt-4 mt-4">
                      <Button 
                        onClick={() => {
                          signOut();
                          handleMobileNavClick();
                        }}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                      >
                        <LogOut className="w-5 h-5" />
                        Sair
                      </Button>
                    </div>
                  ) : !loading && (
                    <div className="border-t border-border pt-4 mt-4">
                      <Link to="/auth" onClick={handleMobileNavClick}>
                        <Button className="w-full justify-start gap-3 h-12">
                          <LogIn className="w-5 h-5" />
                          Entrar
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={resolvedTheme === 'light' ? logoImageBlack : logoImageWhite} 
              alt="Rio Markets" 
              className="h-8 w-auto" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const isActive = item.href === '/' 
                ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
                : location.pathname === item.href;
              
              const requiresAuth = item.authRequired && !isLoggedIn;
              
              if (requiresAuth) {
                return (
                  <Link 
                    key={item.href} 
                    to="/auth"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF91] text-foreground/50 hover:text-foreground/70 opacity-60"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <span className="text-xs">Login</span>
                    </Button>
                  </Link>
                );
              }
              
              return (
                <Link 
                  key={item.href} 
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    size="sm" 
                     className={`gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF91] ${
                      isActive 
                        ? (item.href === '/fast' ? 'bg-[#32162C] text-white hover:bg-[#32162C]/90' : 'bg-primary text-primary-foreground hover:bg-primary/90')
                        : 'text-foreground/80 hover:text-foreground'
                    } ${item.special === 'pulse' ? 'animate-[pulse_0.8s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 ${item.special === 'pulse' ? 'text-[#ff2389]' : ''}`} />
                    <span className={item.special === 'pulse' ? 'text-[#ff2389]' : ''}>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

        {/* Desktop User Menu */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Wallet Balance */}
                <Link to="/wallet">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary rounded-xl"
                  >
                    <Wallet className="w-4 h-4" />
                    {(profile?.saldo_moeda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RZ
                  </Button>
                </Link>
                
                  {/* Deposit Button */}
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowDepositModal(true)}
                  className="gap-2 shadow-success rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Depositar
                </Button>
                
                 {/* Dark Mode Toggle */}
                 <DarkModeToggle />
                
                 {/* Profile Dropdown */}
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button 
                       variant="ghost" 
                       size="sm"
                       className="gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary rounded-full p-2"
                     >
                       <UserCircle className="w-6 h-6" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/transactions" className="flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Transações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                     <DropdownMenuItem 
                       onClick={signOut}
                       className="flex items-center gap-2 text-red-600 focus:text-red-600"
                     >
                       <LogOut className="w-4 h-4" />
                       Sair
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </>
            ) : !loading ? (
              <Link to="/auth">
                <Button className="gap-2 shadow-success rounded-xl">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            ) : null}
          </div>

        {/* Wallet Hover Card */}
        <WalletHoverCard 
          isOpen={walletHoverOpen} 
          onClose={() => setWalletHoverOpen(false)} 
        />
        </div>
      </div>
      
      {/* Deposit Modal */}
      {user && (
        <AddBrlModal
          open={showDepositModal}
          onOpenChange={setShowDepositModal}
          onSuccess={() => {
            setShowDepositModal(false);
            refetchProfile();
          }}
        />
      )}
    </header>
    </>
  );
};

export default Header;