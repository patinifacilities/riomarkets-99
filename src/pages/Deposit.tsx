import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock, Save, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { PixPaymentModal } from "@/components/wallet/PixPaymentModal";

export default function Deposit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, loading } = useAuth();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"card" | "pix" | "apple" | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    cpf: '',
  });
  const [saveCard, setSaveCard] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode?: string; qrCodeText?: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Você precisa estar logado para fazer um depósito");
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

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.match(/.{1,4}/g)?.join(' ') || numbers;
    return formatted.slice(0, 19);
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

  const handleCardFormSubmit = async () => {
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv || !cardData.cpf) {
      toast.error("Por favor, preencha todos os campos do cartão");
      return;
    }

    if (cardData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error("Por favor, insira um CPF válido");
      return;
    }

    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const numericAmount = parseFloat(amount) / 100;
      toast.success("Pagamento processado!", {
        description: `Depósito de R$ ${numericAmount.toFixed(2)} realizado com sucesso.`,
      });

      if (saveCard) {
        toast.success("Cartão salvo para futuros pagamentos");
      }
      
      navigate('/wallet');
    } catch (error) {
      toast.error("Erro no pagamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async (method: "card" | "pix" | "apple") => {
    if (!session?.user) {
      toast.error("Você precisa estar logado para fazer um depósito");
      navigate("/auth");
      return;
    }

    const numericAmount = parseFloat(amount) / 100;
    
    if (numericAmount < 5) {
      toast.error("O depósito mínimo é R$ 5,00", {
        description: "Por favor, insira um valor maior.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (method === "card") {
        setShowCardForm(true);
        setIsProcessing(false);
        return;
      } else if (method === "pix") {
        // Generate PIX payment via Abacatepay
        const { data, error } = await supabase.functions.invoke("generate-pix-payment", {
          body: { amount: numericAmount },
        });

        if (error) {
          console.error("PIX generation error:", error);
          throw error;
        }

        console.log("PIX data received:", data);

        if (data?.success) {
          setPixData({
            qrCode: data.payment?.qrCode || data.qrCode,
            qrCodeText: data.payment?.qrCodeText || data.qrCodeText,
          });
          setShowPixModal(true);
        } else {
          throw new Error(data?.error || "Failed to generate PIX payment");
        }
      } else if (method === "apple") {
        toast.info("Apple Pay em breve!", {
          description: "Esta opção estará disponível em breve.",
        });
      }
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast.error("Erro ao processar depósito", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-12 md:pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/assets/rio-markets-logo.png"
            alt="Rio Markets Logo" 
            className="h-12 w-auto dark:hidden"
          />
          <img 
            src="/assets/rio-white-logo.png"
            alt="Rio Markets Logo" 
            className="h-12 w-auto hidden dark:block"
          />
        </div>

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
            Adicionar Saldo
          </h1>
          <p className="text-muted-foreground">
            Escolha o método de pagamento e o valor que deseja depositar
          </p>
        </div>

        {/* Amount Input Card */}
        <Card className="p-6 md:p-8 mb-6 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
          <div className="mb-6">
            <Label htmlFor="amount" className="text-base font-semibold mb-3 block">
              Valor do Depósito
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl md:text-3xl font-bold text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                value={formatCurrencyDisplay(amount)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setAmount(value);
                }}
                placeholder="0,00"
                className="pl-16 pr-4 h-16 text-2xl md:text-3xl font-bold border-2 border-primary/30 focus:border-primary"
              />
            </div>
            {amount && parseFloat(amount) / 100 < 5 && (
              <div className="mt-2 text-sm text-amber-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                O depósito mínimo é R$ 5,00
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[100, 500, 1000].map((value) => (
              <Button
                key={value}
                variant="outline"
                onClick={() => setAmount((value * 100).toString())}
                className="h-12 font-semibold hover:bg-primary/10 hover:border-primary"
              >
                R$ {value}
              </Button>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">Métodos de Pagamento</h2>

          {/* Credit/Debit Card */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
              selectedMethod === "card" ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => {
              setSelectedMethod("card");
              setShowCardForm(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gray-800 border border-gray-700">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Cartão de Crédito/Débito</h3>
                  <p className="text-sm text-muted-foreground">Processamento instantâneo</p>
                </div>
              </div>
              {selectedMethod === "card" && (
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Expanded Card Form */}
            {selectedMethod === "card" && showCardForm && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 animate-scale-in">
                {/* Card Preview */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-6 rounded-2xl text-white shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded shadow-lg"></div>
                      <CreditCard className="w-8 h-8 opacity-50" />
                    </div>
                    <div className="space-y-4">
                      <div className="text-xl tracking-wider font-mono drop-shadow-lg">
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

                {/* Card Form Fields */}
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

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="saveCard" 
                    checked={saveCard}
                    onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                  />
                  <Label 
                    htmlFor="saveCard" 
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar cartão para futuros pagamentos
                  </Label>
                </div>

                <Button
                  onClick={handleCardFormSubmit}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-semibold bg-white hover:bg-gray-100 text-black"
                >
                  {isProcessing ? "Processando..." : `Pagar R$ ${formatCurrencyDisplay(amount)}`}
                </Button>
              </div>
            )}
          </Card>

          {/* PIX */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
              selectedMethod === "pix" ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => {
              setSelectedMethod("pix");
              setShowCardForm(false);
            }}
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
          </Card>

        </div>

        {/* Deposit Button - Only show when PIX is selected and card form is not shown */}
        {selectedMethod === "pix" && !showCardForm && (
          <>
            <Button
              onClick={() => handleDeposit("pix")}
              disabled={isProcessing || !amount || parseFloat(amount) / 100 < 5}
              className="w-full h-14 text-lg font-semibold mt-6 bg-primary hover:bg-primary/90"
            >
              {isProcessing ? "Processando..." : "Continuar com Depósito"}
            </Button>
            
            {/* Apple Pay Button */}
            <button
              onClick={() => handleDeposit("apple")}
              disabled={isProcessing || !amount || parseFloat(amount) / 100 < 5}
              className="group relative w-full h-14 text-lg font-semibold mt-3 bg-black text-white rounded-lg overflow-hidden transition-all duration-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-white transform -translate-x-full transition-transform duration-500 group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-500">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="font-semibold">Apple Pay</span>
              </span>
            </button>
          </>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border flex items-center justify-center gap-3">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Seus dados estão protegidos com criptografia de ponta a ponta
          </p>
        </div>
      </div>

      {/* PIX Payment Modal */}
      <PixPaymentModal
        open={showPixModal}
        onOpenChange={setShowPixModal}
        amount={formatCurrencyDisplay(amount)}
        qrCode={pixData?.qrCode}
        qrCodeText={pixData?.qrCodeText}
        onSuccess={() => {
          setShowPixModal(false);
          navigate('/wallet');
        }}
      />
    </div>
  );
}
