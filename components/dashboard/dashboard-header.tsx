"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, LogOut, User, Clock, Network, Receipt, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

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

  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Logo and User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">MLM Pro</h1>
            </div>

            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/network">
                <Button variant="ghost" size="sm">
                  <Network className="w-4 h-4 mr-1" />
                  Network
                </Button>
              </Link>
              <Link href="/payouts">
                <Button variant="ghost" size="sm">
                  <Receipt className="w-4 h-4 mr-1" />
                  Payouts
                </Button>
              </Link>
              <Link href="/referrals">
                <Button variant="ghost" size="sm">
                  <Users className="w-4 h-4 mr-1" />
                  Referrals
                </Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={`${getMembershipColor(user?.membershipLevel || "green")} text-white`}>
                {user?.membershipLevel?.toUpperCase()} ID
              </Badge>

              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${boosterStatus.color}`}></div>
                <span className="text-xs text-muted-foreground">{boosterStatus.text}</span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

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
