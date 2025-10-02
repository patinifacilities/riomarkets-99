import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const CardPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { amount, paymentMethod } = location.state || { amount: '0,00', paymentMethod: 'card' };
  
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    cpf: '',
  });
  
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.match(/.{1,4}/g)?.join(' ') || numbers;
    return formatted.slice(0, 19); // 4 groups of 4 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv || !cardData.cpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do cartão.",
        variant: "destructive",
      });
      return;
    }

    if (cardData.cpf.replace(/\D/g, '').length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Pagamento processado!",
        description: `Depósito de R$ ${amount} realizado com sucesso.`,
        className: "bg-[#00ff90] text-gray-800 border-0",
      });

      if (saveCard) {
        toast({
          title: "Cartão salvo",
          description: "Seus dados foram salvos para futuros pagamentos.",
        });
      }
      
      navigate('/wallet');
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-2 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              Pagamento Seguro
            </CardTitle>
            <CardDescription className="text-base">
              {paymentMethod === 'card' ? 'Cartão de Crédito' : 'Cartão de Débito'} • Depósito de R$ {amount}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card Preview */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-6 rounded-2xl text-white shadow-2xl">
                {/* Golden/Grey animated effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-shimmer" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded shadow-lg"></div>
                    <CreditCard className="w-8 h-8 opacity-50" />
                  </div>
                  <div className="space-y-4">
                    <div className="text-2xl tracking-wider font-mono drop-shadow-lg">
                      {cardData.number || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs opacity-70 mb-1">Nome do titular</div>
                        <div className="text-sm font-medium uppercase drop-shadow">
                          {cardData.name || 'NOME DO TITULAR'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs opacity-70 mb-1">Validade</div>
                        <div className="text-sm font-medium">
                          {cardData.expiry || 'MM/AA'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Número do cartão</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => setCardData(prev => ({ 
                      ...prev, 
                      number: formatCardNumber(e.target.value) 
                    }))}
                    maxLength={19}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cardName">Nome do titular</Label>
                  <Input
                    id="cardName"
                    type="text"
                    placeholder="Nome como está no cartão"
                    value={cardData.name}
                    onChange={(e) => setCardData(prev => ({ 
                      ...prev, 
                      name: e.target.value.toUpperCase() 
                    }))}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Validade</Label>
                    <Input
                      id="expiry"
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={cardData.expiry}
                      onChange={(e) => setCardData(prev => ({ 
                        ...prev, 
                        expiry: formatExpiry(e.target.value) 
                      }))}
                      maxLength={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => setCardData(prev => ({ 
                        ...prev, 
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 4) 
                      }))}
                      maxLength={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cpf">CPF do titular</Label>
                  <Input
                    id="cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cardData.cpf}
                    onChange={(e) => setCardData(prev => ({ 
                      ...prev, 
                      cpf: formatCPF(e.target.value) 
                    }))}
                    maxLength={14}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox 
                    id="saveCard" 
                    checked={saveCard}
                    onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                  />
                  <Label 
                    htmlFor="saveCard" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Salvar cartão para futuros pagamentos instantâneos
                    </div>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
                  <div className="p-2 rounded-full bg-success/20">
                    <Lock className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pagamento 100% Seguro</p>
                    <p className="text-xs text-muted-foreground">Criptografia SSL de nível bancário</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isProcessing}
                  className="w-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-primary hover:opacity-90 shadow-lg text-lg py-6"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando pagamento...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pagar R$ {amount}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardPayment;
