import { useEffect, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import ProfilePage from '@/pages/Profile';
import WalletPage from '@/pages/Wallet';
import Withdraw from '@/pages/Withdraw';
import Exchange from '@/pages/Exchange';
import Fast from '@/pages/Fast';
import CardPayment from '@/pages/CardPayment';
import Deposit from '@/pages/Deposit';
import Transactions from '@/pages/Transactions';
import Ranking from '@/pages/Ranking';
import Press from '@/pages/Press';
import Support from '@/pages/Support';
import MarketDetail from '@/pages/MarketDetail';
import MarketAudit from '@/pages/MarketAudit';
import AssetDetail from '@/pages/AssetDetail';
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
import AdminNewsSources from '@/pages/AdminNewsSources';
import AdminMarkets from '@/pages/AdminMarkets';
import AdminFast from '@/pages/AdminFast';
import AdminFastPoolConfig from '@/pages/AdminFastPoolConfig';
import AdminFastApiConfig from '@/pages/AdminFastApiConfig';
import AdminAlgorithm from '@/pages/AdminAlgorithm';
import AdminGatewayConfig from '@/pages/AdminGatewayConfig';
import AdminGatewayConfigPix from '@/pages/AdminGatewayConfigPix';
import AdminGatewayConfigStripe from '@/pages/AdminGatewayConfigStripe';
import AdminGatewayConfigCrypto from '@/pages/AdminGatewayConfigCrypto';
import AdminGatewaysSaque from '@/pages/AdminGatewaysSaque';
import AdminSlider from '@/pages/AdminSlider';
import AdminBranding from '@/pages/AdminBranding';
import AdminExchange from '@/pages/AdminExchange';
import AdminRaffles from '@/pages/AdminRaffles';
import Raffles from '@/pages/Raffles';
import Opinioes from '@/pages/Opinioes';
import FiatRequests from '@/pages/FiatRequests';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import FAQ from '@/pages/FAQ';
import Cookies from '@/pages/Cookies';
import Rewards from '@/pages/Rewards';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/sonner';
import { track } from '@/lib/analytics';
import { RewardCalculatorModal } from '@/components/calculator/RewardCalculatorModal';
import { useBranding } from '@/hooks/useBranding';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

const AdminRewards = lazy(() => import('@/pages/AdminRewards'));

function App() {
  // Initialize branding theme
  useBranding();
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // Track page view
    track('app_initialized');

    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      {showLoading && <LoadingScreen />}
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/fast" element={<Fast />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/card-payment" element={<CardPayment />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/press" element={<Press />} />
          <Route path="/support" element={<Support />} />
          <Route path="/market/:id" element={<MarketDetail />} />
          <Route path="/market/:id/audit" element={<MarketAudit />} />
          <Route path="/asset/:assetSymbol" element={<AssetDetail />} />
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
            <Route path="/admin/news/sources" element={<AdminNewsSources />} />
            <Route path="/admin/markets" element={<AdminMarkets />} />
            <Route path="/admin/fast" element={<AdminFast />} />
            <Route path="/admin/fast/pool/:assetId/config" element={<AdminFastPoolConfig />} />
            <Route path="/admin/fast/api-config" element={<AdminFastApiConfig />} />
            <Route path="/admin/fast/algorithm" element={<AdminAlgorithm />} />
            <Route path="/admin/gateway-config/:gatewayId" element={<AdminGatewayConfig />} />
            <Route path="/admin/gateways-saque" element={<AdminGatewaysSaque />} />
            <Route path="/admin/rewards" element={<AdminRewards />} />
            <Route path="/admin/slider" element={<AdminSlider />} />
            <Route path="/admin/branding" element={<AdminBranding />} />
            <Route path="/admin/exchange" element={<AdminExchange />} />
            <Route path="/admin/raffles" element={<AdminRaffles />} />
          <Route path="/opinioes" element={<Opinioes />} />
          <Route path="/raffles" element={<Raffles />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/fiat-requests" element={<FiatRequests />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster />
      <RewardCalculatorModal />
    </Router>
  );
}

export default App;