import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Pause, Play, Save, Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface FastPoolConfig {
  id: string;
  asset_symbol: string;
  asset_name: string;
  question: string;
  category: string;
  api_connected: boolean;
  api_url?: string;
  last_api_sync?: string;
  paused?: boolean;
  base_odds?: number;
}

interface AssetConfigCardProps {
  asset: FastPoolConfig;
  onUpdate: () => void;
  onTogglePause: (asset: FastPoolConfig) => void;
  getCategoryColor: (category: string) => string;
}

export const AssetConfigCard = ({ asset, onUpdate, onTogglePause, getCategoryColor }: AssetConfigCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [assetName, setAssetName] = useState(asset.asset_name);
  const [question, setQuestion] = useState(asset.question);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!assetName.trim() || !question.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('fast_pool_configs')
        .update({
          asset_name: assetName,
          question: question,
          updated_at: new Date().toISOString()
        })
        .eq('id', asset.id);

      if (error) throw error;

      toast({
        title: "Configuração atualizada",
        description: "As alterações serão aplicadas aos próximos pools",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating asset config:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar configuração",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAssetName(asset.asset_name);
    setQuestion(asset.question);
    setIsEditing(false);
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition-colors">
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${asset.id}`}>Nome do Ativo</Label>
            <Input
              id={`name-${asset.id}`}
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Ex: Bitcoin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`question-${asset.id}`}>Pergunta do Pool</Label>
            <Input
              id={`question-${asset.id}`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: O Bitcoin vai subir ou descer nos próximos 2 minutos?"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold">{asset.asset_name}</h3>
                <Badge className={getCategoryColor(asset.category)}>
                  {asset.category}
                </Badge>
                {asset.api_connected && (
                  <Badge className="bg-success/10 text-success">
                    API Conectada
                  </Badge>
                )}
                {asset.paused && (
                  <Badge className="bg-yellow-500/10 text-yellow-600">
                    Pausado
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium mb-1">{asset.question}</p>
              <p className="text-sm text-muted-foreground mb-2">
                {asset.api_connected 
                  ? `API: ${asset.api_url?.substring(0, 50)}...` 
                  : 'Usando API padrão de mercado'}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span>Símbolo: {asset.asset_symbol}</span>
                <span>Categoria: {asset.category}</span>
                {asset.last_api_sync && (
                  <span>Última Sync: {new Date(asset.last_api_sync).toLocaleString('pt-BR')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate(`/admin/fast/pool/${asset.id}/config`)}
            >
              <Settings className="w-4 h-4" />
              Configurar API
            </Button>
            
            <Button 
              variant={asset.paused ? "outline" : "outline"}
              size="sm" 
              className={`gap-2 ${
                asset.paused 
                  ? 'bg-[#00ff90] hover:bg-[#00ff90]/90 text-gray-800 border-[#00ff90]' 
                  : 'bg-[#ff2389] hover:bg-[#ff2389]/90 text-white border-[#ff2389]'
              }`}
              onClick={() => onTogglePause(asset)}
            >
              {asset.paused ? <Play className="w-4 h-4 text-gray-800" /> : <Pause className="w-4 h-4" />}
              {asset.paused ? 'Retomar' : 'Pausar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};