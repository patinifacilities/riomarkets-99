import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderConfirmProps {
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  text?: string;
  selectedOption?: string; // Added to determine color
}

export const SliderConfirm = ({ onConfirm, disabled = false, className, text = "Deslize para confirmar", selectedOption }: SliderConfirmProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startPosition = useRef(0);

  const THRESHOLD = 0.99; // 99% threshold to complete

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
    e.preventDefault();
    
    setIsDragging(true);
    startX.current = e.clientX;
    startPosition.current = position;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    startPosition.current = position;
  };

  const containerWidth = containerRef.current?.offsetWidth || 300;
  const thumbWidth = 56;
  const maxPosition = containerWidth - thumbWidth;
  const progress = maxPosition > 0 ? position / maxPosition : 0;
  
  // Determine colors based on selected option - change when sim is selected (green)
  const isSimOption = selectedOption === 'sim';
  const fillColor = isSimOption ? '#00ff90' : '#ff2389';

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-14 rounded-full overflow-hidden cursor-pointer select-none",
        "bg-secondary/20 border border-border transition-all duration-300",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
    >
      {/* Progress fill with dynamic color */}
      <div 
        className="absolute inset-0 transition-none rounded-full"
        style={{
          background: fillColor,
          width: `${Math.min(progress * 100, 100)}%`,
        }}
      />
      
      {/* Background text */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <span 
          className="text-sm font-medium transition-none"
          style={{
            color: progress > 0 && selectedOption === 'sim' ? '#374151' : 'white'
          }}
        >
          {text}
        </span>
      </div>
      
      {/* Draggable thumb */}
      <div
        ref={thumbRef}
        className={cn(
          "absolute top-1 left-1 w-12 h-12 rounded-full shadow-lg z-20",
          "flex items-center justify-center bg-white",
          isDragging ? "scale-110 transition-none" : "scale-100 transition-all duration-200",
          disabled ? "cursor-not-allowed bg-gray-400" : "cursor-grab active:cursor-grabbing"
        )}
        style={{
          transform: `translateX(${position}px)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <ChevronRight 
          className="w-6 h-6 text-gray-800"
        />
      </div>
      
      {/* Completion animation */}
      {isCompleted && (
        <div 
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ backgroundColor: fillColor }}
        >
          <span className="text-white font-bold">Confirmado!</span>
        </div>
      )}
    </div>
  );
};