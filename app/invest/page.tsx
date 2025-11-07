"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Wallet, DollarSign, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { calculateStakingIncome } from "@/lib/staking-calculator"

export default function InvestPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [investing, setInvesting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [investmentData, setInvestmentData] = useState<{
    investmentAmount?: number
    investmentDate?: Date | string
    investmentLockPeriod?: number
    investmentUnlockDate?: Date | string
    lastRoiCreditDate?: Date | string
    lastDailyRoiCreditDate?: Date | string
    shakingWallet?: number
  } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchInvestmentData()
    }
  }, [user])

  const fetchInvestmentData = async () => {
    try {
      const response = await fetch("/api/invest/status")
      if (response.ok) {
        const data = await response.json()
        setInvestmentData(data)
      }
    } catch (err) {
      console.error("Failed to fetch investment data:", err)
    }
  }

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setInvesting(true)

    const amount = parseFloat(investmentAmount)
    if (!amount || amount < 100) {
      setError("Investment amount must be at least $100")
      setInvesting(false)
      return
    }

    const availableBalance = user?.normalWallet ?? user?.currentBalance ?? 0
    if (amount > availableBalance) {
      setError(`Insufficient balance. Available: $${availableBalance}`)
      setInvesting(false)
      return
    }

    try {
      const response = await fetch("/api/invest/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Investment created successfully!")
        setInvestmentAmount("")
        fetchInvestmentData()
        // Refresh user data
        window.location.reload()
      } else {
        setError(data.error || "Failed to create investment")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setInvesting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Use effective investment amount - prefer the maximum of both to handle inconsistencies
  const effectiveInvestmentAmount = Math.max(
    investmentData?.investmentAmount || 0,
    investmentData?.shakingWallet || 0
  )
  
  const monthlyRoi = effectiveInvestmentAmount > 0
    ? calculateStakingIncome(effectiveInvestmentAmount)
    : 0
  
  const roiRate = effectiveInvestmentAmount > 0 && monthlyRoi > 0
    ? roundToTwo((monthlyRoi / effectiveInvestmentAmount) * 100)
    : 0

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                Staking Wallet Investment
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Invest in Staking Wallet and earn tiered monthly ROI (4% - 8%). Minimum investment: $100
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Investment Form */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Create Investment
                  </CardTitle>
                  <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs sm:text-sm font-semibold text-primary">
                      Transfer from Main Wallet to Staking Wallet for investment
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <form onSubmit={handleInvest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Investment Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="number"
                          min="100"
                          step="0.01"
                          placeholder="100.00"
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum: $100 | Available: ${user?.normalWallet ?? user?.currentBalance ?? 0}
                      </p>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="bg-green-500/10 border-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-500">{success}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={investing}>
                      {investing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Create Investment"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Current Investment Status */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    Investment Status
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your current Staking Wallet investment</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                  {(investmentData?.investmentAmount || investmentData?.shakingWallet) ? (
                    <>
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Investment Amount</span>
                          <span className="font-semibold text-base sm:text-lg">${effectiveInvestmentAmount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Monthly ROI Rate ({roiRate}%)</span>
                          <span className="font-semibold text-green-500 text-sm sm:text-base">${monthlyRoi}/month</span>
                        </div>
                        {effectiveInvestmentAmount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Daily ROI (approx.)</span>
                            <span className="font-semibold text-green-500 text-sm sm:text-base">
                              ${roundToTwo(monthlyRoi / 30)}/day
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Investment Date</span>
                          <span className="text-xs sm:text-sm">
                            {investmentData.investmentDate
                              ? new Date(investmentData.investmentDate).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        {investmentData.investmentLockPeriod && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Lock Period</span>
                            <Badge className="text-[10px] sm:text-xs">{investmentData.investmentLockPeriod} months</Badge>
                          </div>
                        )}
                        {investmentData.investmentUnlockDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Unlock Date</span>
                            <span className="text-xs sm:text-sm">
                              {new Date(investmentData.investmentUnlockDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {(investmentData.lastRoiCreditDate || investmentData.lastDailyRoiCreditDate) && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-muted-foreground">Last ROI Credit</span>
                            <span className="text-xs sm:text-sm">
                              {investmentData.lastDailyRoiCreditDate
                                ? new Date(investmentData.lastDailyRoiCreditDate).toLocaleDateString()
                                : investmentData.lastRoiCreditDate
                                ? new Date(investmentData.lastRoiCreditDate).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-3 sm:pt-4 border-t border-neutral-800">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">ROI Calculation:</p>
                        <p className="text-xs text-muted-foreground">
                          ${effectiveInvestmentAmount} × {roiRate}% = ${monthlyRoi} per month
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Daily ROI: ${monthlyRoi} ÷ {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} days = ${roundToTwo(monthlyRoi / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())}/day
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ROI is credited to your Main Wallet daily
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <Wallet className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">No active investment</p>
                      <p className="text-xs sm:text-sm mt-1.5 sm:mt-2">Create an investment to start earning tiered monthly ROI (4% - 8%)</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Investment Info */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">Investment Information</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">Investment Range</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Minimum: $100</p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">Monthly ROI</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Tiered: 4% - 8%</p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">ROI Credit</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Credited to Main Wallet</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">Tiered ROI Rates:</h4>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                    <li>• $100 - $1,000 → 4% monthly ROI</li>
                    <li>• $1,000 - $4,000 → 5% monthly ROI</li>
                    <li>• $4,000 - $6,000 → 6% monthly ROI</li>
                    <li>• $6,000 - $10,000 → 7% monthly ROI</li>
                    <li>• Above $10,000 → 8% monthly ROI</li>
                  </ul>
                </div>
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <h4 className="font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">Example ROI:</h4>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                    <li>• $500 investment → $20/month ROI (4% tier)</li>
                    <li>• $2,500 investment → $125/month ROI (5% tier)</li>
                    <li>• $5,000 investment → $300/month ROI (6% tier)</li>
                    <li>• $8,000 investment → $560/month ROI (7% tier)</li>
                    <li>• $15,000 investment → $1,200/month ROI (8% tier)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

