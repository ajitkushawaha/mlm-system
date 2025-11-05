"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, Users } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { calculateStakingIncome } from "@/lib/staking-calculator"

export function EarningsOverview() {
  const { user } = useAuth()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {/* Total Earnings */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(user?.totalEarnings || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
        </CardContent>
      </Card>

      {/* Normal Wallet */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Normal Wallet</CardTitle>
          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold">
            {formatCurrency((user?.normalWallet ?? user?.currentBalance) || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">All earnings (referral + ROI)</p>
        </CardContent>
      </Card>

      {/* Franchise Wallet */}
        <Card className="border-neutral-800 bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Franchise Wallet</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-accent">{formatCurrency(user?.franchiseWallet || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">For activating users ($10 each)</p>
          </CardContent>
        </Card>

      {/* Shaking Wallet */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Shaking Wallet</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {(() => {
            const investmentAmount = user?.shakingWallet || 0
            const monthlyRoi = calculateStakingIncome(investmentAmount)
            const roiRate = monthlyRoi > 0 && investmentAmount > 0 ? ((monthlyRoi / investmentAmount) * 100).toFixed(1) : "0"
            
            return (
              <>
                <div className="text-xl sm:text-2xl font-bold text-yellow-500">{formatCurrency(investmentAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">Investment ({roiRate}% monthly ROI)</p>
              </>
            )
          })()}
        </CardContent>
      </Card>

      {/* Direct Members */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Direct Members</CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold">{(user?.leftDirects || 0) + (user?.rightDirects || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Left: {user?.leftDirects || 0} | Right: {user?.rightDirects || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
