import React, { useEffect, useRef } from 'react';
import { useInView, useMotionValue, animate } from 'framer-motion';

interface Props {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const NumberTicker: React.FC<Props> = ({
  value,
  direction = 'up',
  delay = 0,
  duration = 1.4,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  useEffect(() => {
    if (!isInView) return;
    // Deceleración limpia, sin resorte: evita el rebote elástico.
    const controls = animate(motionValue, direction === 'down' ? 0 : value, {
      delay,
      duration,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [isInView, delay, duration, value, direction, motionValue]);

  useEffect(() => {
    return motionValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Intl.NumberFormat('en-US').format(Math.round(latest))}${suffix}`;
      }
    });
  }, [motionValue, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={`inline-block tabular-nums ${className}`}
    >
      {prefix}{direction === 'down' ? value : 0}{suffix}
    </span>
  );
};
