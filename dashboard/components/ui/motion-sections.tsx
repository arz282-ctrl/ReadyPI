"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  className?: string;
}

export function FeatureCard({ icon, title, description, index, className }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className={cn(
        "relative group bg-[#0d1117] border border-gray-800 rounded-2xl p-8 transition-all duration-500",
        "hover:border-[#ff6b4a]/40 hover:shadow-[0_0_40px_rgba(255,107,74,0.08)]",
        className
      )}
    >
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff6b4a]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
          className="w-12 h-12 rounded-xl bg-[#ff6b4a]/10 flex items-center justify-center text-[#ff6b4a] mb-5"
        >
          {icon}
        </motion.div>

        <h3 className="text-white font-bold text-lg mb-3 font-fraunces">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed font-mono">{description}</p>
      </div>
    </motion.div>
  );
}

interface SectionHeadingProps {
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ badge, title, subtitle, className }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className={cn("text-center mb-16", className)}
    >
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="inline-block font-mono text-[10px] uppercase tracking-[4px] text-[#ff6b4a] mb-4 px-4 py-1.5 rounded-full border border-[#ff6b4a]/20 bg-[#ff6b4a]/5"
        >
          {badge}
        </motion.div>
      )}
      <h2 className="text-3xl md:text-5xl font-fraunces font-black text-white mb-4 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 max-w-xl mx-auto font-mono text-sm">{subtitle}</p>
      )}
    </motion.div>
  );
}
