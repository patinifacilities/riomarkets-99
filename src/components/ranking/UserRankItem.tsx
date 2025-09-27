import React from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';

interface UserRankItemProps {
  user: User;
  position: number;
}

const UserRankItem = React.memo(({ user, position }: UserRankItemProps) => {
  // Mock performance data - would come from backend in real implementation
  const mockAccuracyRate = Math.floor(Math.random() * 40) + 60; // 60-100%
  const mockAnalysesCount = Math.floor(Math.random() * 50) + 5; // 5-55

  const getPositionIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return <Crown className="w-6 h-6 text-[#00FF91] drop-shadow-[0_0_8px_#00FF91]" />;
      case 2:
        return <Medal className="w-5 h-5 text-white" />;
      case 3:
        return <Trophy className="w-5 h-5 text-white" />;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-[#666666] flex items-center justify-center">
            <span className="text-sm font-semibold text-[#999999]">{pos}</span>
          </div>
        );
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'iniciante': 'bg-gray-500/20 text-gray-300',
      'analista': 'bg-accent-muted text-accent',
      'guru': 'bg-primary-glow/20 text-primary',
      'root': 'bg-danger-muted text-danger'
    };
    return colors[level as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getPositionBg = (pos: number) => {
    if (pos === 1) return 'bg-[#0F0F0F] border-[#00FF91] shadow-[0_0_12px_#00FF91]/30';
    if (pos <= 3) return 'bg-[#0F0F0F] border-[#00FF91]/50';
    return 'bg-[#0F0F0F] border-[#333333]';
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:border-[#00FF91]/60 hover:scale-[1.02] ${getPositionBg(position)}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10">
          {getPositionIcon(position)}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00FF91] flex items-center justify-center">
            <span className="text-sm font-bold text-black">
              {user.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <p className="font-semibold text-white">{user.nome}</p>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getLevelColor(user.nivel)} variant="secondary">
                {user.nivel}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#999999]">
              <span>{mockAccuracyRate.toFixed(1)}% de acerto</span>
              <span>•</span>
              <span>{mockAnalysesCount} {mockAnalysesCount === 1 ? 'análise' : 'análises'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xl font-bold text-[#00FF91]">
            {user.saldo_moeda.toLocaleString()}
          </p>
          <p className="text-sm text-[#999999]">Rioz Coin</p>
        </div>
        <button 
          className="min-h-[44px] px-4 py-2 bg-[#FF1493] hover:bg-[#FF1493]/90 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
          aria-label={`Ver perfil de ${user.nome}`}
        >
          Ver Perfil
        </button>
      </div>
    </div>
  );
});

export default UserRankItem;