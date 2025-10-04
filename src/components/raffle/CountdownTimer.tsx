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
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"></div>
      
      <div className="relative">
        <p className="text-sm text-muted-foreground mb-2">Resultado em</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{timeLeft.days.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground">Dias</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground">Horas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground">Min</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground">Seg</div>
          </div>
        </div>
      </div>
    </div>
  );
};