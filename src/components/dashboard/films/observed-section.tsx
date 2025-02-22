"use client";

import { useEffect, useRef, useState } from "react";

interface ObservedSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function ObservedSection({ children, className }: ObservedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        children
      ) : (
        <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
      )}
    </div>
  );
}
