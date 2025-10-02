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

  const formatCurrency = (value: string) => {
    if (!value) return "R$ 0,00";
    const numericValue = parseFloat(value) / 100;
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
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
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
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
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="pl-12 pr-4 h-16 text-2xl md:text-3xl font-bold border-2 border-primary/30 focus:border-primary"
              />
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Valor formatado: <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
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
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <CreditCard className="w-6 h-6 text-blue-400" />
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
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <svg
                    className="w-6 h-6 text-green-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
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

          {/* Apple Pay */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
              selectedMethod === "apple" ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => setSelectedMethod("apple")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500/20 to-zinc-500/20">
                  <Smartphone className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Apple Pay</h3>
                  <p className="text-sm text-muted-foreground">Pague com seu iPhone</p>
                </div>
              </div>
              {selectedMethod === "apple" && (
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

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            🔒 Seus dados estão protegidos com criptografia de ponta a ponta
          </p>
        </div>
      </div>
    </div>
  );
}
