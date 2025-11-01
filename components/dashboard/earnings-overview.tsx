"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Wallet, DollarSign, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function EarningsOverview() {
  const { user } = useAuth()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getNextLevelInfo = () => {
    if (user?.membershipLevel === "green") {
      const payoutsNeeded = Math.max(0, 6 - (user.greenPayouts || 0))
      return {
        level: "Blue ID",
        requirement: `${payoutsNeeded} more payouts needed`,
        color: "text-blue-600",
      }
    } else if (user?.membershipLevel === "blue") {
      return {
        level: "Gold ID",
        requirement: "Complete all 10 Blue steps",
        color: "text-yellow-600",
      }
    }
    return null
  }

  const nextLevel = getNextLevelInfo()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(user?.totalEarnings || 0)}</div>
          <p className="text-xs text-muted-foreground">Lifetime earnings</p>
        </CardContent>
      </Card>

      {/* Current Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(user?.currentBalance || 0)}</div>
          <p className="text-xs text-muted-foreground">Available for withdrawal</p>
        </CardContent>
      </Card>

      {/* Direct Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Direct Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(user?.leftDirects || 0) + (user?.rightDirects || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Left: {user?.leftDirects || 0} | Right: {user?.rightDirects || 0}
          </p>
        </CardContent>
      </Card>

      {/* Membership Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Membership Level</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-2">
            <Badge
              className={`${
                user?.membershipLevel === "green"
                  ? "bg-green-500"
                  : user?.membershipLevel === "blue"
                    ? "bg-blue-500"
                    : "bg-yellow-500"
              } text-white`}
            >
              {user?.membershipLevel?.toUpperCase()} ID
            </Badge>
          </div>
          {nextLevel && (
            <p className={`text-xs ${nextLevel.color}`}>
              Next: {nextLevel.level} - {nextLevel.requirement}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
