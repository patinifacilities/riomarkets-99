import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  texts: string[];
  baseText: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export const TypewriterText = ({ 
  texts, 
  baseText,
  typingSpeed = 100, 
  deletingSpeed = 50, 
  pauseDuration = 2000,
  className = ""
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

  return (
    <span className={className}>
      {baseText} {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
};