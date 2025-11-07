"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Network, Receipt, Users, LogOut, Menu, X, Wallet, TrendingUp, UserPlus, UserCheck, ArrowDownCircle, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  
  // Show expanded state only when not collapsed
  const isExpanded = !isCollapsed

  const handleLogout = async () => {
    await logout()
    router.push("/")
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


  // Admin-specific navigation items
  const adminNavItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/payouts", label: "Payouts", icon: Receipt },
    { href: "/admin/franchise", label: "Franchise", icon: UserCheck },
    { href: "/admin/franchise-applications", label: "Franchise Applications", icon: FileText },
    { href: "/admin/wallets", label: "Wallets", icon: Wallet },
    { href: "/admin/investments", label: "Investments", icon: TrendingUp },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
    { href: "/admin/deposits", label: "Deposits", icon: ArrowDownCircle },
  ]

  // Regular user navigation items
  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/network", label: "Connection", icon: Network },
    { href: "/payouts", label: "Payouts", icon: Receipt },
    { href: "/referrals", label: "Referrals", icon: Users },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    { href: "/withdraw", label: "Deposit/Withdraw", icon: Wallet },
    { href: "/invest", label: "Invest", icon: TrendingUp },
    ...(user?.role === "user" ? [{ href: "/franchise/apply", label: "Apply for Franchise", icon: UserPlus }] : []),
    ...(user?.role === "franchise" ? [{ href: "/activate", label: "Activate Member", icon: UserCheck }] : []),
  ]

  const navItems = user?.role === "admin" ? adminNavItems : userNavItems

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-neutral-800/50 bg-transparent h-screen sticky top-0 transition-all duration-300 overflow-hidden",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      {/* Header with hamburger */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isExpanded && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground whitespace-nowrap">DreamStake</h2>
          </div>
        )}
        {!isExpanded && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("ml-auto", !isExpanded && "mx-auto")}
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 overflow-hidden",
                  isExpanded ? "space-x-3 px-4 py-3" : "justify-center px-3 py-3",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn("font-medium whitespace-nowrap transition-all duration-200", isExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0")}>
                  {item.label}
                </span>
              </Link>
              {/* Tooltip for collapsed and not hovered state */}
              {!isExpanded && hoveredItem === item.href && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-card border-l border-b border-border rotate-45"></div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {/* Membership Level */}
        <div className="relative">
          <div
            className={cn(
              "p-3 rounded-lg bg-muted/50 transition-all overflow-hidden",
              isExpanded ? "flex items-center justify-between" : "flex items-center justify-center"
            )}
            onMouseEnter={() => !isExpanded && setHoveredItem("membership")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span className={cn("text-sm font-medium text-muted-foreground whitespace-nowrap transition-all duration-200", isExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0")}>
              Membership
            </span>
            <Badge className={cn(getMembershipColor(user?.membershipLevel), "text-white", !isExpanded && "text-xs")}>
              {isExpanded ? (user?.membershipLevel || "green").toUpperCase() + " ID" : (user?.membershipLevel || "green").toUpperCase()[0]}
            </Badge>
          </div>
          {!isExpanded && hoveredItem === "membership" && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg z-50 whitespace-nowrap">
              <span className="text-sm font-medium text-foreground">{(user?.membershipLevel || "green").toUpperCase()} ID</span>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-card border-l border-b border-border rotate-45"></div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={handleLogout}
            onMouseEnter={() => !isExpanded && setHoveredItem("logout")}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all overflow-hidden",
              isExpanded ? "justify-start" : "justify-center px-3"
            )}
          >
            <LogOut className={cn("w-4 h-4 flex-shrink-0", isExpanded && "mr-2")} />
            <span className={cn("whitespace-nowrap transition-all duration-200", isExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0")}>
              Logout
            </span>
          </Button>
          {!isExpanded && hoveredItem === "logout" && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg z-50 whitespace-nowrap">
              <span className="text-sm font-medium text-foreground">Logout</span>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-card border-l border-b border-border rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

