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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ArrowRight, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { calculateStakingIncome } from "@/lib/staking-calculator"

export default function WalletsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [fromWallet, setFromWallet] = useState("normal")
  const [toWallet, setToWallet] = useState("franchise")
  const [amount, setAmount] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setTransferring(true)

    const transferAmount = parseFloat(amount)
    if (!transferAmount || transferAmount <= 0) {
      setError("Please enter a valid amount")
      setTransferring(false)
      return
    }

    try {
      const response = await fetch("/api/wallets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWallet,
          toWallet,
          amount: transferAmount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Transfer completed: $${transferAmount} from ${fromWallet} to ${toWallet}`)
        setAmount("")
        // Refresh user data
        window.location.reload()
      } else {
        setError(data.error || "Transfer failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setTransferring(false)
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

  const normalWallet = user.normalWallet ?? user.currentBalance ?? 0
  const franchiseWallet = user.franchiseWallet ?? 0
  const shakingWallet = user.shakingWallet ?? 0
  
  // Calculate ROI rate based on investment amount
  const getRoiRate = (amount: number) => {
    if (amount <= 0) return 0
    const monthlyRoi = calculateStakingIncome(amount)
    return monthlyRoi > 0 ? ((monthlyRoi / amount) * 100).toFixed(1) : "0"
  }
  
  const roiRate = getRoiRate(shakingWallet)

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
                Wallet Management
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Manage your three wallets and transfer funds between them
              </p>
            </div>

            {/* Wallet Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Normal Wallet
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">All earnings (referral + ROI)</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">${normalWallet.toFixed(2)}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">Can withdraw or transfer</p>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    Franchise Wallet
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Used to activate users ($10 each)</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-accent">${franchiseWallet.toFixed(2)}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                    Can activate {Math.floor(franchiseWallet / 10)} user(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    Shaking Wallet
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Locked investment amounts</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-500">${shakingWallet.toFixed(2)}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                    {shakingWallet > 0 ? `Earning ${roiRate}% monthly ROI` : "Locked investment amounts"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transfer Form */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">Transfer Funds</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Transfer funds between your wallets</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <form onSubmit={handleTransfer} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="fromWallet" className="text-xs sm:text-sm">From Wallet</Label>
                      <Select value={fromWallet} onValueChange={setFromWallet}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal" className="text-xs sm:text-sm">Normal Wallet (${normalWallet.toFixed(2)})</SelectItem>
                          <SelectItem value="franchise" className="text-xs sm:text-sm">Franchise Wallet (${franchiseWallet.toFixed(2)})</SelectItem>
                          <SelectItem value="shaking" className="text-xs sm:text-sm">Shaking Wallet (${shakingWallet.toFixed(2)})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="toWallet" className="text-xs sm:text-sm">To Wallet</Label>
                      <Select value={toWallet} onValueChange={setToWallet}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal" className="text-xs sm:text-sm">Normal Wallet</SelectItem>
                          <SelectItem value="franchise" className="text-xs sm:text-sm">Franchise Wallet (${franchiseWallet.toFixed(2)})</SelectItem>
                          <SelectItem value="shaking" className="text-xs sm:text-sm">Shaking Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="amount" className="text-xs sm:text-sm">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        min={fromWallet === "normal" && (toWallet === "franchise" || toWallet === "shaking") ? "100" : "0.01"}
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="text-xs sm:text-sm"
                      />
                      {fromWallet === "normal" && toWallet === "franchise" && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Minimum transfer: $100</p>
                      )}
                      {fromWallet === "normal" && toWallet === "shaking" && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Minimum transfer: $100</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">Transfer Rules:</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1 list-disc list-inside">
                      <li>Normal → Franchise: Minimum $100</li>
                      <li>Normal → Shaking: Minimum $100 (tiered ROI 4% - 8%)</li>
                      <li>Shaking → Normal: Only if unlocked (admin approval)</li>
                    </ul>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-500/10 border-green-500/20 text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <AlertDescription className="text-xs sm:text-sm text-green-500">{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full text-xs sm:text-sm" disabled={transferring || fromWallet === toWallet}>
                    {transferring ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      <>
                        Transfer <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

