import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, TrendingUp, KeyRound } from 'lucide-react';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
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
    
    // Quando acessar /auth, sempre deslogar primeiro para garantir que pode fazer login
    const handleInitialAuth = async () => {
      try {
        // Sempre fazer logout primeiro quando acessar /auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('User is logged in, logging out to access auth page...');
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Error handling initial auth:', error);
      }
    };
    
    handleInitialAuth();
    
    // Configura o listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Se o usuário fez login com sucesso, redireciona para home
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Login successful, redirecting to home...');
          navigate('/', { replace: true });
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
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name
        }
      }
    });
    
    console.log('Sign up result:', error ? 'Error' : 'Success', error);
    
    // If signup successful and user is immediately confirmed, log them in
    if (!error && data.user && !data.user.email_confirmed_at) {
      // User needs email confirmation
      return { error: null, needsConfirmation: true };
    } else if (!error && data.user && data.user.email_confirmed_at) {
      // User is automatically logged in
      return { error: null, needsConfirmation: false };
    }
    
    return { error, needsConfirmation: false };
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
      
      if (isLogin) {
        const { error } = await handleSignIn();
        if (error) {
          console.error('Auth error:', error);
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Verifique seu email para confirmar a conta');
          } else {
            setError(error.message);
          }
          return;
        }
        
        toast({
          title: "Login realizado!",
          description: "Redirecionando...",
        });
      } else {
        const { error, needsConfirmation } = await handleSignUp();
        if (error) {
          console.error('Auth error:', error);
          if (error.message.includes('User already registered')) {
            setError('Este email já está cadastrado. Tente fazer login.');
          } else {
            setError(error.message);
          }
          return;
        }
        
        if (needsConfirmation) {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta.",
          });
          setFormData({ email: '', password: '', name: '' });
        } else {
          toast({
            title: "Conta criada e login realizado!",
            description: "Bem-vindo ao Rio Markets!",
          });
          // User will be automatically redirected by auth state change
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src={resolvedTheme === 'dark' 
                ? new URL('../assets/rio-white-logo-new.png', import.meta.url).href
                : "/assets/rio-black-logo.png"}
              alt="Rio Markets Logo" 
              className="h-20 md:h-20 h-10 w-auto mx-auto mb-4 cursor-pointer"
              onClick={() => navigate('/')}
            />
            <div className="text-2xl font-bold text-foreground">
              Mercados Preditivos
            </div>
            <div style={{ color: '#00ff90' }}>
              <TypewriterText
                baseText=""
                texts={[
                  "para Análise Estratégica",
                  "baseados em Dados",
                  "com Transparência Total"
                ]}
                className="text-2xl font-bold"
                typingSpeed={100}
                deletingSpeed={50}
                pauseDuration={2000}
              />
            </div>
          </div>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Entre ou cadastre-se para começar suas análises no maior mercado de previsões do Brasil
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

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  className="min-h-[44px] bg-white text-black border border-gray-300 hover:bg-gray-50"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/`
                        }
                      });
                      if (error) throw error;
                    } catch (error) {
                      console.error('Google auth error:', error);
                      setError('Erro ao conectar com Google');
                    }
                  }}
                  disabled={loading}
                  aria-label="Entrar com Google"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                
                <Button
                  type="button"
                  className="min-h-[44px] bg-black text-white border border-gray-600 hover:bg-gray-800"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'apple',
                        options: {
                          redirectTo: `${window.location.origin}/`
                        }
                      });
                      if (error) throw error;
                    } catch (error) {
                      console.error('Apple auth error:', error);
                      setError('Erro ao conectar com Apple');
                    }
                  }}
                  disabled={loading}
                  aria-label="Entrar com Apple"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="white">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
                    <path d="M15.53 3.83c.893-1.09 1.477-2.602 1.329-4.14-1.297.055-2.897.863-3.844 1.959-.832.962-1.55 2.435-1.364 3.868 1.454.104 2.96-.755 3.879-1.687z"/>
                  </svg>
                  Apple
                </Button>
              </div>
            </div>

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
          <p>Após criar sua conta, você receberá 10 Rioz Coin para começar suas análises!</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;