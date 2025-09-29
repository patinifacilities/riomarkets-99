import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AddGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddGatewayModal = ({ open, onOpenChange, onSuccess }: AddGatewayModalProps) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [fees, setFees] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const gatewayTypes = [
    { value: 'pix', label: 'PIX' },
    { value: 'card', label: 'Cartão de Crédito' },
    { value: 'crypto', label: 'Criptomoeda' },
    { value: 'bank', label: 'Transferência Bancária' },
    { value: 'wallet', label: 'Carteira Digital' }
  ];

  const handleSubmit = async () => {
    if (!name || !type || !description || !fees || !minLimit || !maxLimit) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate gateway creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Gateway adicionado",
        description: `Gateway ${name} foi adicionado com sucesso.`,
      });
      
      // Reset form
      setName('');
      setType('');
      setDescription('');
      setFees('');
      setMinLimit('');
      setMaxLimit('');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar gateway. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Gateway</DialogTitle>
          <DialogDescription>
            Configure um novo gateway de pagamento para a plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Gateway</Label>
            <Input
              id="name"
              placeholder="Ex: PayPal, Stripe..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {gatewayTypes.map((gatewayType) => (
                  <SelectItem key={gatewayType.value} value={gatewayType.value}>
                    {gatewayType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Breve descrição do gateway"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees">Taxa (%)</Label>
            <Input
              id="fees"
              placeholder="Ex: 3.9"
              type="number"
              step="0.1"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minLimit">Limite Mínimo (R$)</Label>
              <Input
                id="minLimit"
                placeholder="1.00"
                type="number"
                step="0.01"
                value={minLimit}
                onChange={(e) => setMinLimit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLimit">Limite Máximo (R$)</Label>
              <Input
                id="maxLimit"
                placeholder="50000.00"
                type="number"
                step="0.01"
                value={maxLimit}
                onChange={(e) => setMaxLimit(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Adicionando..." : "Adicionar Gateway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};