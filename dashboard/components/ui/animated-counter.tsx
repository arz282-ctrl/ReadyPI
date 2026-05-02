"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform, animate } from "framer-motion";

/**
 * Animated Counter Component
 * Counts up/down with smooth spring animation when scrolled into view
 */
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
  separator?: string;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  className = "",
  decimals = 0,
  separator = ",",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.4, 0.25, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration]);

  const formattedValue = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={className}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </motion.span>
  );
}

/**
 * Animated Percentage Counter
 */
interface AnimatedPercentProps {
  value: number;
  className?: string;
  decimals?: number;
}

export function AnimatedPercent({
  value,
  className = "",
  decimals = 1,
}: AnimatedPercentProps) {
  return (
    <AnimatedCounter
      value={value}
      suffix="%"
      decimals={decimals}
      className={className}
    />
  );
}

/**
 * Currency Counter (BDT)
 */
interface AnimatedCurrencyProps {
  value: number;
  className?: string;
  showSymbol?: boolean;
}

export function AnimatedCurrency({
  value,
  className = "",
  showSymbol = true,
}: AnimatedCurrencyProps) {
  return (
    <AnimatedCounter
      value={value}
      prefix={showSymbol ? "৳" : ""}
      className={className}
    />
  );
}

/**
 * Stat Card with animated counter and icon
 */
interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
  className?: string;
}

export function StatCard({
  value,
  suffix = "",
  prefix = "",
  label,
  icon,
  delay = 0,
  className = "",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      className={`group relative bg-[#0d1117] border border-gray-800 rounded-xl p-6 transition-all duration-300 hover:border-[#ff6b4a]/40 hover:shadow-[0_0_30px_rgba(255,107,74,0.08)] ${className}`}
    >
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ff6b4a]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#ff6b4a]/10 flex items-center justify-center text-[#ff6b4a] group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className="text-3xl font-fraunces font-black text-white group-hover:text-[#ff6b4a] transition-colors tabular-nums">
            {prefix}
            <AnimatedCounter value={value} duration={2} />
            {suffix}
          </div>
        </div>
        <p className="text-gray-500 text-sm font-mono">{label}</p>
      </div>
    </motion.div>
  );
}