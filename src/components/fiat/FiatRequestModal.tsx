import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { fiatService, CreateFiatRequestData } from '@/services/fiat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, CreditCard, Banknote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface FiatRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FiatRequestModal = ({ open, onOpenChange }: FiatRequestModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateFiatRequestData>({
    request_type: 'deposit',
    amount_brl: 0,
    pix_key: '',
    proof_url: ''
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const createRequestMutation = useMutation({
    mutationFn: fiatService.createFiatRequest,
    onSuccess: () => {
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi enviada e será analisada pela nossa equipe.',
      });
      queryClient.invalidateQueries({ queryKey: ['fiat-requests'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      request_type: 'deposit',
      amount_brl: 0,
      pix_key: '',
      proof_url: ''
    });
    setProofFile(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Aceitos apenas: JPG, PNG, WEBP ou PDF',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo: 5MB',
        variant: 'destructive',
      });
      return;
    }

    setProofFile(file);
    setUploadingProof(true);

    try {
      const proofUrl = await fiatService.uploadProof(file, user.id);
      setFormData(prev => ({ ...prev, proof_url: proofUrl }));
      toast({
        title: 'Comprovante enviado',
        description: 'O arquivo foi enviado com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo. Tente novamente.',
        variant: 'destructive',
      });
      setProofFile(null);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount_brl <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, insira um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.request_type === 'withdrawal' && !formData.pix_key) {
      toast({
        title: 'Chave PIX obrigatória',
        description: 'Para saques, é necessário informar a chave PIX.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.request_type === 'deposit' && !formData.proof_url) {
      toast({
        title: 'Comprovante obrigatório',
        description: 'Para depósitos, é necessário enviar o comprovante.',
        variant: 'destructive',
      });
      return;
    }

    createRequestMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitação PIX</DialogTitle>
          <DialogDescription>
            Faça uma solicitação de depósito ou saque via PIX.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Tipo de Operação</Label>
            <RadioGroup
              value={formData.request_type}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                request_type: value as 'deposit' | 'withdrawal' 
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deposit" id="deposit" />
                <Label htmlFor="deposit" className="flex items-center cursor-pointer">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Depósito (Adicionar BRL)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="withdrawal" id="withdrawal" />
                <Label htmlFor="withdrawal" className="flex items-center cursor-pointer">
                  <Banknote className="w-4 h-4 mr-2" />
                  Saque (Retirar BRL)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount_brl || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                amount_brl: parseFloat(e.target.value) || 0 
              }))}
              placeholder="0,00"
              required
            />
          </div>

          {formData.request_type === 'withdrawal' && (
            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX *</Label>
              <Input
                id="pix_key"
                value={formData.pix_key}
                onChange={(e) => setFormData(prev => ({ ...prev, pix_key: e.target.value }))}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                required
              />
            </div>
          )}

          {formData.request_type === 'deposit' && (
            <div className="space-y-2">
              <Label htmlFor="proof">Comprovante de Pagamento *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('proof')?.click()}
                  disabled={uploadingProof}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingProof ? 'Enviando...' : proofFile ? 'Alterar Arquivo' : 'Enviar Comprovante'}
                </Button>
              </div>
              {proofFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo: {proofFile.name}
                </p>
              )}
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              {formData.request_type === 'deposit' ? 'Instruções para Depósito:' : 'Instruções para Saque:'}
            </h4>
            {formData.request_type === 'deposit' ? (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Faça o PIX para nossa chave: 12345678000190</li>
                <li>• Envie o comprovante acima</li>
                <li>• Processamento em até 2 horas úteis</li>
              </ul>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Saldo será deduzido imediatamente</li>
                <li>• Processamento em até 24 horas úteis</li>
                <li>• Taxa de saque: 2%</li>
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createRequestMutation.isPending || uploadingProof}
            >
              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};