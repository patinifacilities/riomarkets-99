import { TrendingUp, Wallet, Award, Settings, LogOut, User, LogIn, Receipt, Newspaper, ArrowRightLeft, Menu, Plus, UserCircle, Zap, ArrowLeft, HelpCircle, Gift, Ticket } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { TickerBar } from '@/components/ui/ticker-bar';
import { DarkModeToggle } from './DarkModeToggle';
import { cn } from '@/lib/utils';

import logoImageWhite from '@/assets/rio-markets-logo-new.png';
import logoImageBlack from '@/assets/rio-markets-logo-light.png';
import menuLogoWhite from '@/assets/riov3-markets-white-menu.png';
import { useTheme } from 'next-themes';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, signOut, loading } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { resolvedTheme } = useTheme();

  // Pre-load both logos for smooth transition
  useEffect(() => {
    const preloadImage = (src: string) => {
      const img = new Image();
      img.src = src;
    };
    preloadImage(logoImageWhite);
    preloadImage(logoImageBlack);
  }, []);

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

  // Listen for fast market win animations and force profile refresh
  useEffect(() => {
    const handleWinAnimation = (event: CustomEvent) => {
      const target = document.getElementById('fast-winner-animation-target');
      if (target) {
        const winElement = document.createElement('div');
        winElement.className = 'win-animation';
        winElement.textContent = `+${event.detail.amount.toFixed(0)} RZ`;
        target.appendChild(winElement);
        
        setTimeout(() => {
          winElement.remove();
        }, 2000);
      }
      
      // Force balance update
      refetchProfile();
    };
    
    const handleForceRefresh = () => {
      refetchProfile();
    };
    
    window.addEventListener('fastWinAnimation', handleWinAnimation as EventListener);
    window.addEventListener('forceProfileRefresh', handleForceRefresh);
    return () => {
      window.removeEventListener('fastWinAnimation', handleWinAnimation as EventListener);
      window.removeEventListener('forceProfileRefresh', handleForceRefresh);
    };
  }, [refetchProfile]);

  const navItems = [
    { href: '/fast', icon: Zap, label: 'Fast', special: 'pulse' },
    { href: '/', icon: TrendingUp, label: 'Mercados' },
    { href: '/wallet', icon: Wallet, label: 'Carteira', authRequired: true },
    { href: '/transactions', icon: Receipt, label: 'Transações', authRequired: true },
    { href: '/exchange', icon: ArrowRightLeft, label: 'Exchange', authRequired: true },
    { href: '/raffles', icon: Ticket, label: 'Rifas' },
    { href: '/rewards', icon: Gift, label: 'Recompensas', authRequired: true },
    { href: '/ranking', icon: Award, label: 'Ranking' },
    { href: '/press', icon: Newspaper, label: 'Notícias' },
    { href: '/admin', icon: Settings, label: 'Admin', adminRequired: true }
  ];

  const getVisibleNavItems = () => {
    return navItems.filter(item => {
      // Hide admin items if not admin
      if (item.adminRequired && !profile?.is_admin) return false;
      // Hide Transactions and Wallet from desktop menu (keep in mobile)
      if (!isMobile && (item.href === '/transactions' || item.href === '/wallet')) return false;
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
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/95 overflow-x-hidden">
        <div className="container mx-auto px-4 py-3 min-w-0">
        <div className="flex items-center justify-between min-w-0">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden mr-2 hover:bg-muted/20">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-background dark:bg-background border-border p-0">
                <SheetHeader className="border-b border-border px-6 py-4">
                  <div className="text-left">
                    <img 
                      src={resolvedTheme === 'light' ? logoImageBlack : logoImageWhite} 
                      alt="Rio Markets" 
                      className="h-8 w-auto" 
                    />
                  </div>
                </SheetHeader>
                
                <div className="flex flex-col px-6 py-4 space-y-1">
                      {/* User Info Section */}
                  {isLoggedIn && profile && (
                    <div className="border-b border-border pb-4 mb-4">
                      <div 
                        className="relative overflow-hidden rounded-xl cursor-pointer group"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/profile');
                        }}
                      >
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent animate-shimmer" />
                        
                        {/* Content */}
                        <div className="relative p-4 flex items-center gap-3">
                          <Avatar className="h-14 w-14 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                            {profile.profile_pic_url ? (
                              <img 
                                src={profile.profile_pic_url} 
                                alt={profile.nome || 'Usuário'} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg font-bold">
                                {profile.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-base font-bold text-foreground">{profile.nome || 'Usuário'}</p>
                            <p className="text-xs text-muted-foreground capitalize font-medium">{profile.nivel || 'iniciante'}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
                                <span className="text-xs text-primary font-bold">
                                  {profile.saldo_moeda >= 1000 
                                    ? Math.floor(profile.saldo_moeda).toLocaleString('pt-BR') 
                                    : (profile.saldo_moeda || 0).toLocaleString('pt-BR')
                                  } RZ
                                </span>
                              </div>
                            </div>
                          </div>
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
                            className="w-full justify-start gap-3 h-12 text-muted-foreground hover:text-foreground hover:bg-muted/10 opacity-60 transition-all duration-200"
                          >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                            <span className="text-xs ml-auto bg-primary/20 px-2 py-1 rounded">Login</span>
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
                          className={`w-full justify-start gap-3 h-12 transition-all duration-200 group ${
                             isActive 
                               ? (item.href === '/fast' 
                                   ? 'bg-[#ff2389]/10 text-[#ff2389] hover:bg-[#ff2389]/20 border border-[#ff2389]/20' 
                                   : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20')
                               : 'text-foreground/80 hover:text-foreground hover:bg-muted/10'
                           } ${item.special === 'pulse' && !isActive ? 'hover:bg-[#ff2389]/10' : ''}`}
                         >
                           <item.icon className={`w-5 h-5 transition-all duration-200 group-hover:scale-110 ${
                             isActive && item.href === '/fast' 
                               ? 'text-[#ff2389]' 
                               : item.special === 'pulse' && isActive 
                                 ? 'text-primary' 
                                 : item.special === 'pulse' 
                                   ? 'text-[#ff2389] animate-[pulse_1s_ease-in-out_infinite]' 
                                   : ''
                           }`} />
                           <span className={`transition-all duration-200 ${
                             isActive && item.href === '/fast' 
                               ? 'text-[#ff2389] font-medium' 
                               : item.special === 'pulse' && isActive 
                                 ? 'text-primary font-medium' 
                                 : item.special === 'pulse' 
                                   ? 'text-[#ff2389] animate-[pulse_1s_ease-in-out_infinite] font-medium' 
                                   : ''
                           }`}>
                             {item.label}
                           </span>
                         </Button>
                      </Link>
                    );
                  })}
                  
                   {/* Auth Actions */}
                  {isLoggedIn ? (
                    <div className="border-t border-border pt-4 mt-4">
                      <Button 
                        onClick={async () => {
                          await signOut();
                          handleMobileNavClick();
                          navigate('/auth');
                        }}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 text-white hover:text-white/80 hover:bg-muted/20"
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

          {/* Logo - Mobile (always visible, centered when logged in) */}
          {isMobile && (
            <div className={cn("flex items-center relative", isLoggedIn ? "flex-1 justify-center" : "flex-1")}>
              <Link to="/">
                <div className="relative h-8 min-w-[120px]">
                  <img 
                    src={logoImageWhite}
                    alt="Rio Markets" 
                    className="absolute h-8 w-auto object-contain transition-opacity duration-300" 
                    style={{ opacity: resolvedTheme === 'light' ? 0 : 1 }}
                  />
                  <img 
                    src={logoImageBlack}
                    alt="Rio Markets" 
                    className="absolute h-8 w-auto object-contain transition-opacity duration-300" 
                    style={{ opacity: resolvedTheme === 'light' ? 1 : 0 }}
                  />
                </div>
              </Link>
            </div>
          )}
          
          {/* Desktop Logo */}
          <div className="hidden md:flex items-center mr-6 relative">
            <Link to="/">
              <div className="relative h-8 min-w-[140px]">
                <img 
                  src={logoImageWhite}
                  alt="Rio Markets" 
                  className="absolute h-8 w-auto object-contain transition-opacity duration-300" 
                  style={{ opacity: resolvedTheme === 'light' ? 0 : 1 }}
                />
                <img 
                  src={logoImageBlack}
                  alt="Rio Markets" 
                  className="absolute h-8 w-auto object-contain transition-opacity duration-300" 
                  style={{ opacity: resolvedTheme === 'light' ? 1 : 0 }}
                />
              </div>
            </Link>
          </div>

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
                        ? (item.href === '/fast' 
                            ? (resolvedTheme === 'light' ? 'bg-[#FFDFEC] text-gray-800 hover:bg-[#FFDFEC]/90' : 'bg-[#32162C] text-white hover:bg-[#32162C]/90')
                            : 'bg-primary text-primary-foreground hover:bg-primary/90')
                        : 'text-foreground/80 hover:text-foreground'
                    } ${item.special === 'pulse' ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 ${item.special === 'pulse' ? 'text-[#ff2389]' : ''}`} />
                    <span className={item.special === 'pulse' ? 'text-[#ff2389]' : ''}>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            {isMobile && isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/deposit')}
                  className="gap-2 shadow-success rounded-xl bg-[#00FF91] text-black hover:bg-[#00FF91]/90"
                >
                  <Plus className="w-4 h-4" />
                  Depositar
                </Button>
                
                {/* Dark Mode Toggle */}
                <DarkModeToggle />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary rounded-full p-2 overflow-hidden"
                    >
                      <UserCircle className="w-6 h-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')}>
                      <Wallet className="mr-2 h-4 w-4" />
                      Carteira
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/transactions')}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Transações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/support')}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Suporte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-white hover:text-white/80">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : isMobile && !isLoggedIn ? (
              <Link to="/auth">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            ) : isLoggedIn ? (
              <>
                {/* Wallet Balance - Desktop only */}
                <div className="relative overflow-visible hidden md:block">
                  <Link to="/wallet">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-2 bg-primary/10 border border-primary/30 text-primary rounded-xl hover:bg-primary/10"
                    >
                      <Wallet className="w-4 h-4" />
                      {profile?.saldo_moeda >= 1000 
                        ? Math.floor(profile.saldo_moeda).toLocaleString('pt-BR') 
                        : (profile?.saldo_moeda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      } RZ
                    </Button>
                  </Link>
                  
                  {/* Winner Balance Animation for Fast Markets */}
                  {location.pathname === '/fast' && (
                    <div id="fast-winner-animation-target" className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                      <style>{`
                        @keyframes fadeInUp {
                          0% {
                            opacity: 0;
                            transform: translateY(10px);
                          }
                          50% {
                            opacity: 1;
                            transform: translateY(-20px);
                          }
                          100% {
                            opacity: 0;
                            transform: translateY(-40px);
                          }
                        }
                        .win-animation {
                          animation: fadeInUp 2s ease-out forwards;
                          font-size: 1.5rem;
                          font-weight: bold;
                          color: #00ff90;
                          text-shadow: 0 0 10px rgba(0, 255, 144, 0.5);
                        }
                      `}</style>
                    </div>
                  )}
                </div>
                
                 {/* Deposit Button */}
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/deposit')}
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
                       className="gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary rounded-full p-2 overflow-hidden"
                     >
                       <UserCircle className="w-6 h-6" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-48">
                   <DropdownMenuItem asChild className="cursor-pointer focus:bg-transparent">
                     <Link to="/profile" className="flex items-center gap-2">
                       <User className="w-4 h-4" />
                       Meu Perfil
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem asChild className="cursor-pointer focus:bg-transparent">
                     <Link to="/transactions" className="flex items-center gap-2">
                       <Receipt className="w-4 h-4" />
                       Transações
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                     <DropdownMenuItem 
                       onClick={async () => {
                         try {
                           await signOut();
                           navigate('/auth');
                         } catch (error) {
                           console.error('Erro ao fazer logout:', error);
                         }
                       }}
                       className="flex items-center gap-2 text-white hover:text-white cursor-pointer focus:bg-transparent"
                     >
                       <LogOut className="w-4 h-4 text-white" />
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
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;