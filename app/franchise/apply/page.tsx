"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"

export default function FranchiseApplyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [requesting, setRequesting] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [activated, setActivated] = useState(false)

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
    router.push("/login")
    return null
  }

  // Check if user is already a franchise member or admin
  if (user.role === "franchise" || user.role === "admin") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Already a Franchise Member</CardTitle>
            <CardDescription className="text-center">
              You are already registered as a {user.role === "admin" ? "platform administrator" : "franchise member"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const normalWallet = user?.normalWallet || user?.currentBalance || 0
  const franchiseFee = 100
  const canSelfActivate = normalWallet >= franchiseFee

  const handleRequest = async () => {
    setError("")
    setSuccess(false)
    setRequesting(true)

    try {
      const response = await fetch("/api/franchise/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfActivate: false }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Failed to send request")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
    } finally {
      setRequesting(false)
    }
  }

  const handleSelfActivate = async () => {
    setError("")
    setActivated(false)
    setActivating(true)

    try {
      const response = await fetch("/api/franchise/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfActivate: true }),
      })

      const data = await response.json()

      if (response.ok) {
        setActivated(true)
        setTimeout(() => {
          window.location.reload() // Reload to update user role
        }, 2000)
      } else {
        setError(data.error || "Failed to activate")
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
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl text-center text-gradient-beams">
                Apply for Franchise Membership
              </CardTitle>
              <CardDescription className="text-center mt-1.5 sm:mt-2 text-xs sm:text-sm">
                Become a Franchise Member for $100 and unlock the ability to activate new users
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {activated ? (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-green-500 mb-1.5 sm:mb-2">Activated Successfully!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your franchise membership has been activated. ${franchiseFee} has been transferred from your Normal
                      Wallet to your Franchise Wallet. You can now activate users!
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Redirecting...</p>
                </div>
              ) : success ? (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-green-500 mb-1.5 sm:mb-2">Request Sent!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your franchise membership request has been sent to the admin. The admin will contact you for
                      payment details. After payment is received, your account will be approved and upgraded.
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Redirecting to dashboard...</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">What you&apos;ll get:</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1 list-disc list-inside">
                      <li>Ability to activate new users ($10 per activation)</li>
                      <li>Earn activation commissions (Level 1: $5, Level 2: $2, Level 3: $1)</li>
                      <li>Franchise Wallet to manage activations</li>
                      <li>Access to franchise member features</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">How it works:</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1 list-disc list-inside">
                      <li>Click &quot;Request&quot; to send your franchise membership request</li>
                      <li>Admin will contact you for payment details ($100)</li>
                      <li>After payment is received, admin will approve your account</li>
                      <li>You&apos;ll be upgraded to Franchise Member status</li>
                    </ul>
                  </div>

                  {canSelfActivate && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-green-500">Activate Now</h4>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            You have sufficient balance in your Normal Wallet
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-semibold">${normalWallet.toFixed(2)}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Available</p>
                        </div>
                      </div>
                      <Button onClick={handleSelfActivate} className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm" disabled={activating}>
                        {activating ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          `Activate Now ($${franchiseFee})`
                        )}
                      </Button>
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                        ${franchiseFee} will be transferred from Normal Wallet to Franchise Wallet
                      </p>
                    </div>
                  )}

                  {!canSelfActivate && (
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        Your Normal Wallet balance: <span className="font-semibold">${normalWallet.toFixed(2)}</span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1">
                        You need ${franchiseFee} to activate immediately. Otherwise, request and admin will contact you.
                      </p>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="border-t border-neutral-800 pt-3 sm:pt-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-2 sm:mb-3">Or request and admin will contact you</p>
                    <Button onClick={handleRequest} variant="outline" className="w-full text-xs sm:text-sm" disabled={requesting}>
                      {requesting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        "Request"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

