"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Cursor Trail Effect
 * Creates trailing dots following the mouse cursor
 */
interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

export function useCursorTrail(options: {
  maxPoints?: number;
  color?: string;
  size?: number;
  delay?: number;
  enabled?: boolean;
} = {}) {
  const { maxPoints = 8, color = "#ff6b4a", size = 6, delay = 50, enabled = true } = options;
  const [points, setPoints] = useState<TrailPoint[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPoints([]);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const newPoint = { x: e.clientX, y: e.clientY, id: Date.now() };
      
      setPoints((prev) => {
        const updated = [...prev, newPoint].slice(-maxPoints);
        return updated;
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setPoints((prev) => prev.slice(1));
      }, delay * maxPoints);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [maxPoints, delay, enabled]);

  return { points, color, size };
}

/**
 * Cursor Trail Renderer
 * Renders the trailing dots
 */
export function CursorTrail({ 
  className = "",
  ...options 
}: { className?: string } & Parameters<typeof useCursorTrail>[0]) {
  const { points, color, size } = useCursorTrail(options);

  if (!options.enabled) return null;

  return (
    <>
      {points.map((point, index) => (
        <motion.div
          key={point.id}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5 }}
          className={`fixed pointer-events-none z-[9999] rounded-full ${className}`}
          style={{
            left: point.x,
            top: point.y,
            width: size,
            height: size,
            backgroundColor: color,
            boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}40`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </>
  );
}

/**
 * Custom Cursor Component
 * Replace default cursor with custom dot + ring
 */
export function CustomCursor({ 
  show = true 
}: { show?: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      if (ringRef.current) {
        // Ring follows with slight delay
        setTimeout(() => {
          if (ringRef.current) {
            ringRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
          }
        }, 50);
      }
      setIsVisible(true);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" || target.tagName === "BUTTON" || target.closest("a") || target.closest("button")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* Dot cursor */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] transition-transform duration-75"
        style={{
          width: isHovering ? 8 : 6,
          height: isHovering ? 8 : 6,
          borderRadius: "50%",
          backgroundColor: "#ff6b4a",
          marginLeft: "-50%",
          marginTop: "-50%",
          opacity: isVisible ? 1 : 0,
          boxShadow: "0 0 10px rgba(255,107,74,0.5)",
        }}
      />
      {/* Ring cursor */}
      <div
        ref={ringRef}
        className="fixed pointer-events-none z-[9998] transition-all duration-150"
        style={{
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,107,74,0.6)",
          marginLeft: "-50%",
          marginTop: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
      />
    </>
  );
}