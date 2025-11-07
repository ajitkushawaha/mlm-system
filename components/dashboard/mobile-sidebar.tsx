"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Network, Receipt, Users, LogOut, Wallet, TrendingUp, UserPlus, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Close sidebar when route changes
  useEffect(() => {
    if (open) {
      onClose()
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const handleLogout = async () => {
    await logout()
    router.push("/")
    onClose()
  }

  const getMembershipColor = (level?: string) => {
    switch (level) {
      case "green":
        return "bg-green-500"
      case "blue":
        return "bg-blue-500"
      case "gold":
        return "bg-yellow-500"
      default:
        return "bg-green-500"
    }
  }

  const getBoosterStatus = () => {
    if (!user?.boosterActive && user?.boosterDeadline) {
      const deadline = new Date(user.boosterDeadline)
      const now = new Date()
      const timeLeft = deadline.getTime() - now.getTime()
      const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)))

      if (hoursLeft > 0) {
        return { status: "warning", text: `${hoursLeft}h left`, color: "bg-orange-500" }
      } else {
        return { status: "inactive", text: "Inactive", color: "bg-red-500" }
      }
    }
    return { status: "active", text: "Active", color: "bg-green-500" }
  }

  const boosterStatus = getBoosterStatus()

  // Admin-specific navigation items
  const adminNavItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/payouts", label: "Payouts", icon: Receipt },
    { href: "/admin/franchise", label: "Franchise", icon: UserCheck },
    { href: "/admin/activations", label: "Activations", icon: UserCheck },
    { href: "/admin/wallets", label: "Wallets", icon: Wallet },
    { href: "/admin/investments", label: "Investments", icon: TrendingUp },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  ]

  // Regular user navigation items
  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/network", label: "Connection", icon: Network },
    { href: "/payouts", label: "Payouts", icon: Receipt },
    { href: "/referrals", label: "Referrals", icon: Users },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    { href: "/withdraw", label: "Withdraw", icon: Wallet },
    ...(user?.role !== "franchise" && user?.role !== "admin"
      ? [{ href: "/invest", label: "Invest", icon: TrendingUp }]
      : []),
    ...(user?.role === "user" ? [{ href: "/franchise/apply", label: "Apply for Franchise", icon: UserPlus }] : []),
    ...(user?.role === "franchise" ? [{ href: "/activate", label: "Activate Member", icon: UserCheck }] : []),
  ]

  const navItems = user?.role === "admin" ? adminNavItems : userNavItems

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={cn(
          "fixed top-20 left-0 h-screen w-[280px] sm:w-64 bg-neutral-950 border-r border-neutral-800 shadow-2xl z-[50] lg:hidden transition-transform duration-300 ease-in-out overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!open}
        aria-label="Mobile navigation menu"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base active:bg-neutral-800 active:text-neutral-100",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-neutral-300"
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-800 space-y-2.5 sm:space-y-3 mt-auto">
          {/* Membership Level */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-800/50 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-neutral-300">Membership</span>
            <Badge className={cn(getMembershipColor(user?.membershipLevel), "text-white text-[10px] sm:text-xs")}>
              {(user?.membershipLevel || "green").toUpperCase()} ID
            </Badge>
          </div>

          {/* Booster Status */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-800/50 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-neutral-300">Booster</span>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className={cn("w-2 h-2 rounded-full", boosterStatus.color)}></div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium",
                  boosterStatus.status === "active" ? "text-accent" : "text-neutral-400"
                )}
              >
                {boosterStatus.text}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full text-xs sm:text-sm text-neutral-300 border-neutral-800 hover:text-neutral-100 hover:bg-neutral-800"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}

