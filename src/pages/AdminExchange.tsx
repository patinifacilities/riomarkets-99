import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExchangeAsset {
  id: string;
  symbol: string;
  name: string;
  icon_url: string | null;
  is_active: boolean;
}

interface ExchangeOrder {
  id: string;
  user_id: string;
  side: string;
  price_brl_per_rioz: number;
  amount_rioz: number;
  amount_brl: number;
  created_at: string;
  profiles: {
    nome: string;
    email: string;
  };
}

const AdminExchange = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<ExchangeAsset[]>([]);
  const [orders, setOrders] = useState<ExchangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchOrders();
    }
  }, [user]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_assets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_orders')
        .select('*')
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch user data separately
      const ordersWithProfiles = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome, email')
            .eq('id', order.user_id)
            .single();
          
          return {
            ...order,
            profiles: profileData || { nome: 'N/A', email: 'N/A' }
          };
        })
      );
      
      setOrders(ordersWithProfiles as ExchangeOrder[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleToggleActive = async (assetId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exchange_assets')
        .update({ is_active: !currentStatus })
        .eq('id', assetId);

      if (error) throw error;

      setAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, is_active: !currentStatus } : asset
      ));

      toast({
        title: 'Sucesso!',
        description: `Ativo ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error toggling asset:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do ativo.',
        variant: 'destructive',
      });
    }
  };

  const handleIconUpload = async (file: File, assetId: string) => {
    setUploading(prev => ({ ...prev, [assetId]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `asset_${assetId}_${Date.now()}.${fileExt}`;
      const filePath = `exchange-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('exchange_assets')
        .update({ icon_url: publicUrl })
        .eq('id', assetId);

      if (error) throw error;

      setAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, icon_url: publicUrl } : asset
      ));

      toast({
        title: 'Sucesso!',
        description: 'Ícone atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload do ícone.',
        variant: 'destructive',
      });
    } finally {
      setUploading(prev => ({ ...prev, [assetId]: false }));
    }
  };

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
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <h1 className="text-3xl font-bold mb-2">Exchange Admin</h1>
            <p className="text-muted-foreground">
              Gerencie ativos e visualize histórico de conversões
            </p>
          </div>

          {/* Assets Management */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gerenciar Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {asset.icon_url ? (
                        <img src={asset.icon_url} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold">{asset.symbol[0]}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`icon-${asset.id}`} className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-muted transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">
                            {uploading[asset.id] ? 'Enviando...' : 'Ícone'}
                          </span>
                        </div>
                      </Label>
                      <Input
                        id={`icon-${asset.id}`}
                        type="file"
                        accept="image/png,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIconUpload(file, asset.id);
                        }}
                        disabled={uploading[asset.id]}
                      />

                      <Button
                        variant={asset.is_active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleActive(asset.id, asset.is_active)}
                        className="gap-2"
                      >
                        {asset.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inativo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Conversões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Quantidade RIOZ</TableHead>
                      <TableHead>Valor BRL</TableHead>
                      <TableHead>Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{order.profiles?.nome || 'N/A'}</TableCell>
                        <TableCell>{order.profiles?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.side === 'buy_rioz' 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {order.side === 'buy_rioz' ? 'Compra RIOZ' : 'Venda RIOZ'}
                          </span>
                        </TableCell>
                        <TableCell>{order.amount_rioz.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>R$ {order.amount_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>R$ 1,00 / RIOZ</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma conversão registrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminExchange;
