import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, TrendingUp, KeyRound, Check, X, CreditCard, User as UserIcon } from 'lucide-react';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnboarding } from '@/stores/useOnboarding';
import { validateCPF, formatCPF, validatePassword, validateUsername } from '@/utils/validation';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const { openOnFirstVisit } = useOnboarding();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    username: '',
    cpf: ''
  });
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [cpfError, setCpfError] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  
  const totalSteps = 5; // Total registration steps

  useEffect(() => {
    let mounted = true;
    
    // Check initial auth state without forcing logout
    const handleInitialAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setUser(session?.user || null);
        setSession(session);
        setIsLoading(false);
        
        // If user is already logged in and accessing auth page, redirect to home
        if (session?.user) {
          console.log('User already logged in, redirecting to home...');
          navigate('/', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking initial auth:', error);
        setIsLoading(false);
      }
    };
    
    handleInitialAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user ? 'User logged in' : 'No user');
        
        // If user successfully signed in, redirect to home and trigger onboarding
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Login successful, redirecting to home...');
          navigate('/', { replace: true });
          // Trigger onboarding after navigation
          setTimeout(() => {
            openOnFirstVisit();
          }, 500);
        }
        
        // Handle sign out - stay on auth page
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Clear any existing state
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, openOnFirstVisit]);

  // Update password requirements in real-time
  useEffect(() => {
    if (formData.password) {
      setPasswordRequirements(validatePassword(formData.password));
    }
  }, [formData.password]);

  // Validate CPF on change
  useEffect(() => {
    if (formData.cpf.length === 11) {
      setCpfError(!validateCPF(formData.cpf));
    } else if (formData.cpf.length > 0) {
      setCpfError(false);
    }
  }, [formData.cpf]);

  // Check password mismatch
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordMismatch(formData.password !== formData.confirmPassword);
    } else {
      setPasswordMismatch(false);
    }
  }, [formData.password, formData.confirmPassword]);

  // Validate uniqueness
  const checkUniqueness = async (field: 'email' | 'username' | 'cpf', value: string) => {
    if (!value) return true;
    
    try {
      if (field === 'email') {
        const { data } = await supabase.from('profiles').select('id').eq('email', value).single();
        return !data;
      } else if (field === 'username') {
        const { data } = await supabase.from('profiles').select('id').eq('username', value).single();
        return !data;
      } else if (field === 'cpf') {
        const { data } = await supabase.from('profiles').select('id').eq('cpf', value).single();
        return !data;
      }
    } catch (error) {
      return true; // If error checking, allow to proceed
    }
    return true;
  };

  const handleSignUp = async () => {
    console.log('Attempting sign up...');
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          username: formData.username,
          cpf: formData.cpf
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

    if (!isLogin && !formData.username) {
      setError('Username é obrigatório para cadastro');
      setLoading(false);
      return;
    }

    if (!isLogin && !validateUsername(formData.username)) {
      setError('Username deve ter 3-20 caracteres alfanuméricos ou underscore');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.cpf) {
      setError('CPF é obrigatório');
      setLoading(false);
      return;
    }

    if (!isLogin && !validateCPF(formData.cpf)) {
      setError('CPF inválido');
      setLoading(false);
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!isLogin && !Object.values(passwordValidation).every(Boolean)) {
      setError('A senha não atende aos requisitos de segurança');
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
          setFormData({ email: '', password: '', confirmPassword: '', name: '', username: '', cpf: '' });
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
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src={resolvedTheme === 'dark' 
                  ? new URL('../assets/rio-white-logo-new.png', import.meta.url).href
                  : "/assets/rio-black-logo.png"}
                alt="Rio Markets Logo" 
                className="w-auto mx-auto mb-4 cursor-pointer"
                style={{ 
                  height: isMobile ? '40px' : '80px'
                }}
                onClick={() => navigate('/')}
              />
              <div className="text-2xl font-bold text-foreground">
                Mercados Preditivos
              </div>
              <div>
                <TypewriterText
                  baseText=""
                  texts={[
                    "para Análise Estratégica",
                    "baseados em Dados",
                    "com Transparência Total",
                    "Rápidos"
                  ]}
                  customColors={{
                    "Rápidos": "#ff2389"
                  }}
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
              {!isLogin && (
                <div className="mb-4">
                  <Progress value={(currentStep + 1) / totalSteps * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Passo {currentStep + 1} de {totalSteps}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin ? (
                  <>
                    {/* Step 1: Name */}
                    {currentStep === 0 && (
                      <div className="space-y-4">
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
                              autoFocus
                            />
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={() => {
                            if (formData.name) setCurrentStep(1);
                            else setError('Nome é obrigatório');
                          }}
                        >
                          Continuar
                        </Button>
                      </div>
                    )}

                    {/* Step 2: Username */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="username" className="text-sm font-medium mb-2 block">Username</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground font-medium">@</span>
                            <Input
                              id="username"
                              type="text"
                              placeholder="username"
                              value={formData.username}
                              onChange={(e) => {
                                const value = e.target.value.replace(/^@/, '');
                                setFormData(prev => ({ ...prev, username: value }));
                              }}
                              className="pl-7"
                              aria-label="Digite seu username"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(0)}>
                            Voltar
                          </Button>
                          <Button 
                            type="button" 
                            className="w-full" 
                            onClick={async () => {
                              if (!formData.username) {
                                setError('Username é obrigatório');
                                return;
                              }
                              if (!validateUsername(formData.username)) {
                                setError('Username inválido (3-20 caracteres alfanuméricos)');
                                return;
                              }
                              const isUnique = await checkUniqueness('username', formData.username);
                              if (!isUnique) {
                                setError('Username já cadastrado');
                                return;
                              }
                              setError('');
                              setCurrentStep(2);
                            }}
                          >
                            Continuar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: CPF */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="cpf" className="text-sm font-medium mb-2 block">CPF</label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="cpf"
                              type="text"
                              placeholder="000.000.000-00"
                              value={formatCPF(formData.cpf)}
                              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, '') }))}
                              className={`pl-10 ${cpfError ? 'border-[#ff2389] focus-visible:ring-[#ff2389]' : ''}`}
                              aria-label="Digite seu CPF"
                              maxLength={14}
                              autoFocus
                            />
                          </div>
                          {cpfError && (
                            <p className="text-xs mt-1" style={{ color: '#ff2389' }}>CPF inválido</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(1)}>
                            Voltar
                          </Button>
                          <Button 
                            type="button" 
                            className="w-full" 
                            onClick={async () => {
                              if (!formData.cpf) {
                                setError('CPF é obrigatório');
                                return;
                              }
                              if (cpfError) {
                                setError('CPF inválido');
                                return;
                              }
                              const isUnique = await checkUniqueness('cpf', formData.cpf);
                              if (!isUnique) {
                                setError('CPF já cadastrado');
                                return;
                              }
                              setError('');
                              setCurrentStep(3);
                            }}
                            disabled={cpfError}
                          >
                            Continuar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Email */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
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
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(2)}>
                            Voltar
                          </Button>
                          <Button 
                            type="button" 
                            className="w-full" 
                            onClick={async () => {
                              if (!formData.email) {
                                setError('Email é obrigatório');
                                return;
                              }
                              const isUnique = await checkUniqueness('email', formData.email);
                              if (!isUnique) {
                                setError('Email já cadastrado');
                                return;
                              }
                              setError('');
                              setCurrentStep(4);
                            }}
                          >
                            Continuar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Password, Confirm Password & Terms */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
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
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Password Requirements - truly disappear when complete */}
                        {formData.password && (
                          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
                            <div className="text-sm font-medium text-foreground">Requisitos da senha:</div>
                            <div className="space-y-1">
                              {!passwordRequirements.length && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <X className="w-3 h-3" />
                                  Pelo menos 8 caracteres
                                </div>
                              )}
                              {!passwordRequirements.uppercase && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <X className="w-3 h-3" />
                                  Uma letra maiúscula
                                </div>
                              )}
                              {!passwordRequirements.lowercase && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <X className="w-3 h-3" />
                                  Uma letra minúscula
                                </div>
                              )}
                              {!passwordRequirements.number && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <X className="w-3 h-3" />
                                  Um número
                                </div>
                              )}
                              {!passwordRequirements.special && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <X className="w-3 h-3" />
                                  Um caractere especial
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">Confirmar senha</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Confirme sua senha"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="pl-10 pr-10"
                              aria-label="Confirme sua senha"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {passwordMismatch && (
                            <p className="text-xs mt-1 text-white">As senhas não coincidem</p>
                          )}
                        </div>

                        <div className="flex items-start space-x-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                          <Checkbox
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                          />
                          <div className="space-y-1">
                            <label
                              htmlFor="terms"
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              Aceito os Termos de Uso e Política de Privacidade
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Ao se cadastrar, você concorda com nossos{' '}
                              <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                              {' '}e{' '}
                              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(3)}>
                            Voltar
                          </Button>
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loading || !acceptedTerms || passwordMismatch || !Object.values(passwordRequirements).every(Boolean)}
                          >
                            {loading ? 'Cadastrando...' : 'Criar conta'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Login Form */}
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
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </>
                )}

                {error && (
                  <Alert variant="destructive" role="alert" aria-live="polite" className="bg-destructive/10 border-destructive text-white">
                    <AlertDescription className="text-white">{error}</AlertDescription>
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
              </form>

              {/* Social Login Buttons - only show on login or first step of registration */}
              {(isLogin || (!isLogin && currentStep === 0)) && (
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
                    className="min-h-[44px] bg-black text-white hover:bg-gray-800"
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
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
                
                {/* Twitch Login Button */}
                <Button
                  type="button"
                  className="min-h-[44px] bg-[#9146ff] text-white hover:bg-[#7d39e6] w-full"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'twitch',
                        options: {
                          redirectTo: `${window.location.origin}/`
                        }
                      });
                      if (error) throw error;
                    } catch (error) {
                      console.error('Twitch auth error:', error);
                      setError('Erro ao conectar com Twitch');
                    }
                  }}
                  disabled={loading}
                  aria-label="Entrar com Twitch"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                  Entrar com Twitch
                </Button>
                </div>
              )}

              {/* Toggle Login/Register */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setShowForgotPassword(false);
                      setCurrentStep(0);
                    }}
                    className="text-primary hover:underline focus:outline-none focus:underline"
                    aria-label={isLogin ? "Criar nova conta" : "Entrar na sua conta"}
                  >
                    {isLogin ? 'Cadastre-se' : 'Entre aqui'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;