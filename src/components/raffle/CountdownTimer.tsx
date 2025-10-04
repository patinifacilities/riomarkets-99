import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  endsAt: string;
}

export const CountdownTimer = ({ endsAt }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(endsAt);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-amber-500/20 border-2 border-yellow-500/30 rounded-lg p-4 relative overflow-hidden shadow-lg">
      {/* Animated golden shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-shimmer"></div>
      
      <div className="relative">
        <p className="text-sm font-semibold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent mb-3">
          Resultado em
        </p>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-2xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              {timeLeft.days.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-yellow-200/70 font-medium">Dias</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-2xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-yellow-200/70 font-medium">Horas</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-2xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-yellow-200/70 font-medium">Min</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-2xl font-bold bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-pulse">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-yellow-200/70 font-medium">Seg</div>
          </div>
        </div>
      </div>
    </div>
  );
};