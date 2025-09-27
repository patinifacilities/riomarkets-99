import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import Wallet from '@/pages/Wallet';
import Exchange from '@/pages/Exchange';
import Transactions from '@/pages/Transactions';
import Ranking from '@/pages/Ranking';
import Press from '@/pages/Press';
import Support from '@/pages/Support';
import MarketDetail from '@/pages/MarketDetail';
import MarketAudit from '@/pages/MarketAudit';
import Admin from '@/pages/Admin';
import AdminCategories from '@/pages/AdminCategories';
import AdminUsers from '@/pages/AdminUsers';
import AdminReconciliation from '@/pages/AdminReconciliation';
import FiatRequests from '@/pages/FiatRequests';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import { track } from '@/lib/analytics';
import { RewardCalculatorModal } from '@/components/calculator/RewardCalculatorModal';

function App() {
  useEffect(() => {
    // Typewriter animation
    const words = ['Inteligentes', 'Lucrativos', 'Rápidos'];
    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;
    const deleteSpeed = 50;
    const pauseTime = 2000;

    const typewriterElement = document.getElementById('typewriter-text');
    
    function type() {
      if (!typewriterElement) return;

      const currentWord = words[currentWordIndex];
      
      if (isDeleting) {
        typewriterElement.textContent = currentWord.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typeSpeed = deleteSpeed;
      } else {
        typewriterElement.textContent = currentWord.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typeSpeed = 100;
      }

      if (!isDeleting && currentCharIndex === currentWord.length) {
        isDeleting = true;
        typeSpeed = pauseTime;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentWordIndex = (currentWordIndex + 1) % words.length;
      }

      setTimeout(type, typeSpeed);
    }

    // Start the animation
    setTimeout(type, 1000);

    // Track page view
    track('app_initialized');
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/press" element={<Press />} />
          <Route path="/support" element={<Support />} />
          <Route path="/market/:id" element={<MarketDetail />} />
          <Route path="/market/:id/audit" element={<MarketAudit />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reconciliation" element={<AdminReconciliation />} />
          <Route path="/admin/fiat-requests" element={<FiatRequests />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster />
      <RewardCalculatorModal />
    </Router>
  );
}

export default App;