import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderConfirmProps {
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  text?: string;
}

export const SliderConfirm = ({ onConfirm, disabled = false, className, text = "Deslize para confirmar" }: SliderConfirmProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startPosition = useRef(0);

  const THRESHOLD = 0.97; // 97% threshold to complete

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || disabled) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const thumbWidth = thumbRef.current?.offsetWidth || 56;
      const maxPosition = rect.width - thumbWidth;
      
      const deltaX = e.clientX - startX.current;
      const newPosition = Math.max(0, Math.min(maxPosition, startPosition.current + deltaX));
      
      setPosition(newPosition);
      
      // Check if threshold is reached
      const progress = newPosition / maxPosition;
      if (progress >= THRESHOLD && !isCompleted) {
        setIsCompleted(true);
        setIsDragging(false);
        onConfirm();
        
        // Reset after animation
        setTimeout(() => {
          setPosition(0);
          setIsCompleted(false);
        }, 300);
      }
    };

    const handleMouseUp = () => {
      if (!isCompleted) {
        setPosition(0);
      }
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current || disabled) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const thumbWidth = thumbRef.current?.offsetWidth || 56;
      const maxPosition = rect.width - thumbWidth;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const newPosition = Math.max(0, Math.min(maxPosition, startPosition.current + deltaX));
      
      setPosition(newPosition);
      
      // Check if threshold is reached
      const progress = newPosition / maxPosition;
      if (progress >= THRESHOLD && !isCompleted) {
        setIsCompleted(true);
        setIsDragging(false);
        onConfirm();
        
        // Reset after animation
        setTimeout(() => {
          setPosition(0);
          setIsCompleted(false);
        }, 300);
      }
    };

    const handleTouchEnd = () => {
      if (!isCompleted) {
        setPosition(0);
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, disabled, isCompleted, onConfirm]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    startX.current = e.clientX;
    startPosition.current = position;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    startPosition.current = position;
  };

  const containerWidth = containerRef.current?.offsetWidth || 300;
  const thumbWidth = 56;
  const maxPosition = containerWidth - thumbWidth;
  const progress = maxPosition > 0 ? position / maxPosition : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-14 rounded-full overflow-hidden cursor-pointer select-none",
        "bg-gradient-to-r from-[#ff2389] to-[#00ff90] transition-all duration-300",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
    >
      {/* Progress overlay */}
      <div 
        className="absolute inset-0 bg-white/20 transition-all duration-300"
        style={{
          clipPath: `inset(0 ${100 - (progress * 100)}% 0 0)`,
        }}
      />
      
      {/* Background text */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <span className={cn(
          "text-sm font-medium transition-colors duration-300",
          "text-white"
        )}>
          {text}
        </span>
      </div>
      
      {/* Draggable thumb */}
      <div
        ref={thumbRef}
        className={cn(
          "absolute top-1 left-1 w-12 h-12 rounded-full shadow-lg",
          "flex items-center justify-center transition-all duration-200",
          "cursor-grab active:cursor-grabbing",
          isDragging ? "scale-110" : "scale-100",
          disabled ? "cursor-not-allowed" : ""
        )}
        style={{
          transform: `translateX(${position}px)`,
          background: 'white',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <ChevronRight 
          className={cn(
            "w-6 h-6 transition-colors duration-300",
            "text-gray-800"
          )}
        />
      </div>
      
      {/* Completion animation */}
      {isCompleted && (
        <div className="absolute inset-0 bg-[#00ff90] flex items-center justify-center animate-pulse">
          <span className="text-gray-800 font-bold">Confirmado!</span>
        </div>
      )}
    </div>
  );
};