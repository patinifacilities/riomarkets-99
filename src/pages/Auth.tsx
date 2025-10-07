import { useState, useEffect, useRef } from 'react';
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
import { EmailSuggestions } from '@/components/ui/email-suggestions';


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
  const [rememberMe, setRememberMe] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const loginEmailInputRef = useRef<HTMLInputElement>(null);
  
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
        
        // If user successfully signed in, redirect to markets page
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Login successful, redirecting to markets...');
          navigate('/', { replace: true });
          // Scroll to top of page after navigation
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            openOnFirstVisit();
          }, 100);
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
    
    // Check for email uniqueness
    const emailExists = !(await checkUniqueness('email', formData.email));
    if (emailExists) {
      return { error: { message: 'Este email já está cadastrado. Faça login em vez disso.' }, needsConfirmation: false };
    }
    
    // Check for CPF uniqueness
    const cpfExists = !(await checkUniqueness('cpf', formData.cpf));
    if (cpfExists) {
      return { error: { message: 'Este CPF já está cadastrado.' }, needsConfirmation: false };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: formData.name,
          username: formData.username,
          cpf: formData.cpf
        }
      }
    });
    
    console.log('Sign up result:', error ? 'Error' : 'Success', error);
    
    // User is automatically logged in (email confirmation disabled)
    if (!error && data.user) {
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
        const { error } = await handleSignUp();
        if (error) {
          console.error('Auth error:', error);
          setError(error.message);
          return;
        }
        
        toast({
          title: "Conta criada!",
          description: "Bem-vindo ao Rio Markets!",
        });
        // User will be automatically redirected by auth state change
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background ${currentStep > 0 ? 'overflow-hidden' : ''}`}>
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
                className="w-auto mx-auto cursor-pointer"
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
                    "Rápidos": "#00ff90"
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
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                          style={{ backgroundColor: '#00ff90', color: '#000' }}
                          onClick={() => {
                            if (formData.name) setCurrentStep(1);
                            else setError('Nome é obrigatório');
                          }}
                        >
                          Continuar
                        </Button>
                      </div>
                    )}

                    {/* Step 2: Email */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="email" className="text-sm font-medium mb-2 block">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              ref={emailInputRef}
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
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(0)}>
                            Voltar
                          </Button>
                          <Button 
                            type="button" 
                            className="w-full"
                            style={{ backgroundColor: '#00ff90', color: '#000' }}
                            onClick={async () => {
                              if (!formData.email) {
                                setError('Email é obrigatório');
                                return;
                              }
                              const isUnique = await checkUniqueness('email', formData.email);
                              if (!isUnique) {
                                setError('Email já cadastrado. Faça login para acessar sua conta.');
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

                    {/* Step 3: Username */}
                    {currentStep === 2 && (
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
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(1)}>
                            Voltar
                          </Button>
                          <Button 
                            type="button" 
                            className="w-full"
                            style={{ backgroundColor: '#00ff90', color: '#000' }}
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
                              setCurrentStep(3);
                            }}
                          >
                            Continuar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: CPF */}
                    {currentStep === 3 && (
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
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(2)}>
                            Voltar
                          </Button>
                          <Button 
                            type="button" 
                            className="w-full"
                            style={{ backgroundColor: '#00ff90', color: '#000' }}
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
                                setError('CPF já cadastrado. Faça login para acessar sua conta.');
                                return;
                              }
                              setError('');
                              setCurrentStep(4);
                            }}
                            disabled={cpfError}
                          >
                            Continuar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Passwords & Terms */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="password" className="text-sm font-medium mb-2 block">Senha</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Senha"
                              value={formData.password}
                              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                              className="pl-10 pr-10"
                              aria-label="Digite sua senha"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 rounded-none w-10 h-full"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              <span className="sr-only">Mostrar senha</span>
                            </Button>
                          </div>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <li className={passwordRequirements.length ? 'text-green-500' : ''}>
                              <Check className={passwordRequirements.length ? 'inline w-4 h-4 mr-1 align-middle' : 'hidden'} />
                              Mínimo 8 caracteres
                            </li>
                            <li className={passwordRequirements.uppercase ? 'text-green-500' : ''}>
                              <Check className={passwordRequirements.uppercase ? 'inline w-4 h-4 mr-1 align-middle' : 'hidden'} />
                              Uma letra maiúscula
                            </li>
                            <li className={passwordRequirements.lowercase ? 'text-green-500' : ''}>
                              <Check className={passwordRequirements.lowercase ? 'inline w-4 h-4 mr-1 align-middle' : 'hidden'} />
                              Uma letra minúscula
                            </li>
                            <li className={passwordRequirements.number ? 'text-green-500' : ''}>
                              <Check className={passwordRequirements.number ? 'inline w-4 h-4 mr-1 align-middle' : 'hidden'} />
                              Um número
                            </li>
                            <li className={passwordRequirements.special ? 'text-green-500' : ''}>
                              <Check className={passwordRequirements.special ? 'inline w-4 h-4 mr-1 align-middle' : 'hidden'} />
                              Um caractere especial (!@#$%^&*)
                            </li>
                          </ul>
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">Confirmar Senha</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Confirmar Senha"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="pl-10 pr-10"
                              aria-label="Confirme sua senha"
                            />
                          </div>
                          {passwordMismatch && (
                            <p className="text-xs mt-1" style={{ color: '#ff2389' }}>As senhas não coincidem</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={() => setCurrentStep(3)}>
                            Voltar
                          </Button>
                          <Button 
                            type="submit" 
                            className="w-full"
                            style={{ backgroundColor: '#00ff90', color: '#000' }}
                            disabled={loading}
                          >
                            Criar Conta
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="text-sm font-medium mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            ref={loginEmailInputRef}
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
                      <div>
                        <label htmlFor="password" className="text-sm font-medium mb-2 block">Senha</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="pl-10 pr-10"
                            aria-label="Digite sua senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 rounded-none w-10 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Mostrar senha</span>
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          className="text-sm px-0"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Esqueci minha senha
                        </Button>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        Entrar
                      </Button>

                    </div>
                  </>
                )}

                {/* Terms and Conditions */}
                {!isLogin && currentStep === 4 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
                    >
                      Eu aceito os <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Termos de Uso</a> e <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Política de Privacidade</a>
                    </label>
                  </div>
                )}
              </form>

              {/* Forgot Password */}
              {showForgotPassword && (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Digite seu email para receber um link de recuperação de senha.
                  </p>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      aria-label="Digite seu endereço de email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={handleForgotPassword}>
                      Enviar Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Social Login - moved below Entrar button */}
              {isLogin && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-black border border-gray-200"
                      onClick={async () => {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/`
                          }
                        });
                        if (error) {
                          toast({
                            title: "Erro",
                            description: error.message,
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    
                    <Button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white"
                      onClick={async () => {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'apple',
                          options: {
                            redirectTo: `${window.location.origin}/`
                          }
                        });
                        if (error) {
                          toast({
                            title: "Erro",
                            description: error.message,
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Apple
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-[#9146FF] hover:bg-[#772CE8] text-white"
                    onClick={async () => {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'twitch',
                        options: {
                          redirectTo: `${window.location.origin}/`
                        }
                      });
                      if (error) {
                        toast({
                          title: "Erro",
                          description: error.message,
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                    Twitch
                  </Button>
                </div>
              )}

              {/* Sign Up / Sign In Toggle */}
              <div className="text-center">
                {isLogin ? (
                  <>
                    Não tem uma conta?{' '}
                    <Button type="button" variant="link" onClick={() => {
                      setIsLogin(false);
                      setCurrentStep(0);
                      setError('');
                      setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        name: '',
                        username: '',
                        cpf: ''
                      });
                    }}>
                      Criar uma conta
                    </Button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{' '}
                    <Button type="button" variant="link" onClick={() => {
                      setIsLogin(true);
                      setError('');
                      setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        name: '',
                        username: '',
                        cpf: ''
                      });
                    }}>
                      Entrar
                    </Button>
                  </>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
