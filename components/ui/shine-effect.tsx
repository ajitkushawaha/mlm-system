"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ShineEffectProps {
  children: React.ReactNode
  className?: string
}

export function ShineEffect({ children, className }: ShineEffectProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

