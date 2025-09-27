import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, TrendingUp, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Primeiro, verifica se já tem uma sessão ativa
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        console.log('Initial session check:', session ? 'Session exists' : 'No session');
        
        if (session?.user) {
          // Se já está logado e tentando acessar /auth, redireciona
          console.log('User already logged in, redirecting...');
          navigate('/', { replace: true });
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking initial session:', error);
      }
    };
    
    checkInitialSession();
    
    // Depois configura o listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Se o usuário fez login com sucesso, redireciona para home
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Sign in successful, redirecting to home...');
          // Usa um timeout para garantir que o estado foi atualizado
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 200);
        }
        
        // Se o usuário fez logout, garante que está na página de auth
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Não redireciona se já estiver na página de auth
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignUp = async () => {
    console.log('Attempting sign up...');
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: formData.name
        }
      }
    });
    
    console.log('Sign up result:', error ? 'Error' : 'Success', error);
    return { error };
  };

  const handleSignIn = async () => {
    console.log('Attempting sign in...');
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });
    
    console.log('Sign in result:', error ? 'Error' : 'Success', error);
    return { error };
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setError('Erro ao enviar email de recuperação');
      return;
    }

    toast({
      title: "Email enviado!",
      description: "Verifique seu email para redefinir sua senha.",
    });
    
    setShowForgotPassword(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.name) {
      setError('Nome é obrigatório para cadastro');
      setLoading(false);
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting form:', isLogin ? 'Login' : 'Sign up');
      const { error } = isLogin ? await handleSignIn() : await handleSignUp();

      if (error) {
        console.error('Auth error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('User already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Verifique seu email para confirmar a conta');
        } else {
          setError(error.message);
        }
        return;
      }

      console.log('Auth successful!');
      
      if (!isLogin) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
        // Clear form for signup
        setFormData({ email: '', password: '', name: '' });
      } else {
        // Para login, não redirecionar aqui - deixar o auth state change fazer isso
        toast({
          title: "Login realizado!",
          description: "Redirecionando...",
        });
        // Não limpar o form ainda - será limpo após o redirect
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Rio Markets</h1>
          </div>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Entre ou cadastre-se para começar suas análises no maior mercado de previsões do Rio
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-2 block">Nome completo</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
                      aria-label="Digite seu nome completo"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    aria-label="Digite seu endereço de email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium mb-2 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    aria-label="Digite sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline focus:outline-none focus:underline"
                    aria-label="Esqueceu sua senha?"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-start space-x-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    aria-describedby="terms-description"
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Aceito os Termos de Uso e Política de Privacidade
                    </label>
                    <p id="terms-description" className="text-xs text-muted-foreground">
                      Ao se cadastrar, você concorda com nossos{' '}
                      <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                      {' '}e{' '}
                      <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {showForgotPassword && (
                <div className="p-4 rounded-lg border border-muted bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Recuperar senha</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Digite seu email acima e clique em "Enviar" para receber o link de recuperação
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      aria-label="Enviar email de recuperação de senha"
                    >
                      Enviar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForgotPassword(false)}
                      aria-label="Cancelar recuperação de senha"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full shadow-success min-h-[44px]"
                disabled={loading}
                aria-label={isLogin ? "Entrar na sua conta" : "Criar nova conta"}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {isLogin ? 'Entrar' : 'Criar conta'}
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ email: '', password: '', name: '' });
                  setAcceptedTerms(false);
                  setShowForgotPassword(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Após criar sua conta, você receberá 1000 Rioz Coin para começar suas análises!</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;