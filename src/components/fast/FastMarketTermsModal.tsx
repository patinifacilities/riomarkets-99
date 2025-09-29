import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Zap } from 'lucide-react';
import rioLogoFast from '@/assets/rio-white-logo-fast.png';

interface FastMarketTermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export const FastMarketTermsModal = ({ open, onOpenChange, onAccept }: FastMarketTermsModalProps) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const handleAccept = () => {
    if (hasAcceptedTerms) {
      localStorage.setItem('fastMarketsTermsAccepted', 'true');
      onAccept();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img 
              src={rioLogoFast} 
              alt="Rio Markets" 
              className="h-12 w-auto" 
            />
          </div>
          <DialogTitle className="flex items-center justify-center gap-2 text-[#ff2389] text-center">
            <Zap className="w-6 h-6" />
            Fast Markets - Aviso Importante
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-foreground">
              <div className="flex items-start gap-3 p-4 bg-[#ff2389]/10 rounded-lg border border-[#ff2389]/20">
                <AlertTriangle className="w-5 h-5 text-[#ff2389] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-[#ff2389] mb-2">⚡ Mercados Ultra-rápidos</p>
                  <p className="mb-2">
                    Os Fast Markets são pools de opinião com duração de apenas 60 segundos, 
                    projetados para traders experientes.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">🎯 Como funcionam:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Cada pool dura exatamente 60 segundos</li>
                    <li>Você opina se o ativo vai subir (SIM) ou descer (NÃO)</li>
                    <li>O resultado é determinado aleatoriamente para teste MVP</li>
                    <li>Se você acertar, ganha conforme a odd multiplicadora</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">⚠️ Riscos importantes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Alta volatilidade e risco de perda total</li>
                    <li>Resultados aleatórios durante fase de testes</li>
                    <li>Não é adequado para investidores conservadores</li>
                    <li>Pode causar dependência - jogue com responsabilidade</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">💰 Sistema de recompensas:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Odds dinâmicas que mudam conforme o tempo</li>
                    <li>Maiores odds no início do pool (primeiros 25 segundos)</li>
                    <li>Recompensas creditadas automaticamente se você vencer</li>
                  </ul>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 p-4 bg-muted/20 rounded-lg">
          <Checkbox 
            id="terms" 
            checked={hasAcceptedTerms}
            onCheckedChange={(checked) => setHasAcceptedTerms(checked === true)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Li e aceito os termos. Entendo os riscos dos Fast Markets.
          </label>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Voltar
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!hasAcceptedTerms}
            className="bg-[#ff2389] hover:bg-[#ff2389]/90 text-white"
          >
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};