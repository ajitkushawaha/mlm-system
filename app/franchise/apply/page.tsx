"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, CheckCircle, XCircle, Loader2, Upload, X, Copy, ArrowLeft } from "lucide-react"
import { BackgroundBeams } from "@/components/ui/background-beams"
import Image from "next/image"
import Link from "next/link"

export default function FranchiseApplyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [requesting, setRequesting] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [activated, setActivated] = useState(false)
  
  // Deposit form state
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [transactionHash, setTransactionHash] = useState("")
  const [notes, setNotes] = useState("")
  const network = "BEP20" // Fixed to BEP20 only
  const [proofImage, setProofImage] = useState<string | null>(null) // Store as base64 string
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const BEP20_ADDRESS = "0x6330a4a6bB6423e7F3A3BF3dFdeB46F38919Fef0"
  
  // Bonus tiers
  const bonusTiers = [
    { amount: 100, bonusPercent: 10, bonusAmount: 10, totalCredit: 110 },
    { amount: 200, bonusPercent: 10, bonusAmount: 20, totalCredit: 220 },
    { amount: 500, bonusPercent: 15, bonusAmount: 75, totalCredit: 575 },
    { amount: 1000, bonusPercent: 20, bonusAmount: 200, totalCredit: 1200 },
  ]
  
  // Calculate bonus for selected amount
  const getBonusForAmount = (amount: number) => {
    const tier = bonusTiers.find(t => t.amount === amount)
    return tier || { bonusPercent: 0, bonusAmount: 0, totalCredit: amount }
  }
  
  const selectedBonus = getBonusForAmount(selectedAmount)

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
  const canSelfActivate = normalWallet >= selectedAmount

  const copyToClipboard = () => {
    navigator.clipboard.writeText(BEP20_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setProofImage(base64String) // Store base64 string
        setProofPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const removeProofImage = () => {
    setProofImage(null)
    setProofPreview(null)
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    
    // Validate transaction hash (required)
    if (!transactionHash || transactionHash.trim() === "") {
      setError("Transaction hash is required")
      return
    }
    
    // Validate proof image (optional but recommended)
    if (!proofImage) {
      setError("Payment proof image is required")
      return
    }
    
    setRequesting(true)

    try {
      const response = await fetch("/api/franchise/apply-with-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedAmount,
          transactionHash: transactionHash || "",
          notes: notes || "",
          network: network,
          proofImage: proofImage || "", // Send base64 string
        }),
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
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
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
                Choose your franchise package and unlock the ability to activate new users
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
                      Your franchise membership has been activated. ${selectedAmount} has been transferred from your Main
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
                      <li>Franchise Wallet to manage activations</li>
                      <li>Access to franchise member features</li>
                    </ul>
                  </div>

                  {/* Bonus Tiers - Two Columns */}
                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-xs sm:text-sm mb-3 sm:mb-4">Franchise Packages with Bonus</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {bonusTiers.map((tier) => (
                        <button
                          key={tier.amount}
                          type="button"
                          onClick={() => setSelectedAmount(tier.amount)}
                          className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                            selectedAmount === tier.amount
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                              : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-600"
                          }`}
                        >
                          <div className="space-y-1 sm:space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm sm:text-base">${tier.amount}</span>
                              {selectedAmount === tier.amount && (
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              <p>Bonus: {tier.bonusPercent}%</p>
                              <p className="text-primary font-semibold">+${tier.bonusAmount}</p>
                            </div>
                            <div className="text-[10px] sm:text-xs text-green-400 font-semibold">
                              Total: ${tier.totalCredit}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedBonus.bonusAmount > 0 && (
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-xs sm:text-sm text-center">
                          <span className="font-semibold">Selected:</span> ${selectedAmount} +{" "}
                          <span className="text-primary font-bold">{selectedBonus.bonusPercent}% Bonus</span> ={" "}
                          <span className="text-green-400 font-bold">${selectedBonus.totalCredit}</span> will be credited to your Franchise Wallet
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm">How it works:</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1 list-disc list-inside">
                      <li>Select your franchise package above</li>
                      <li>Make a payment of ${selectedAmount} using the BEP20 address below</li>
                      <li>Submit your payment proof (transaction hash or screenshot)</li>
                      <li>Admin will review and verify your payment</li>
                      <li>After approval, ${selectedBonus.totalCredit} (${selectedAmount} + ${selectedBonus.bonusAmount} bonus) will be credited to your Franchise Wallet</li>
                      <li>You&apos;ll be upgraded to Franchise Member status</li>
                    </ul>
                  </div>
                  
                  {/* Deposit Form */}
                  <form onSubmit={handleRequest} className="space-y-4 sm:space-y-5">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                      <h4 className="font-semibold text-xs sm:text-sm">Payment Details</h4>
                      
                      {/* BEP20 Address */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">BEP20 Address</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={BEP20_ADDRESS}
                            readOnly
                            className="text-xs sm:text-sm font-mono bg-muted/50"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            className="text-xs sm:text-sm"
                          >
                            {copied ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Send exactly ${selectedAmount} USDT/USDC to this address
                        </p>
                      </div>
                      
                      {/* QR Code */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">QR Code</Label>
                        <div className="border border-neutral-800 rounded-lg p-3 bg-muted/30 flex items-center justify-center">
                          <Image
                            src="/w3qr.jpeg"
                            alt="BEP20 QR Code"
                            width={200}
                            height={200}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                      
                      {/* Transaction Hash */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">
                          Transaction Hash <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="0x..."
                          value={transactionHash}
                          onChange={(e) => setTransactionHash(e.target.value)}
                          className="text-xs sm:text-sm"
                          required
                        />
                      </div>
                      
                      {/* Proof Image Upload */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">
                          Payment Proof Image <span className="text-red-500">*</span>
                        </Label>
                        {!proofPreview ? (
                          <div className="border-2 border-dashed border-neutral-700 rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                              <div className="text-center">
                                <Label
                                  htmlFor="proof-upload"
                                  className="cursor-pointer text-xs sm:text-sm text-primary hover:underline"
                                >
                                  Click to upload payment proof
                                </Label>
                                <Input
                                  id="proof-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProofImageChange}
                                  className="hidden"
                                />
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                  Screenshot of transaction or payment receipt
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proofPreview}
                              alt="Proof preview"
                              className="w-full h-auto rounded-lg border border-neutral-800 max-h-64 object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeProofImage}
                              className="absolute top-2 right-2"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        )}
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Upload a screenshot of your payment transaction (required if no transaction hash)
                        </p>
                      </div>
                      
                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">Additional Notes (Optional)</Label>
                        <Input
                          type="text"
                          placeholder="Any additional information..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    {error && (
                      <Alert variant="destructive" className="text-xs sm:text-sm">
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-xs sm:text-sm"
                      disabled={requesting || !transactionHash.trim() || !proofImage}
                    >
                      {requesting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        `Submit Application ($${selectedAmount})`
                      )}
                    </Button>
                  </form>

                  {canSelfActivate && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-xs sm:text-sm text-green-500">Activate Now</h4>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            You have sufficient balance in your Main Wallet
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
                          `Activate Now ($${selectedAmount})`
                        )}
                      </Button>
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                        ${selectedAmount} will be transferred from Main Wallet to Franchise Wallet
                      </p>
                    </div>
                  )}

                  {!canSelfActivate && (
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        Your Main Wallet balance: <span className="font-semibold">${normalWallet.toFixed(2)}</span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1">
                        You need ${selectedAmount} to activate immediately. Otherwise, submit payment proof above.
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

