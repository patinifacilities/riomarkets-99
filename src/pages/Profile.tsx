import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  CreditCard, 
  Shield, 
  LogOut, 
  Edit, 
  Save, 
  X, 
  ArrowLeft
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data: profile, isLoading, refetch } = useProfile(user?.id);
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    profile_pic_url: ''
  });

  useEffect(() => {
    // Don't redirect if we're still loading authentication state
    if (isLoading) return;
    
    // Only redirect if we're certain user is not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate, isLoading]);

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        username: profile.username || '',
        profile_pic_url: profile.profile_pic_url || ''
      });
    }
  }, [profile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        username: profile.username || '',
        profile_pic_url: profile.profile_pic_url || ''
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading2(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          username: formData.username,
          profile_pic_url: formData.profile_pic_url
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading2(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user?.email || '',
        { redirectTo: `${window.location.origin}/auth` }
      );

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email de redefinição.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Perfil não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={profile.profile_pic_url} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-semibold mb-2">{profile.nome || 'Usuário'}</h2>
                <Badge variant="secondary" className="mb-4 capitalize">
                  {profile.nivel}
                </Badge>
                
                <div className="bg-gradient-primary p-4 rounded-lg text-primary-foreground">
                  <div className="text-sm opacity-90">Saldo</div>
                  <div className="text-2xl font-bold">
                    {profile.saldo_moeda.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} RZ
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading2}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Opcional"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="profile_pic">URL da foto de perfil</Label>
                  <Input
                    id="profile_pic"
                    value={formData.profile_pic_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_pic_url: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="mt-1"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{profile.email}</span>
                    </div>
                  </div>
                  
                  {profile.cpf && (
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{profile.cpf}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Senha</h4>
                    <p className="text-sm text-muted-foreground">
                      Altere sua senha regularmente para manter sua conta segura
                    </p>
                  </div>
                  <Button variant="outline" onClick={handlePasswordChange}>
                    Alterar senha
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Autenticação de dois fatores</h4>
                    <p className="text-sm text-muted-foreground">
                      Em breve disponível
                    </p>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/wallet')}
                    className="flex-1"
                  >
                    Ver Carteira
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                    className="flex-1"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;