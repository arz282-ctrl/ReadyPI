"use client";

/**
 * PiMark — ReadyPi canonical brand identity (Enhanced 3D Version)
 *
 * Variants:
 *   - "logo"  : compact π for navbar/footer (no orbits, no labels)
 *   - "hero"  : large 3D π with glow + orbital dots, floating code labels, LED studs
 *   - "mini"  : small animated π for cards/components
 *
 * This component creates an impressive 3D LEGO-style π symbol with:
 * - Multi-layer shadow for 3D depth
 * - Glowing orbital particles
 * - Floating code labels (API, bKash, 50+, etc.)
 * - LED-style studs on top
 * - Smooth floating animation
 * - Mouse-reactive subtle tilt
 */

import { CSSProperties, useEffect, useState } from "react";
import { motion } from "framer-motion";

type Variant = "logo" | "hero" | "mini";

interface PiMarkProps {
  variant?: Variant;
  size?: number;
  className?: string;
  withWordmark?: boolean;
  glow?: boolean;
  showEyes?: boolean;
  showOrbit?: boolean;
  showLabels?: boolean;
}

export default function PiMark({
  variant = "logo",
  size,
  className = "",
  withWordmark = false,
  glow = true,
  showEyes = false,
  showOrbit = true,
  showLabels = true,
}: PiMarkProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Logo variant - simple, clean
  if (variant === "logo") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span
          aria-label="ReadyPi"
          className="relative font-fraunces font-black text-[#ff6b4a] leading-none text-3xl"
          style={
            glow
              ? { textShadow: "0 0 18px rgba(255,107,74,0.55)" }
              : undefined
          }
        >
          π
        </span>
        {withWordmark && (
          <span className="font-fraunces font-bold text-white text-lg tracking-tight">
            ReadyPi
          </span>
        )}
      </span>
    );
  }

  // Mini variant - small animated for cards/components
  if (variant === "mini") {
    return (
      <motion.div
        animate={{
          y: [0, -5, 0],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size || 64, height: size || 64 }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,107,74,0.2) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
        {/* Mini π */}
        <span
          className="relative font-fraunces font-black leading-none text-[#ff6b4a]"
          style={{
            fontSize: (size || 64) * 0.5,
            textShadow: "0 0 20px rgba(255,107,74,0.6)",
          }}
        >
          π
        </span>
      </motion.div>
    );
  }

  // Hero variant - 3D LEGO-style with all effects
  const px = size ?? 500;
  const fontPx = Math.round(px * 0.5);

  // Floating labels data
  const labels = [
    { text: "API", delay: 0, top: "8%", left: "0%" },
    { text: "GPT-4o", delay: 0.5, top: "18%", right: "5%" },
    { text: "৳499", delay: 1, bottom: "20%", left: "2%" },
    { text: "bKash", delay: 1.5, bottom: "12%", right: "8%" },
    { text: "50+", delay: 2, top: "35%", left: "-2%" },
    { text: "BD", delay: 2.5, top: "55%", right: "0%" },
  ];

  // Orbiting particles
  const orbitParticles = [
    { delay: 0, duration: 10, size: 10, distance: 120 },
    { delay: 0.5, duration: 12, size: 8, distance: 140 },
    { delay: 1, duration: 14, size: 10, distance: 160 },
    { delay: 1.5, duration: 16, size: 6, distance: 130 },
    { delay: 2, duration: 18, size: 8, distance: 150 },
    { delay: 2.5, duration: 20, size: 6, distance: 170 },
  ];

  const containerStyle: CSSProperties = { 
    width: px, 
    height: px,
    transform: `translateY(${mousePos.y}px) rotateX(${mousePos.y * 0.5}deg)`,
    transformStyle: "preserve-3d",
    perspective: 1000,
  };

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      style={containerStyle}
      aria-hidden="true"
    >
      {/* Background ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,107,74,0.22) 0%, rgba(255,107,74,0.06) 35%, transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Outer orbit ring */}
      <div
        className="absolute inset-[5%] rounded-full border border-[#ff6b4a]/10"
        style={{
          animation: "pulse 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-[12%] rounded-full border border-[#ff6b4a]/08"
        style={{
          animation: "pulse 4s ease-in-out infinite 0.5s",
        }}
      />
      <div
        className="absolute inset-[20%] rounded-full border border-[#ff6b4a]/05"
        style={{
          animation: "pulse 4s ease-in-out infinite 1s",
        }}
      />

      {/* Orbiting particles */}
      {showOrbit && orbitParticles.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: "linear-gradient(135deg, #ff6b4a 0%, #c8381a 100%)",
            boxShadow: `0 0 ${particle.size * 1.5}px rgba(255,107,74,0.8)`,
            top: "50%",
            left: "50%",
            marginTop: -particle.size / 2,
            marginLeft: -particle.size / 2,
            animation: `orbit ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
            "--distance": `${particle.distance}px`,
          } as CSSProperties}
        />
      ))}

      {/* Main 3D π with layers */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: [0, -15, 0],
          rotateY: [0, 3, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* 3D Shadow layers */}
        <span
          className="absolute font-fraunces font-black leading-none text-[#1a0a08] blur-sm"
          style={{
            fontSize: fontPx,
            transform: "translate(8px, 8px)",
            opacity: 0.5,
          }}
        >
          π
        </span>
        <span
          className="absolute font-fraunces font-black leading-none text-[#2d1410] blur-sm"
          style={{
            fontSize: fontPx,
            transform: "translate(5px, 5px)",
            opacity: 0.6,
          }}
        >
          π
        </span>
        <span
          className="absolute font-fraunces font-black leading-none text-[#4a1f18]"
          style={{
            fontSize: fontPx,
            transform: "translate(3px, 3px)",
            opacity: 0.7,
          }}
        >
          π
        </span>

        {/* Main gradient π */}
        <span
          className="relative font-fraunces font-black leading-none"
          style={{
            fontSize: fontPx,
            background:
              "linear-gradient(135deg, #ff8a6a 0%, #ff6b4a 40%, #c8381a 75%, #8a2510 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(255,107,74,0.6))",
          }}
        >
          π

          {/* Eyes on π (optional) */}
          {showEyes && (
            <>
              {/* Left eye */}
              <span
                className="absolute w-3 h-3 bg-white rounded-full"
                style={{
                  top: "32%",
                  left: "28%",
                  boxShadow: "0 0 8px rgba(255,255,255,0.8), inset 2px 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <span
                  className="absolute w-1.5 h-1.5 bg-[#0a0a0f] rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    animation: "eyeMove 8s ease-in-out infinite",
                  }}
                />
              </span>
              {/* Right eye */}
              <span
                className="absolute w-3 h-3 bg-white rounded-full"
                style={{
                  top: "32%",
                  left: "42%",
                  boxShadow: "0 0 8px rgba(255,255,255,0.8), inset 2px 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <span
                  className="absolute w-1.5 h-1.5 bg-[#0a0a0f] rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    animation: "eyeMove 8s ease-in-out infinite 0.2s",
                  }}
                />
              </span>
            </>
          )}
        </span>
      </motion.div>

      {/* LED studs on top */}
      <motion.div
        className="absolute"
        style={{
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "16px",
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {[
          { delay: 0 },
          { delay: 0.5 },
        ].map((stud, i) => (
          <span
            key={i}
            className="block w-6 h-6 rounded-full"
            style={{
              background: "linear-gradient(135deg, #ff6b4a 0%, #c8381a 100%)",
              boxShadow: "0 0 15px rgba(255,107,74,0.6), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)",
              animation: `pulse 2s ease-in-out infinite ${stud.delay}s`,
            }}
          />
        ))}
      </motion.div>

      {/* Floating code labels */}
      {showLabels && labels.map((label, i) => (
        <motion.div
          key={i}
          className="absolute font-mono text-xs text-[#ff6b4a] opacity-60"
          style={{
            ...(label.top !== undefined && { top: label.top }),
            ...(label.bottom !== undefined && { bottom: label.bottom }),
            ...(label.left !== undefined && { left: label.left }),
            ...(label.right !== undefined && { right: label.right }),
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: label.delay,
            ease: "easeInOut",
          }}
        >
          {label.text}
        </motion.div>
      ))}

      {/* Global keyframe styles for this component */}
      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(var(--distance, 120px))
              rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(var(--distance, 120px))
              rotate(-360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        @keyframes eyeMove {
          0%,
          100% {
            transform: translate(-50%, -50%) translateX(0);
          }
          25% {
            transform: translate(-50%, -50%) translateX(2px);
          }
          75% {
            transform: translate(-50%, -50%) translateX(-2px);
          }
        }
      `}</style>
    </div>
  );
}