"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export function AnimatedBackground() {
  const [lightningKey, setLightningKey] = useState(0)
  const randomValuesRef = useRef<{
    smokeX: number[]
    wispX: number[]
    particlePositions: { left: number; top: number }[]
    particleDurations: number[]
    particleDelays: number[]
  } | null>(null)

  // Initialize random values once on mount
  if (!randomValuesRef.current) {
    randomValuesRef.current = {
      smokeX: Array.from({ length: 8 }, () => Math.random() * 100 - 50),
      wispX: Array.from({ length: 5 }, () => Math.random() * 60 - 30),
      particlePositions: Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
      })),
      particleDurations: Array.from({ length: 20 }, () => 4 + Math.random() * 3),
      particleDelays: Array.from({ length: 20 }, () => Math.random() * 5),
    }
  }

  useEffect(() => {
    // Random lightning strikes every 3-8 seconds
    const getNextLightningTime = () => Math.random() * 5000 + 3000
    let timeoutId: NodeJS.Timeout

    const scheduleLightning = () => {
      timeoutId = setTimeout(() => {
        setLightningKey((prev) => prev + 1)
        scheduleLightning()
      }, getNextLightningTime())
    }

    scheduleLightning()

    return () => clearTimeout(timeoutId)
  }, [])

  const randomValues = randomValuesRef.current!

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-accent/10"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Lightning Effects */}
      <div key={lightningKey} className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-accent/30" />
          <div className="absolute top-0 left-1/4 w-px h-full bg-primary/60 animate-lightning-flash" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-primary/40 animate-lightning-flash-delayed" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-accent/50 animate-lightning-flash-delayed-2" />
        </motion.div>
      </div>

      {/* Smoke Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Smoke particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: `${100 + i * 30}px`,
              height: `${100 + i * 30}px`,
              background: `radial-gradient(circle, rgba(0, 212, 255, ${0.15 - i * 0.015}) 0%, transparent 70%)`,
              left: `${(i * 12.5) % 100}%`,
              top: `${50 + (i % 2) * 20}%`,
            }}
            animate={{
              y: [0, -100, -200],
              x: [0, randomValues.smokeX[i], randomValues.smokeX[i]],
              opacity: [0, 0.6, 0],
              scale: [1, 1.5, 2],
            }}
            transition={{
              duration: 8 + i * 0.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.8,
            }}
          />
        ))}
        
        {/* Additional smoky wisps */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`wisp-${i}`}
            className="absolute rounded-full blur-2xl"
            style={{
              width: `${150 + i * 40}px`,
              height: `${150 + i * 40}px`,
              background: `radial-gradient(circle, rgba(16, 185, 129, ${0.1 - i * 0.01}) 0%, transparent 70%)`,
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [0, -80, -160],
              x: [0, randomValues.wispX[i], randomValues.wispX[i]],
              opacity: [0, 0.4, 0],
              scale: [1, 1.3, 1.8],
            }}
            transition={{
              duration: 10 + i * 0.3,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 1.2,
            }}
          />
        ))}
      </div>

      {/* Floating particles for extra depth */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${randomValues.particlePositions[i].left}%`,
              top: `${randomValues.particlePositions[i].top}%`,
            }}
            animate={{
              y: [0, -30, -60],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: randomValues.particleDurations[i],
              repeat: Infinity,
              ease: "easeOut",
              delay: randomValues.particleDelays[i],
            }}
          />
        ))}
      </div>
    </div>
  )
}

