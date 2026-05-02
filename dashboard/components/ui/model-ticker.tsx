"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ModelTickerItem {
  name: string;
  provider: string;
  status?: "online" | "offline";
}

interface ModelTickerProps {
  models: ModelTickerItem[];
  className?: string;
  speed?: number;
}

/**
 * Infinite scrolling ticker showing AI model availability.
 * Creates a seamless looping marquee effect.
 */
export function ModelTicker({ models, className, speed = 30 }: ModelTickerProps) {
  // Duplicate for seamless loop
  const allModels = [...models, ...models];

  return (
    <div className={cn("relative overflow-hidden py-4", className)}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10" />

      <motion.div
        animate={{
          x: [0, -(models.length * 220)],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        className="flex gap-4"
      >
        {allModels.map((model, i) => (
          <div
            key={`${model.name}-${i}`}
            className="flex items-center gap-3 px-5 py-2.5 bg-transparent border border-[#262626] rounded-sm shrink-0 hover:border-[#FF4500] transition-colors duration-150"
          >
            <div className={cn(
              "w-2 h-2 rounded-none",
              model.status === "offline" ? "bg-red-500" : "bg-[#FF4500]"
            )} />
            <span className="text-xs font-technical tracking-widest text-[#0A0A0A] dark:text-white whitespace-nowrap uppercase">{model.name}</span>
            <span className="text-[10px] font-technical tracking-widest text-[#494551] uppercase">{model.provider}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
