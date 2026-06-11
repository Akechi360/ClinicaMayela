import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  heightClass?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Antes",
  afterLabel = "Después",
  heightClass = "aspect-[4/5] w-full"
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // porcentaje (0-100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-lg border border-rose-champagne shadow-luxury ${heightClass}`}
    >
      {/* After Image (Background) */}
      <img 
        src={afterImage} 
        alt="Después" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute top-4 right-4 bg-slate-dark/80 backdrop-blur-sm text-pure-white text-[10px] font-sans font-semibold uppercase tracking-widest px-3 py-1 rounded shadow-sm z-20">
        {afterLabel}
      </div>

      {/* Before Image (Overlay clipped by slider position) */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none z-10"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Antes" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none max-w-none"
          style={{ width: containerRef.current ? containerRef.current.getBoundingClientRect().width : '100%' }}
        />
      </div>
      <div className="absolute top-4 left-4 bg-pure-white/90 backdrop-blur-sm text-slate-dark text-[10px] font-sans font-semibold uppercase tracking-widest px-3 py-1 rounded shadow-sm z-20">
        {beforeLabel}
      </div>

      {/* Slider Bar & Handle */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-pure-white/80 cursor-ew-resize z-30"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Handle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-satin-copper border-2 border-pure-white text-pure-white shadow-lg flex items-center justify-center cursor-ew-resize hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-sm font-bold select-none">unfold_more</span>
        </div>
      </div>
    </div>
  );
};
