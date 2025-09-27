import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import MarketDetail from "./pages/MarketDetail";
import Wallet from "./pages/Wallet";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { RewardCalculatorModal } from "@/components/calculator/RewardCalculatorModal";

// Lazy load secondary routes
const Ranking = lazy(() => import("./pages/Ranking"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const MarketAudit = lazy(() => import("./pages/MarketAudit"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Press = lazy(() => import("./pages/Press"));
const Exchange = lazy(() => import("./pages/Exchange"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="market/:id" element={<MarketDetail />} />
              <Route path="wallet" element={<Wallet />} />
              <Route 
                path="exchange" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <Exchange />
                  </Suspense>
                } 
              />
              <Route
                path="transactions" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <Transactions />
                  </Suspense>
                } 
              />
              <Route 
                path="ranking" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <Ranking />
                  </Suspense>
                } 
              />
              <Route 
                path="profile/:userId" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <Profile />
                  </Suspense>
                } 
              />
              <Route 
                path="admin" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <Admin />
                  </Suspense>
                } 
              />
              <Route 
                path="admin/users" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <AdminUsers />
                  </Suspense>
                } 
              />
              <Route 
                path="admin/categories" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <AdminCategories />
                  </Suspense>
                } 
              />
              <Route 
                path="audit/:id" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <MarketAudit />
                  </Suspense>
                } 
              />
              <Route 
                path="press" 
                element={
                  <Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <Press />
                  </Suspense>
                } 
              />
            </Route>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Global modals */}
          <RewardCalculatorModal />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
