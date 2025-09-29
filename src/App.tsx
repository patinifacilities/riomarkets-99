import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import ProfilePage from '@/pages/Profile';
import WalletPage from '@/pages/Wallet';
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
import AdminRevenue from '@/pages/AdminRevenue';
import AdminPayouts from '@/pages/AdminPayouts';
import AdminDeposits from '@/pages/AdminDeposits';
import AdminGateways from '@/pages/AdminGateways';
import AdminLogs from '@/pages/AdminLogs';
import AdminNews from '@/pages/AdminNews';
import AdminMarkets from '@/pages/AdminMarkets';
import AdminGatewayConfig from '@/pages/AdminGatewayConfig';
import AdminGatewayConfigPix from '@/pages/AdminGatewayConfigPix';
import AdminGatewayConfigStripe from '@/pages/AdminGatewayConfigStripe';
import AdminGatewayConfigCrypto from '@/pages/AdminGatewayConfigCrypto';
import AdminGatewaysSaque from '@/pages/AdminGatewaysSaque';
import Opinioes from '@/pages/Opinioes';
import FiatRequests from '@/pages/FiatRequests';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import { track } from '@/lib/analytics';
import { RewardCalculatorModal } from '@/components/calculator/RewardCalculatorModal';

function App() {
  useEffect(() => {
    // Track page view
    track('app_initialized');
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/press" element={<Press />} />
          <Route path="/support" element={<Support />} />
          <Route path="/market/:id" element={<MarketDetail />} />
          <Route path="/market/:id/audit" element={<MarketAudit />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reconciliation" element={<AdminReconciliation />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
            <Route path="/admin/payouts" element={<AdminPayouts />} />
            <Route path="/admin/deposits" element={<AdminDeposits />} />
            <Route path="/admin/gateways" element={<AdminGateways />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/news" element={<AdminNews />} />
            <Route path="/admin/markets" element={<AdminMarkets />} />
            <Route path="/admin/gateway-config/:gatewayId" element={<AdminGatewayConfig />} />
            <Route path="/admin/gateways-saque" element={<AdminGatewaysSaque />} />
          <Route path="/opinioes" element={<Opinioes />} />
          <Route path="/fiat-requests" element={<FiatRequests />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster />
      <RewardCalculatorModal />
    </Router>
  );
}

export default App;