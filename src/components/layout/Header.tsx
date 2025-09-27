import { TrendingUp, Wallet, Trophy, Settings, LogOut, User, LogIn, Receipt, Newspaper, ArrowRightLeft, Menu } from 'lucide-react';
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
import logoImage from '@/assets/rio-markets-logo-white.png';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, signOut, isAuthenticated, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);

  // Simplified authentication check
  const userIsLoggedIn = !loading && !!user && !!session;
  const showUserButtons = userIsLoggedIn && !!profile;

  // Debug authentication state
  console.log('Header Debug:', { 
    loading,
    user: !!user, 
    session: !!session,
    isAuthenticated, 
    profile: !!profile,
    userIsLoggedIn,
    showUserButtons,
    profileIsAdmin: profile?.is_admin 
  });

  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletHoverOpen, setWalletHoverOpen] = useState(false);

  const navItems = [
    { href: '/', icon: TrendingUp, label: 'Mercados' },
    { href: '/exchange', icon: ArrowRightLeft, label: 'Exchange', authRequired: true },
    { href: '/transactions', icon: Receipt, label: 'Transações', authRequired: true },
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
                  <SheetTitle className="text-white text-left">Rio Markets</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col mt-6 space-y-1">
                  {/* User Info Section */}
                  {showUserButtons && (
                    <div className="border-b border-border pb-4 mb-4">
                      <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {profile.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{profile.nome}</p>
                          <p className="text-xs text-gray-300 capitalize">{profile.nivel}</p>
                        </div>
                      </div>
                      <div className="px-2 py-2 mt-2 rounded-lg bg-gradient-primary text-primary-foreground font-semibold text-center">
                        {profile.saldo_moeda.toLocaleString()} Rioz
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation Items */}
                  {visibleNavItems.map((item) => {
                    const isActive = item.href === '/' 
                      ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
                      : location.pathname === item.href;
                    
                    const requiresAuth = item.authRequired && !isAuthenticated;
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
                              ? 'text-black' 
                              : 'text-white hover:text-foreground hover:bg-muted/10'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  {/* Auth Actions */}
                  {showUserButtons ? (
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
            <img src={logoImage} alt="Rio Markets" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const isActive = item.href === '/' 
                ? (location.pathname === '/' || location.pathname.startsWith('/market/'))
                : location.pathname === item.href;
              
              const requiresAuth = item.authRequired && !isAuthenticated;
              
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
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'text-foreground/80 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="flex items-center gap-3">
            {showUserButtons ? (
              <>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/wallet')}
                  className="gap-2 shadow-success rounded-xl"
                >
                  <TrendingUp className="w-4 h-4" />
                  Depositar
                </Button>

                {/* Wallet Button - Show balance */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onMouseEnter={() => setWalletHoverOpen(true)}
                    onMouseLeave={() => setWalletHoverOpen(false)}
                    onClick={() => navigate('/wallet')}
                    className="h-9 px-3 bg-muted/50 hover:bg-muted border border-border/50 flex items-center gap-2 rounded-xl"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="font-mono text-sm">
                      {profile.saldo_moeda.toLocaleString()} RZ
                    </span>
                  </Button>
                  <WalletHoverCard 
                    isOpen={walletHoverOpen} 
                    onClose={() => setWalletHoverOpen(false)} 
                  />
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/wallet')}
                  className="gap-2 shadow-success rounded-xl"
                >
                  <TrendingUp className="w-4 h-4" />
                  Depositar
                </Button>

                {/* Wallet Button - Show balance */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onMouseEnter={() => setWalletHoverOpen(true)}
                    onMouseLeave={() => setWalletHoverOpen(false)}
                    onClick={() => navigate('/wallet')}
                    className="h-9 px-3 bg-muted/50 hover:bg-muted border border-border/50 flex items-center gap-2 rounded-xl"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="font-mono text-sm">
                      {profile.saldo_moeda.toLocaleString()} RZ
                    </span>
                  </Button>
                  <WalletHoverCard 
                    isOpen={walletHoverOpen} 
                    onClose={() => setWalletHoverOpen(false)} 
                  />
                </div>

                {/* Profile Button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="h-9 px-3 bg-muted/50 hover:bg-muted border border-border/50 flex items-center gap-2 rounded-xl"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Perfil</span>
                </Button>
                
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-white">{profile.nome}</p>
                  <p className="text-xs text-gray-300 capitalize">{profile.nivel}</p>
                </div>
                
                {/* Logout Button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={signOut}
                  className="h-9 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 flex items-center gap-2 rounded-xl text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Sair</span>
                </Button>
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
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;