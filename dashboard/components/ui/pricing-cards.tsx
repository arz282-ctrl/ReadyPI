"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import { Check, Sparkles, Zap } from "lucide-react";

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  tokens: string;
  features: string[];
  popular?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

interface PricingCardsProps {
  plans: PricingPlan[];
  className?: string;
}

export function PricingCards({ plans, className }: PricingCardsProps) {
  const [period, setPeriod] = React.useState<"monthly" | "annual">("monthly");

  return (
    <div className={cn("w-full", className)}>
      {/* Period Toggle */}
      <div className="flex justify-center mb-12">
        <div className="relative bg-[#141218] border border-gray-800 rounded-full p-1 flex items-center">
          <button
            className={cn(
              "relative z-10 px-6 py-2.5 rounded-full text-sm font-mono uppercase tracking-wider transition-colors duration-300",
              period === "monthly" ? "text-[#0a0a0f]" : "text-gray-400 hover:text-white"
            )}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            className={cn(
              "relative z-10 px-6 py-2.5 rounded-full text-sm font-mono uppercase tracking-wider transition-colors duration-300",
              period === "annual" ? "text-[#0a0a0f]" : "text-gray-400 hover:text-white"
            )}
            onClick={() => setPeriod("annual")}
          >
            Annual
            <span className="ml-2 text-[10px] text-[#00ff88] font-bold">-25%</span>
          </button>
          <motion.div
            className="absolute top-1 bottom-1 rounded-full bg-[#ff6b4a]"
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              left: period === "monthly" ? "4px" : "50%",
              width: "calc(50% - 4px)",
            }}
          />
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const price = period === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={cn(
                "relative bg-[#0d1117] border rounded-2xl p-8 transition-all duration-500 group",
                plan.popular
                  ? "border-[#ff6b4a] shadow-[0_0_60px_rgba(255,107,74,0.15)] scale-[1.02] z-10"
                  : "border-gray-800 hover:border-[#ff6b4a]/40"
              )}
            >
              {plan.popular && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.5 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white text-[10px] font-mono uppercase tracking-wider rounded-full font-bold shadow-[0_0_20px_rgba(255,107,74,0.4)]"
                >
                  <Sparkles size={10} />
                  Most Popular
                </motion.div>
              )}

              <div className="text-center">
                <div className="font-fraunces text-lg font-bold text-white mb-4 uppercase tracking-tighter">
                  {plan.name}
                </div>

                <div className="mb-1 flex items-baseline justify-center gap-1">
                  <span className="text-gray-400 text-sm">{plan.currency}</span>
                  <AnimatedCounter
                    value={price}
                    className={cn(
                      "text-4xl font-fraunces font-black",
                      plan.popular ? "text-[#ff6b4a]" : "text-white"
                    )}
                    decimals={0}
                  />
                </div>
                <div className="text-xs font-mono text-gray-500 mb-2">
                  /{period === "monthly" ? "month" : "month, billed annually"}
                </div>

                <div className="text-sm text-[#ff6b4a] font-mono mb-6 bg-[#ff6b4a]/5 py-1.5 rounded-full border border-[#ff6b4a]/10">
                  <Zap size={12} className="inline mr-1" />
                  {plan.tokens} tokens
                </div>

                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((f, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + j * 0.05 }}
                      viewport={{ once: true }}
                      className="text-xs text-gray-400 font-mono flex items-start gap-2"
                    >
                      <Check size={14} className="text-[#ff6b4a] mt-0.5 shrink-0" />
                      {f}
                    </motion.li>
                  ))}
                </ul>

                <motion.a
                  href={plan.ctaHref || "/signup"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "block w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all font-bold",
                    plan.popular
                      ? "bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]"
                      : "border border-gray-700 text-gray-400 hover:border-[#ff6b4a] hover:text-[#ff6b4a]"
                  )}
                >
                  {plan.ctaText || "Get Started"}
                </motion.a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
