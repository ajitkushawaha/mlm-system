"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Wallet } from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"

function SelfActivateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState(searchParams.get("userId") || "")
  const [password, setPassword] = useState("")
  const [checkingBalance, setCheckingBalance] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [userBalance, setUserBalance] = useState<{ normalWallet: number; name: string; isActive: boolean } | null>(null)

  const activationFee = 10
  const canActivate = userBalance ? userBalance.normalWallet >= activationFee : false

  const handleCheckBalance = async () => {
    if (!userId) {
      setError("Please enter your User ID")
      return
    }

    setError("")
    setCheckingBalance(true)

    try {
      const response = await fetch(`/api/user/check-balance?userId=${encodeURIComponent(userId)}`)
      const data = await response.json()

      if (response.ok) {
        if (data.isActive) {
          setError("Your account is already active. Redirecting to login...")
          setTimeout(() => {
            router.push("/login")
          }, 2000)
          return
        }
        setUserBalance(data)
      } else {
        setError(data.error || "Failed to check balance")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
    } finally {
      setCheckingBalance(false)
    }
  }

  const handleSelfActivate = async () => {
    if (!userId || !password) {
      setError("User ID and password are required")
      return
    }

    setError("")
    setSuccess(false)
    setActivating(true)

    try {
      // First login to get token
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok && loginData.error?.includes("not active")) {
        // User is inactive, proceed with self-activation (send userId and password)
        const activateResponse = await fetch("/api/user/self-activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, password }),
        })

        const activateData = await activateResponse.json()

        if (activateResponse.ok) {
          setSuccess(true)
          // Now login again to get access
          setTimeout(async () => {
            const finalLogin = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, password }),
            })
            if (finalLogin.ok) {
              window.location.href = "/dashboard"
            }
          }, 2000)
        } else {
          setError(activateData.error || "Failed to activate")
        }
      } else if (loginResponse.ok) {
        // User is already active, redirect
        window.location.href = "/dashboard"
      } else {
        setError(loginData.error || "Invalid credentials")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
    } finally {
      setActivating(false)
    }
  }


  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <BackgroundBeams />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl text-center text-gradient-beams">Activate Your Account</CardTitle>
              <CardDescription className="text-center mt-1.5 sm:mt-2 text-xs sm:text-sm">
                Activate your account by transferring $10 from your Main Wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {success ? (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-green-500 mb-1.5 sm:mb-2">Activated Successfully!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your account has been activated. You can now access all features of DreamStake.
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Redirecting to dashboard...</p>
                </div>
              ) : !userBalance ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">Check Your Balance</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Enter your User ID to check if you have sufficient balance ($10) to activate your account.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="userId" className="text-xs sm:text-sm">User ID</Label>
                    <Input
                      id="userId"
                      type="text"
                      placeholder="DS123456"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value.toUpperCase())}
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleCheckBalance} className="w-full text-xs sm:text-sm" disabled={checkingBalance || !userId}>
                    {checkingBalance ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Check Balance"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">Account Activation</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1 list-disc list-inside">
                      <li>Activation fee: $10</li>
                      <li>Amount will be deducted from your Main Wallet</li>
                      <li>Once activated, you can access all platform features</li>
                      <li>Generation commissions will be distributed to your upline</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium">Main Wallet Balance</span>
                      <span className="text-base sm:text-lg font-bold">${userBalance.normalWallet.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Activation Fee</span>
                      <span className="text-xs sm:text-sm font-semibold">${activationFee}</span>
                    </div>
                    <div className="border-t border-neutral-700 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">After Activation</span>
                      <span className="text-xs sm:text-sm font-semibold text-green-500">
                        ${Math.max(0, userBalance.normalWallet - activationFee).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {canActivate ? (
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Password required to verify and activate your account
                        </p>
                      </div>
                      <Button onClick={handleSelfActivate} className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm" disabled={activating || !password}>
                        {activating ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          `Activate Now ($${activationFee})`
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                      <Alert variant="destructive" className="text-xs sm:text-sm">
                        <AlertDescription className="text-xs sm:text-sm">
                          Insufficient balance. You need ${activationFee} to activate. Current balance: ${userBalance.normalWallet.toFixed(2)}
                        </AlertDescription>
                      </Alert>
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        Contact a Franchise Member to activate your account, or wait until you have sufficient earnings
                        in your Main Wallet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SelfActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center">Loading...</div>}>
      <SelfActivateContent />
    </Suspense>
  )
}

