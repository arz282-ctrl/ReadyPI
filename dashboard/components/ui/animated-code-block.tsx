"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface CodeTab {
  label: string;
  language: string;
  code: string;
}

interface AnimatedCodeBlockProps {
  tabs: CodeTab[];
  className?: string;
}

export function AnimatedCodeBlock({ tabs, className }: AnimatedCodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tabs[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={cn(
        "bg-[#0d1117] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50",
        className
      )}
    >
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <div className="flex items-center gap-1">
          {/* Traffic lights */}
          <div className="flex items-center gap-2 mr-6">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all rounded-t-lg",
                activeTab === i
                  ? "text-[#ff6b4a] bg-[#141218] border-t border-x border-gray-800"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check size={14} className="text-[#00ff88]" />
              </motion.div>
            ) : (
              <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Copy size={14} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Code Content */}
      <div className="p-6 pt-4">
        <AnimatePresence mode="wait">
          <motion.pre
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-[13px] text-gray-300 overflow-x-auto font-mono leading-relaxed"
          >
            {tabs[activeTab].code}
          </motion.pre>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
