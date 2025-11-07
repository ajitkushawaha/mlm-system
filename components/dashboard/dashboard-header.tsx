"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, User, Clock, Menu, Home, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "./mobile-sidebar"

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = React.useState(false)


  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const getBoosterStatus = () => {
    if (!user?.boosterActive && user?.boosterDeadline) {
      const deadline = new Date(user.boosterDeadline)
      const now = new Date()
      const timeLeft = deadline.getTime() - now.getTime()
      const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)))

      if (hoursLeft > 0) {
        return { status: "warning", text: `${hoursLeft}h left to activate`, color: "bg-orange-500" }
      } else {
        return { status: "inactive", text: "Booster Inactive", color: "bg-red-500" }
      }
    }
    return { status: "active", text: "Booster Active", color: "bg-green-500" }
  }

  const boosterStatus = getBoosterStatus()

  const getFirstName = (name: string | undefined) => {
    if (!name) return "User"
    return name.split(" ")[0]
  }

  const handleMobileToggle = React.useCallback(() => {
    setMobileOpen((prev) => !prev)
    if (onMobileMenuToggle) {
      onMobileMenuToggle()
    }
  }, [onMobileMenuToggle])

  return (
    <>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="border-b border-neutral-800/50 bg-transparent relative z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo/Brand - shown on left side for mobile */}
            <div className="flex lg:hidden items-center space-x-2 flex-1">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold text-gradient-beams">DreamStake</h1>
            </div>

            {/* Profile Section (Desktop only - mobile uses bottom tab bar) */}
            <div className="hidden lg:flex items-center ml-auto">
              <DropdownMenu
                trigger={
                  <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{getFirstName(user?.name)}</span>
                  </div>
                }
              >
                <DropdownMenuContent>
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={handleLogout}>
                    <div className="flex items-center space-x-2">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile hamburger toggle - on right side for mobile */}
            <button
              type="button"
              className="lg:hidden relative p-2.5 rounded-md hover:bg-neutral-800 active:bg-neutral-700 transition-colors touch-manipulation -mr-1 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ 
                WebkitTapHighlightColor: 'transparent', 
                touchAction: 'manipulation',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              aria-expanded={mobileOpen}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMobileToggle()
              }}
              onMouseDown={(e) => {
                e.preventDefault()
              }}
              onTouchStart={(e) => {
                e.stopPropagation()
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMobileToggle()
              }}
              aria-label="Toggle menu"
              aria-controls="mobile-sidebar"
            >
              {mobileOpen ? (
                <X className="w-6 h-6 text-foreground pointer-events-none" />
              ) : (
                <Menu className="w-6 h-6 text-foreground pointer-events-none" />
              )}
            </button>
          </div>

          {/* Booster Warning */}
          {boosterStatus.status !== "active" && (
            <Card className="mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-300">
                    <strong>Booster Requirement:</strong> Add 1 member to Left leg and 1 member to Right leg within 2 days
                    to stay active and receive payouts.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
