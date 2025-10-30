"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Network, Receipt, Users, User } from "lucide-react"

type Tab = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/network", label: "Network", icon: Network },
  { href: "/payouts", label: "Payouts", icon: Receipt },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
]

export function BottomTabBar() {
  const pathname = usePathname()

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


