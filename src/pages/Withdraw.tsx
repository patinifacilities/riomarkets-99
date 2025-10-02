import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Withdraw = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'crypto' | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Você precisa estar logado para fazer um saque");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setAmount(value);
  };

  const formatCurrencyDisplay = (value: string) => {
    if (!value) return "0,00";
    const numericValue = parseFloat(value) / 100;
    return numericValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const numericAmount = parseFloat(amount) / 100;
  const minWithdraw = 5;

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Selecione um método de saque");
      return;
    }

    if (numericAmount < minWithdraw) {
      toast.error(`O valor mínimo para saque é R$ ${minWithdraw.toFixed(2)}`);
      return;
    }

    if (numericAmount > (profile?.saldo_moeda || 0)) {
      toast.error("Você não tem saldo suficiente para este saque");
      return;
    }

    if (selectedMethod === 'pix' && !pixKey) {
      toast.error("Por favor, informe sua chave PIX");
      return;
    }

    if (selectedMethod === 'crypto' && !cryptoAddress) {
      toast.error("Por favor, informe o endereço da sua carteira");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('fiat_requests')
        .insert({
          user_id: user?.id,
          request_type: 'withdrawal',
          amount_brl: selectedMethod === 'pix' ? numericAmount : 0,
          pix_key: selectedMethod === 'pix' ? `${pixKeyType}:${pixKey}` : null,
          admin_notes: selectedMethod === 'crypto' 
            ? `Crypto withdrawal: ${cryptoNetwork} - ${cryptoAddress}` 
            : null,
          status: 'pending',
        });

      if (error) throw error;

      toast.success("Solicitação de saque enviada!", {
        description: "Seu saque será processado em breve por nossa equipe"
      });

      navigate('/wallet');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error("Erro ao solicitar saque. Tente novamente mais tarde");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Sacar Fundos
          </h1>
          <p className="text-muted-foreground">
            Escolha o método de saque e o valor que deseja sacar
          </p>
        </div>

        {/* Balance Display */}
        <Card className="p-6 md:p-8 mb-6 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Saldo disponível:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {((profile?.saldo_moeda || 0) / 100).toFixed(2)}
            </span>
          </div>
        </Card>

        {/* Amount Input Card */}
        <Card className="p-6 md:p-8 mb-6 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
          <div className="mb-6">
            <Label htmlFor="amount" className="text-base font-semibold mb-3 block">
              Valor do Saque
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl md:text-3xl font-bold text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                value={formatCurrencyDisplay(amount)}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="pl-16 pr-4 h-16 text-2xl md:text-3xl font-bold border-2 border-primary/30 focus:border-primary"
              />
            </div>
            {amount && numericAmount < minWithdraw && (
              <div className="mt-2 text-sm text-amber-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                O saque mínimo é R$ {minWithdraw.toFixed(2)}
              </div>
            )}
          </div>

          {/* Amount Slider */}
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor do saque</span>
              <span className="font-bold text-primary">R$ {numericAmount.toFixed(2)}</span>
            </div>
            <Slider
              value={[numericAmount]}
              min={0}
              max={(profile?.saldo_moeda || 0) / 100}
              step={1}
              onValueChange={(values) => setAmount((values[0] * 100).toString())}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>R$ 0,00</span>
              <span>R$ {((profile?.saldo_moeda || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Withdrawal Methods */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">Métodos de Saque</h2>

          {/* PIX */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
              selectedMethod === "pix" ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => setSelectedMethod("pix")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30">
                  <svg
                    className="w-6 h-6 text-teal-400"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.5H118.4C138.5 391.5 157.4 383.7 171.6 369.5L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L171.6 142.1C157.4 127.9 138.5 120.1 118.4 120.1H103.3L200.7 22.63C231.1-7.71 280.3-7.71 310.6 22.63L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9zM112 142.1C126.1 142.1 141.3 148.3 152.2 159.1L229.2 236.1C248.4 255.3 248.4 255.3 267.6 236.1L344.6 159.1C355.5 148.3 370.7 142.1 386.8 142.1H503.4C508.6 142.1 512 145.5 512 150.7C512 153.1 511.1 155.4 509.3 157.2L499.7 166.8C466.1 200.4 466.1 254.4 499.7 288L509.3 297.6C511.1 299.4 512 301.7 512 304.1C512 309.3 508.6 312.7 503.4 312.7H386.8C370.7 312.7 355.5 306.5 344.6 295.7L267.6 218.7C248.4 199.5 248.4 199.5 229.2 218.7L152.2 295.7C141.3 306.5 126.1 312.7 112 312.7H8.526C3.321 312.7 0 309.3 0 304.1C0 301.7 .8945 299.4 2.686 297.6L12.28 288C45.89 254.4 45.89 200.4 12.28 166.8L2.686 157.2C.8945 155.4 0 153.1 0 150.7C0 145.5 3.321 142.1 8.526 142.1H112z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base">PIX</h3>
                  <p className="text-sm text-muted-foreground">Rápido e seguro</p>
                </div>
              </div>
              {selectedMethod === "pix" && (
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* PIX Details */}
            {selectedMethod === "pix" && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 animate-scale-in">
                <div>
                  <Label className="mb-3 block">Tipo de Chave PIX</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'cpf', label: 'CPF' },
                      { value: 'email', label: 'Email' },
                      { value: 'phone', label: 'Telefone' },
                      { value: 'random', label: 'Aleatória' }
                    ].map((type) => (
                      <Button
                        key={type.value}
                        variant={pixKeyType === type.value ? "default" : "outline"}
                        onClick={() => setPixKeyType(type.value as any)}
                        className="h-10"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
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
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Crypto */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
              selectedMethod === "crypto" ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => setSelectedMethod("crypto")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                  <Bitcoin className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Criptomoeda</h3>
                  <p className="text-sm text-muted-foreground">BTC, ETH, USDT</p>
                </div>
              </div>
              {selectedMethod === "crypto" && (
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Crypto Details */}
            {selectedMethod === "crypto" && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 animate-scale-in">
                <div>
                  <Label className="mb-3 block">Rede da Criptomoeda</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'BTC', label: 'Bitcoin' },
                      { value: 'ETH', label: 'Ethereum' },
                      { value: 'USDT', label: 'USDT' }
                    ].map((network) => (
                      <Button
                        key={network.value}
                        variant={cryptoNetwork === network.value ? "default" : "outline"}
                        onClick={() => setCryptoNetwork(network.value as any)}
                        className="h-10"
                      >
                        {network.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cryptoAddress">Endereço da Carteira</Label>
                  <Input
                    id="cryptoAddress"
                    type="text"
                    placeholder="0x... ou bc1..."
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Certifique-se de que o endereço está correto. Transações não podem ser revertidas.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!amount || numericAmount < minWithdraw || isLoading || !selectedMethod}
          className="w-full h-14 text-lg font-semibold mt-8 bg-[#00ff90] hover:bg-[#00ff90]/90 text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processando..." : "Solicitar Saque"}
        </Button>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            Os saques são processados em até 48 horas úteis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
