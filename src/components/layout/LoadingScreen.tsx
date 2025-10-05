import { useEffect, useState } from 'react';
import { useBranding } from '@/hooks/useBranding';

export const LoadingScreen = () => {
  const { config } = useBranding();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <img 
          src={new URL('@/assets/rio-white-logo-deposit.png', import.meta.url).href}
          alt="Logo" 
          className="h-16 md:h-20 object-contain animate-pulse"
        />
        
        {/* Loading Animation */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
