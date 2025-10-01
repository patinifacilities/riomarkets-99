import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Banknote, Bitcoin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Withdraw = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'pix' | 'crypto'>('pix');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setAmount(numericValue);
  };

  const numericAmount = parseInt(amount) || 0;
  const minWithdraw = 100;

  const handleSubmit = async () => {
    if (numericAmount < minWithdraw) {
      toast({
        title: 'Valor mínimo não atingido',
        description: `O valor mínimo para saque é ${minWithdraw} RIOZ`,
        variant: 'destructive',
      });
      return;
    }

    if (numericAmount > (profile?.saldo_moeda || 0)) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Você não tem saldo suficiente para este saque',
        variant: 'destructive',
      });
      return;
    }

    if (method === 'pix' && !pixKey) {
      toast({
        title: 'Chave PIX obrigatória',
        description: 'Por favor, informe sua chave PIX',
        variant: 'destructive',
      });
      return;
    }

    if (method === 'crypto' && !cryptoAddress) {
      toast({
        title: 'Endereço de carteira obrigatório',
        description: 'Por favor, informe o endereço da sua carteira',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create withdrawal request
      const { error } = await supabase
        .from('fiat_requests')
        .insert({
          user_id: user?.id,
          request_type: 'withdrawal',
          amount_brl: method === 'pix' ? numericAmount : 0,
          pix_key: method === 'pix' ? `${pixKeyType}:${pixKey}` : null,
          admin_notes: method === 'crypto' 
            ? `Crypto withdrawal: ${cryptoNetwork} - ${cryptoAddress}` 
            : null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Solicitação de saque enviada',
        description: 'Seu saque será processado em breve por nossa equipe',
      });

      navigate('/wallet');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast({
        title: 'Erro ao solicitar saque',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Você precisa estar logado para sacar</p>
            <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/wallet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Carteira
        </Link>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Send className="w-6 h-6 text-primary" />
              Sacar Fundos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balance Display */}
            <Alert>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saldo disponível:</span>
                  <span className="text-lg font-bold text-primary">
                    {(profile?.saldo_moeda || 0).toLocaleString()} RIOZ
                  </span>
                </div>
              </AlertDescription>
            </Alert>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque (RIOZ)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0"
                value={amount ? parseInt(amount).toLocaleString() : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg font-semibold"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: {minWithdraw} RIOZ
              </p>
            </div>

            {/* Method Selection */}
            <div className="space-y-3">
              <Label>Método de Saque</Label>
              <RadioGroup value={method} onValueChange={(value: any) => setMethod(value)} disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="w-4 h-4" />
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
                    <Bitcoin className="w-4 h-4" />
                    Criptomoeda
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* PIX Details */}
            {method === 'pix' && (
              <div className="space-y-3">
                <Label>Tipo de Chave PIX</Label>
                <RadioGroup value={pixKeyType} onValueChange={(value: any) => setPixKeyType(value)} disabled={isLoading}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cpf" id="cpf" />
                      <Label htmlFor="cpf" className="cursor-pointer">CPF</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="cursor-pointer">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="phone" id="phone" />
                      <Label htmlFor="phone" className="cursor-pointer">Telefone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="random" id="random" />
                      <Label htmlFor="random" className="cursor-pointer">Aleatória</Label>
                    </div>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    type="text"
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00' :
                      pixKeyType === 'email' ? 'seu@email.com' :
                      pixKeyType === 'phone' ? '(00) 00000-0000' :
                      'Chave aleatória'
                    }
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Crypto Details */}
            {method === 'crypto' && (
              <div className="space-y-3">
                <Label>Rede da Criptomoeda</Label>
                <RadioGroup value={cryptoNetwork} onValueChange={(value: any) => setCryptoNetwork(value)} disabled={isLoading}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BTC" id="btc" />
                      <Label htmlFor="btc" className="cursor-pointer">Bitcoin (BTC)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ETH" id="eth" />
                      <Label htmlFor="eth" className="cursor-pointer">Ethereum (ETH)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USDT" id="usdt" />
                      <Label htmlFor="usdt" className="cursor-pointer">USDT</Label>
                    </div>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="cryptoAddress">Endereço da Carteira</Label>
                  <Input
                    id="cryptoAddress"
                    type="text"
                    placeholder="0x... ou bc1..."
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    disabled={isLoading}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Certifique-se de que o endereço está correto. Transações não podem ser revertidas.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || numericAmount < minWithdraw}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? 'Processando...' : `Solicitar Saque de ${numericAmount.toLocaleString()} RIOZ`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Os saques são processados em até 48 horas úteis
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
