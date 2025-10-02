import { ArrowLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { NewsManagement } from '@/components/admin/NewsManagement';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useState } from 'react';

const AdminNews = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security check
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Gerenciar Notícias</h1>
              <p className="text-muted-foreground">
                Gerenciar menções na imprensa e notícias da plataforma
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              ADMIN
            </Badge>
          </div>

          <NewsManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminNews;