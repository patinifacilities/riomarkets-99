import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface TypewriterTextProps {
  texts: string[];
  baseText: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  mobileBreak?: boolean;
  customColors?: Record<string, string>;
  showFastIcon?: boolean;
}

export const TypewriterText = ({ 
  texts, 
  baseText,
  typingSpeed = 100, 
  deletingSpeed = 50, 
  pauseDuration = 2000,
  className = "",
  mobileBreak = false,
  customColors = {},
  showFastIcon = false
}: TypewriterTextProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const targetText = texts[currentTextIndex];
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < targetText.length) {
          setCurrentText(targetText.slice(0, currentText.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isPaused, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration]);

  // Get color for current text, default to #00ff90 if no custom color specified
  const currentColor = customColors[texts[currentTextIndex]] || '#00ff90';
  const currentWord = texts[currentTextIndex];
  const shouldShowIcon = showFastIcon && currentWord === 'Rápidos';
  
  return (
    <span className={className}>
      <span className="block">{baseText}</span>
      <span className="block flex items-center gap-2" style={{ color: currentColor }}>
        {shouldShowIcon && (
          <Zap 
            className="w-5 h-5 md:w-7 md:h-7" 
            style={{ 
              color: currentColor,
              animation: 'heartbeat 0.5s ease-in-out infinite'
            }} 
          />
        )}
        <span>
          {currentText}<span className="animate-pulse" style={{ color: currentColor }}>|</span>
        </span>
      </span>
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </span>
  );
};