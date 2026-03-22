'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before animation starts (useful for staggered effects) */
  delay?: number;
}

/**
 * Wraps children in a fade-in-up animation that triggers
 * when the element enters the viewport via IntersectionObserver.
 */
export default function AnimateIn({ children, className = '', delay = 0 }: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small optional delay for stagger effects
          const timer = setTimeout(() => setVisible(true), delay);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease, transform 0.6s ease`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
