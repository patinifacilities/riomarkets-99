import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, DollarSign, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Deposit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"card" | "pix" | "apple" | null>(null);

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
        // Navigate to card payment page
        navigate("/card-payment", {
          state: {
            amount: numericAmount,
            returnPath: location.pathname,
          },
        });
      } else if (method === "pix") {
        // Create PIX payment request
        const { data, error } = await supabase.functions.invoke("process-fiat-request", {
          body: {
            amount: numericAmount,
            type: "deposit",
            gateway: "pix",
          },
        });

        if (error) throw error;

        toast.success("PIX gerado com sucesso!", {
          description: "Use o código para realizar o pagamento.",
        });

        // You could navigate to a PIX payment page or show a modal with the code
        console.log("PIX Data:", data);
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
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
            {[10, 50, 100].map((value) => (
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
            onClick={() => setSelectedMethod("card")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                  <CreditCard className="w-6 h-6 text-violet-400" />
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
          </Card>

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
          </Card>
        </div>

        {/* Deposit Button */}
        <Button
          onClick={() => selectedMethod && handleDeposit(selectedMethod)}
          disabled={!amount || parseFloat(amount) / 100 < 5 || isProcessing || !selectedMethod}
          className="w-full h-14 text-lg font-semibold mt-8 bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 hover:from-yellow-600 hover:via-yellow-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Processando..." : "Continuar com Depósito"}
        </Button>

        {/* Apple Pay Button */}
        <Button
          onClick={() => handleDeposit("apple")}
          disabled={!amount || parseFloat(amount) / 100 < 5 || isProcessing}
          className="w-full h-14 text-lg font-semibold mt-3 bg-black hover:bg-black/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          {isProcessing ? "Processando..." : "Pagar com Apple Pay"}
        </Button>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            Seus dados estão protegidos com criptografia de ponta a ponta
          </p>
        </div>
      </div>
    </div>
  );
}
