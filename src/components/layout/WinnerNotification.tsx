import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WinnerNotificationProps {
  winningBets: any[];
  onClose: () => void;
}

export const WinnerNotification = ({ winningBets, onClose }: WinnerNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (winningBets.length > 0) {
      setIsVisible(true);
    }
  }, [winningBets]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  const totalWinnings = winningBets.reduce((sum, bet) => sum + Math.floor(bet.amount * bet.odds), 0);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'animate-slide-in-right' : 'animate-slide-out-right'
    }`}>
      <div className="bg-gradient-to-r from-[#00ff90] to-[#00ff90]/90 text-black p-4 rounded-xl shadow-2xl max-w-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span className="font-bold text-lg">Você Ganhou!</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-black hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {winningBets.length} Fast Pool{winningBets.length > 1 ? 's' : ''} vencido{winningBets.length > 1 ? 's' : ''}!
          </p>
          <p className="text-lg font-bold">
            +{totalWinnings.toLocaleString()} RZ
          </p>
        </div>
      </div>
    </div>
  );
};

// Global notification system for Fast wins
export const showFastWinNotification = (winningBets: any[]) => {
  // Check if user is not on Fast page
  if (window.location.pathname !== '/fast') {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'fast-win-notification';
    
    const totalWinnings = winningBets.reduce((sum, bet) => sum + Math.floor(bet.amount * bet.odds), 0);
    
    notificationContainer.className = 'fixed bottom-4 right-4 z-50 animate-slide-in-right';
    notificationContainer.innerHTML = `
      <div class="bg-gradient-to-r from-[#00ff90] to-[#00ff90]/90 text-black p-4 rounded-xl shadow-2xl max-w-sm">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-bold text-lg">Fast Pool Ganho!</span>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="h-6 w-6 flex items-center justify-center hover:bg-black/10 rounded">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-1">
          <p class="text-sm font-medium">
            ${winningBets.length} pool${winningBets.length > 1 ? 's' : ''} vencido${winningBets.length > 1 ? 's' : ''}!
          </p>
          <p class="text-lg font-bold">
            +${totalWinnings.toLocaleString()} RZ
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notificationContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.getElementById('fast-win-notification')) {
        notificationContainer.classList.add('animate-slide-out-right');
        setTimeout(() => {
          document.body.removeChild(notificationContainer);
        }, 300);
      }
    }, 5000);
  }
};