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
import { Wallet, DollarSign, Loader2, CheckCircle, XCircle, Clock, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface WithdrawalRequest {
  _id: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
  ifscCode?: string
  branchName?: string
  bankPassbookImage?: string
}

export default function WithdrawPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [branchName, setBranchName] = useState("")
  const [bankPassbook, setBankPassbook] = useState<File | null>(null)
  const [passbookPreview, setPassbookPreview] = useState<string | null>(null)
  const [saveForLater, setSaveForLater] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchRequests()
      loadSavedBankDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadSavedBankDetails = () => {
    if (user?.savedBankDetails) {
      const saved = user.savedBankDetails
      if (saved.bankName) setBankName(saved.bankName)
      if (saved.accountNumber) setAccountNumber(saved.accountNumber)
      if (saved.accountHolderName) setAccountHolderName(saved.accountHolderName)
      if (saved.ifscCode) setIfscCode(saved.ifscCode)
      if (saved.branchName) setBranchName(saved.branchName)
      // Auto-check save for later if details are loaded
      setSaveForLater(true)
    }
  }
  
  const clearSavedDetails = async () => {
    try {
      const response = await fetch("/api/withdraw/clear-saved-details", {
        method: "POST",
      })
      if (response.ok) {
        setBankName("")
        setAccountNumber("")
        setAccountHolderName("")
        setIfscCode("")
        setBranchName("")
        setSaveForLater(false)
        window.location.reload()
      }
    } catch (err) {
      console.error("Failed to clear saved details:", err)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/withdraw/requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (err) {
      console.error("Failed to fetch withdrawal requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setBankPassbook(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPassbookPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setBankPassbook(null)
    setPassbookPreview(null)
  }

  // Generate allowed withdrawal amounts: 10, 50, 250, 1250, 6250, etc. (10 * 5^n)
  const getAllowedAmounts = (maxAmount: number) => {
    const amounts: number[] = []
    let current = 10
    while (current <= maxAmount && current <= 100000) {
      amounts.push(current)
      current *= 5
    }
    return amounts
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Validate bank details or passbook
    const hasBankDetails = bankName && accountNumber && accountHolderName && ifscCode
    const hasPassbook = bankPassbook
    
    if (!hasBankDetails && !hasPassbook) {
      setError("Please provide bank details or upload bank passbook image")
      return
    }

    const withdrawAmount = parseFloat(amount)
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError("Please select a valid amount")
      return
    }

    const availableBalance = user?.normalWallet ?? user?.currentBalance ?? 0
    if (withdrawAmount > availableBalance) {
      setError(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`)
      return
    }

    // Validate amount is in allowed list (10, 50, 250, 1250, etc.)
    const allowedAmounts = getAllowedAmounts(availableBalance)
    if (!allowedAmounts.includes(withdrawAmount)) {
      setError(`Invalid amount. Allowed amounts: ${allowedAmounts.map(a => `$${a}`).join(", ")}`)
      return
    }

    setWithdrawing(true)

    try {
      const formData = new FormData()
      formData.append("amount", withdrawAmount.toString())
      formData.append("bankName", bankName || "")
      formData.append("accountNumber", accountNumber || "")
      formData.append("accountHolderName", accountHolderName || "")
      formData.append("ifscCode", ifscCode || "")
      formData.append("branchName", branchName || "")
      formData.append("saveForLater", saveForLater.toString())
      
      if (bankPassbook) {
        formData.append("bankPassbook", bankPassbook)
      }

      const response = await fetch("/api/withdraw/request", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Withdrawal request submitted successfully! Admin will review and process it.")
        setAmount("")
        // Only clear bank details if not saved for later
        if (!saveForLater) {
          setBankName("")
          setAccountNumber("")
          setAccountHolderName("")
          setIfscCode("")
          setBranchName("")
        }
        setBankPassbook(null)
        setPassbookPreview(null)
        setSaveForLater(false)
        fetchRequests()
        // Refresh user data to get updated savedBankDetails
        window.location.reload()
      } else {
        setError(data.error || "Failed to submit withdrawal request")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setWithdrawing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>
    }
  }

  if (authLoading || loading) {
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

  const availableBalance = user.normalWallet ?? user.currentBalance ?? 0
  
  // Check if user has filled required bank details
  const hasBankDetails = bankName && accountNumber && accountHolderName && ifscCode

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
                Withdraw Funds
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Request withdrawal from your Normal Wallet
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Withdrawal Form */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Request Withdrawal
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Withdraw from your Normal Wallet</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Available Balance</span>
                      <span className="text-xl sm:text-2xl font-bold text-primary">${availableBalance.toFixed(2)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleWithdraw} className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="amount" className="text-xs sm:text-sm">Withdrawal Amount</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => {
                              const val = e.target.value
                              // Only allow valid amounts
                              const numVal = parseFloat(val)
                              if (val === "" || (numVal > 0 && getAllowedAmounts(availableBalance).includes(numVal))) {
                                setAmount(val)
                              }
                            }}
                            className="pl-7 sm:pl-9 text-xs sm:text-sm"
                            required
                            readOnly
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            const allowedAmounts = getAllowedAmounts(availableBalance)
                            if (allowedAmounts.length === 0) {
                              setAmount("10")
                              return
                            }
                            const currentAmount = parseFloat(amount) || 0
                            const currentIndex = allowedAmounts.findIndex(a => a === currentAmount)
                            
                            if (currentIndex === -1 || currentIndex === allowedAmounts.length - 1) {
                              // Start from first amount or cycle back
                              setAmount(allowedAmounts[0].toString())
                            } else {
                              // Move to next amount
                              setAmount(allowedAmounts[currentIndex + 1].toString())
                            }
                          }}
                          className="px-3 sm:px-4 text-xs sm:text-sm"
                        >
                          Add
                        </Button>
                      </div>
                      {getAllowedAmounts(availableBalance).length === 0 && (
                        <p className="text-[10px] sm:text-xs text-red-400">Insufficient balance. Minimum withdrawal: $10</p>
                      )}
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Click &quot;Add&quot; to cycle through allowed amounts: $10 → $50 → $250 → $1250 → etc.
                      </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4 border-t border-neutral-800 pt-3 sm:pt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-semibold">Bank Account Details</p>
                        {user?.savedBankDetails && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[10px] sm:text-xs">
                              Saved Details Loaded
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearSavedDetails}
                              className="text-[10px] sm:text-xs h-6 px-2"
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="bankName" className="text-xs sm:text-sm">Bank Name *</Label>
                        <Input
                          id="bankName"
                          type="text"
                          placeholder="Enter bank name"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="accountNumber" className="text-xs sm:text-sm">Account Number *</Label>
                        <Input
                          id="accountNumber"
                          type="text"
                          placeholder="Enter account number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="accountHolderName" className="text-xs sm:text-sm">Account Holder Name *</Label>
                        <Input
                          id="accountHolderName"
                          type="text"
                          placeholder="Enter account holder name"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="ifscCode" className="text-xs sm:text-sm">IFSC Code *</Label>
                        <Input
                          id="ifscCode"
                          type="text"
                          placeholder="Enter IFSC code"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          className="uppercase text-xs sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="branchName" className="text-xs sm:text-sm">Branch Name</Label>
                        <Input
                          id="branchName"
                          type="text"
                          placeholder="Enter branch name"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {hasBankDetails && (
                      <div className="space-y-1.5 sm:space-y-2 border-t border-neutral-800 pt-3 sm:pt-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="saveForLater"
                            checked={saveForLater}
                            onChange={(e) => setSaveForLater(e.target.checked)}
                            className="rounded border-neutral-800 w-4 h-4 sm:w-5 sm:h-5"
                          />
                          <Label htmlFor="saveForLater" className="cursor-pointer text-xs sm:text-sm">
                            Save bank account details for future requests
                          </Label>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground ml-5 sm:ml-6">
                          Your bank details will be pre-filled for next withdrawal request
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5 sm:space-y-2 border-t border-neutral-800 pt-3 sm:pt-4">
                      <Label htmlFor="bankPassbook" className="text-xs sm:text-sm">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Bank Passbook Image (Alternative)</span>
                        </div>
                      </Label>
                      {!passbookPreview ? (
                        <div className="border-2 border-dashed border-neutral-800 rounded-lg p-3 sm:p-4">
                          <input
                            id="bankPassbook"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="bankPassbook"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mb-1.5 sm:mb-2" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Click to upload passbook image</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">Max size: 5MB</span>
                          </label>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={passbookPreview}
                            alt="Bank passbook preview"
                            className="w-full h-40 sm:h-48 object-contain border border-neutral-800 rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeFile}
                            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Upload bank passbook image as an alternative to filling bank details manually
                      </p>
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

                    <Button type="submit" className="w-full text-xs sm:text-sm" disabled={withdrawing || availableBalance < 10}>
                      {withdrawing ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Withdrawal Request"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Withdrawal History */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    Withdrawal History
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your withdrawal requests</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  {requests.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <Wallet className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">No withdrawal requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {requests.map((request) => (
                        <div key={request._id} className="p-3 sm:p-4 border border-neutral-800 rounded-lg">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-base sm:text-lg">${request.amount.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.requestedAt).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          {request.bankName && (
                            <p className="text-xs text-muted-foreground mb-1">Bank: {request.bankName}</p>
                          )}
                          {request.accountNumber && (
                            <p className="text-xs text-muted-foreground mb-1">Account: {request.accountNumber}</p>
                          )}
                          {request.rejectionReason && (
                            <p className="text-xs text-red-400 mt-1.5 sm:mt-2">Reason: {request.rejectionReason}</p>
                          )}
                          {request.processedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Processed: {new Date(request.processedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

