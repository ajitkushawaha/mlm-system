"use client"

import { motion } from "framer-motion"

export function BeamEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-full w-1 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
          initial={{
            x: `${(i + 1) * 33}%`,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scaleY: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

