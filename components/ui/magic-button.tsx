"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface MagicButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
  variant?: "primary" | "outline"
}

export function MagicButton({ children, className, onClick, href, variant = "primary" }: MagicButtonProps) {
  const content = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative px-6 py-3 rounded-lg font-medium overflow-hidden group",
        variant === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-transparent border border-primary/50 text-primary",
        className
      )}
      onClick={onClick}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.div
        className={cn(
          "absolute inset-0",
          variant === "primary" ? "bg-gradient-to-r from-primary/80 to-accent/80" : "bg-primary/10"
        )}
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }

  return content
}

