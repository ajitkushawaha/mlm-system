"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, User, Clock, Menu, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const getMembershipColor = (level: string) => {
    switch (level) {
      case "green":
        return "bg-green-500"
      case "blue":
        return "bg-blue-500"
      case "gold":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
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

  return (
    <div className="border-b border-neutral-800/50 bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Mobile hamburger toggle */}
          <div className="sm:hidden w-full flex justify-between items-center">
            <div></div>
            <Button
              variant="outline"
              size="sm"
              aria-expanded={mobileOpen}
              aria-controls="dashboard-mobile-menu"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Profile Section (Desktop) */}
          <div className="hidden sm:flex items-center ml-auto">
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
        </div>

        {/* Navigation and Actions (Mobile, collapsible below to take height) */}
        {mobileOpen && (
          <div id="dashboard-mobile-menu" className="sm:hidden mt-3 flex flex-col gap-3">
            {/* Mobile Profile */}
            <div className="flex items-center space-x-3 pb-3 border-b border-border">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

          
            <div className="flex items-center justify-between">
              <Badge className={`${getMembershipColor(user?.membershipLevel || "green")} text-white`}>
                {user?.membershipLevel?.toUpperCase()} ID
              </Badge>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${boosterStatus.color}`}></div>
                <span className="text-xs text-muted-foreground">Booster {boosterStatus.text}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}

        {/* Booster Warning */}
        {boosterStatus.status !== "active" && (
          <Card className="mt-4 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-800">
                  <strong>Booster Requirement:</strong> Add 1 member to Left leg and 1 member to Right leg within 2 days
                  to stay active and receive payouts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
