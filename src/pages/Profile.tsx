import { useState } from 'react';
import { User, Mail, Phone, CreditCard, Shield, Key, LogOut, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    email: profile?.email || '',
    telefone: '',
    cpf: '000.000.000-00'
  });

  const handleSave = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Alterar senha",
      description: "Um link para alterar sua senha foi enviado para seu email.",
    });
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso negado</h1>
          <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Perfil do Usuário</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>

        {/* Profile Picture & Basic Info */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">{profile.nome}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                    {profile.nivel}
                  </span>
                  {profile.is_admin && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  CPF não pode ser alterado por motivos de segurança
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} className="flex-1">
                      Salvar alterações
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Editar informações
                  </Button>
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
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Alterar senha</p>
                    <p className="text-sm text-muted-foreground">
                      Última alteração há 30 dias
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleChangePassword}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Autenticação 2FA</p>
                    <p className="text-sm text-muted-foreground">
                      Proteja sua conta com verificação em duas etapas
                    </p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              <Separator />

              {/* Account Balance */}
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <p className="font-medium">Saldo da conta</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {profile.saldo_moeda.toLocaleString()} RZ
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ R$ {(profile.saldo_moeda * 0.1).toFixed(2)}
                </p>
              </div>

              <Separator />

              {/* Logout */}
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Deslogar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;