"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Network, Receipt, Wallet, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type Tab = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/network", label: "Connection", icon: Network },
  { href: "/payouts", label: "Payouts", icon: Receipt },
  { href: "/wallets", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
]

// Public routes where tab bar should not show
const PUBLIC_ROUTES = ["/", "/login", "/register", "/admin/login"]

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Don't show tab bar if:
  // 1. User is not authenticated (or still loading)
  // 2. Current path is a public route
  // 3. Current path is an admin route
  const isPublicRoute = pathname && PUBLIC_ROUTES.includes(pathname)
  const isAdminRoute = pathname?.startsWith("/admin")
  const shouldShow = !loading && user && !isPublicRoute && !isAdminRoute

  if (!shouldShow) {
    return null
  }

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map(tab => {
          const isActive = pathname?.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={
                  `flex flex-col items-center justify-center gap-1 py-2 text-xs ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


