import { useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import { Footer } from './Footer';
import { RianaChat } from '@/components/chat/RianaChat';
import { ComplianceBanner } from '@/components/compliance/ComplianceBanner';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/stores/useOnboarding';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { openOnFirstVisit, setMounted } = useOnboarding();
  const isMobile = useIsMobile();
  
  const isAuthPage = location.pathname === '/auth';
  const shouldHideHeaderFooter = isAuthPage; // Hide on Auth page for both mobile and desktop
  const shouldHideFooter = shouldHideHeaderFooter; // Only hide footer on auth page

  // Initialize onboarding after hydration
  useEffect(() => {
    setMounted(true);
    
    // Only trigger onboarding if user is authenticated and on home page
    if (location.pathname === '/' && !loading && user) {
      const timer = setTimeout(() => {
        openOnFirstVisit();
      }, 1000); // Small delay to let the page settle
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, loading, user, openOnFirstVisit, setMounted]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if admin route requires admin access
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute && (!user || !profile?.is_admin)) {
    return <Navigate to="/auth" replace />;
  }

  // Check if protected routes require authentication
  const protectedRoutes = ['/wallet'];
  const isProtectedRoute = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {!shouldHideHeaderFooter && <Header />}
      <main className={`flex-1 min-h-0 ${isMobile ? 'pb-16' : ''}`}>
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
      {!shouldHideHeaderFooter && <ComplianceBanner variant="sticky" />}
      {!shouldHideHeaderFooter && <OnboardingModal />}
      {!shouldHideHeaderFooter && <RianaChat />}
      {isMobile && !shouldHideHeaderFooter && <BottomNavigation />}
    </div>
  );
};

export default Layout;