"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
}

export function DropdownMenu({ children, trigger, className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (open && !target.closest('[data-dropdown-menu]')) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" data-dropdown-menu>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div className={cn("absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50", className)}>
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-2", className)}>{children}</div>
}

export function DropdownMenuItem({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={cn("px-3 py-2 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors", className)}
    >
      {children}
    </div>
  )
}

