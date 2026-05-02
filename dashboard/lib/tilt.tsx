"use client";

import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 3D Tilt Effect Hook
 * Creates a perspective tilt effect following mouse position
 */
export function useTilt(strength: number = 15) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [strength, -strength]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-strength, strength]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return {
    ref,
    motionProps: {
      style: { rotateX, rotateY },
    },
    eventHandlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}

/**
 * Smooth Tilt Component - Wraps useTilt for direct use
 */
interface SmoothTiltProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  glare?: boolean;
  perspective?: number;
}

export function SmoothTilt({ 
  children, 
  className = "", 
  strength = 10,
  glare = true,
  perspective = 1000,
}: SmoothTiltProps) {
  const { ref, motionProps, eventHandlers } = useTilt(strength);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch devices on mount — disable tilt to prevent layout overflow
  useState(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    eventHandlers.onMouseMove(e);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setGlarePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
  };

  // On touch devices, render children without tilt transforms
  if (isTouchDevice) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      {...motionProps}
      {...eventHandlers}
      onMouseMove={handleMouseMove}
      style={{ perspective, willChange: 'transform' }}
      className={cn("relative transition-transform duration-300", className)}
    >
      <div style={{ transformStyle: "preserve-3d" }}>
        {children}
      </div>
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-inherit"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,107,74,0.12) 0%, transparent 60%)`,
            transform: "translateZ(1px)",
          }}
        />
      )}
    </motion.div>
  );
}