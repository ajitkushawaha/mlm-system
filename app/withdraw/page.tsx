"use client"

import { useState, useEffect, Suspense } from "react"
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
import { Wallet, DollarSign, Loader2, CheckCircle, XCircle, Clock, Upload, X, ArrowDownCircle, ArrowUpCircle, Copy, QrCode } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

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

function WithdrawPageContent() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(
    tabParam === "deposit" ? "deposit" : "withdraw"
  )
  
  // Deposit form state
  const [depositAmount, setDepositAmount] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [depositNotes, setDepositNotes] = useState("")
  const [proofImage, setProofImage] = useState<string | null>(null) // Store as base64 string
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [submittingDeposit, setSubmittingDeposit] = useState(false)
  const [depositRequests, setDepositRequests] = useState<Array<{
    _id: string
    amount: number
    status: string
    requestedAt: string
  }>>([])
  const [copied, setCopied] = useState(false)
  
  // Withdrawal form state
  const [withdrawalMethod, setWithdrawalMethod] = useState<"bank" | "crypto">("bank")
  const [amount, setAmount] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [branchName, setBranchName] = useState("")
  const [bankPassbook, setBankPassbook] = useState<string | null>(null) // Store as base64 string
  const [passbookPreview, setPassbookPreview] = useState<string | null>(null)
  const [saveForLater, setSaveForLater] = useState(true) // Default to true - bank details will be pre-filled for next withdrawal request
  // Crypto withdrawal fields
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState("")
  const cryptoNetwork = "BEP20" // Fixed to BEP20 only
  const [cryptoQrCode, setCryptoQrCode] = useState<string | null>(null) // Store as base64 string
  const [cryptoQrPreview, setCryptoQrPreview] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  const BEP20_ADDRESS = "0x6330a4a6bB6423e7F3A3BF3dFdeB46F38919Fef0"
  
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
  
  const fetchDepositRequests = async () => {
    try {
      const response = await fetch("/api/deposit/requests")
      if (response.ok) {
        const data = await response.json()
        setDepositRequests(data.requests || [])
      }
    } catch (err) {
      console.error("Failed to fetch deposit requests:", err)
    }
  }
  
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    const depositAmountValue = parseFloat(depositAmount)
    if (!depositAmountValue || depositAmountValue <= 0) {
      setError("Please enter a valid deposit amount")
      return
    }
    
    if (!transactionHash && !proofImage) {
      setError("Please provide either transaction hash or proof image")
      return
    }
    
    setSubmittingDeposit(true)
    
    try {
      const requestBody: {
        amount: number
        transactionHash: string
        notes: string
        network: string
        proofImage: string
      } = {
        amount: depositAmountValue,
        transactionHash: transactionHash || "",
        notes: depositNotes || "",
        network: "BEP20",
        proofImage: proofImage || "", // Send base64 string
      }
      
      const response = await fetch("/api/deposit/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess("Deposit request submitted successfully! Admin will review and credit your Main Wallet.")
        setDepositAmount("")
        setTransactionHash("")
        setDepositNotes("")
        setProofImage(null)
        setProofPreview(null)
        fetchDepositRequests()
      } else {
        setError(data.error || "Failed to submit deposit request")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSubmittingDeposit(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchRequests()
      fetchDepositRequests()
      loadSavedBankDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Load saved bank details when switching to withdraw tab and bank method
  useEffect(() => {
    if (user && activeTab === "withdraw" && withdrawalMethod === "bank") {
      loadSavedBankDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, withdrawalMethod, user])

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
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setBankPassbook(base64String) // Store base64 string
        setPassbookPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setBankPassbook(null)
    setPassbookPreview(null)
  }

  const handleCryptoQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setCryptoQrCode(base64String) // Store base64 string
        setCryptoQrPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCryptoQr = () => {
    setCryptoQrCode(null)
    setCryptoQrPreview(null)
  }

  // Generate allowed withdrawal amounts: 10, 20, 30, 40, 50, etc. (increments of $10)
  const getAllowedAmounts = (maxAmount: number) => {
    const amounts: number[] = []
    let current = 10
    while (current <= maxAmount && current <= 100000) {
      amounts.push(current)
      current += 10
    }
    return amounts
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Validate based on withdrawal method
    if (withdrawalMethod === "bank") {
      const hasBankDetails = bankName && accountNumber && accountHolderName && ifscCode
      const hasPassbook = bankPassbook
      
      if (!hasBankDetails) {
        setError("Please provide all required bank details")
        return
      }
      if (!hasPassbook) {
        setError("Please upload bank passbook image")
        return
      }
    } else if (withdrawalMethod === "crypto") {
      // Wallet address is required
      if (!cryptoWalletAddress || cryptoWalletAddress.trim() === "") {
        setError("Please enter your crypto wallet address")
        return
      }
      // QR code is required
      if (!cryptoQrCode) {
        setError("Please upload crypto wallet QR code")
        return
      }
      // Validate wallet address format
      // Validate BEP20 address (starts with 0x, at least 26 characters)
      if (!cryptoWalletAddress.startsWith("0x") || cryptoWalletAddress.length < 26) {
        setError("Invalid wallet address. BEP20 addresses should start with 0x and be at least 26 characters")
        return
      }
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

    // Validate amount is in allowed list (10, 20, 30, 40, etc.) and is a multiple of 10
    if (withdrawAmount < 10 || withdrawAmount % 10 !== 0) {
      setError("Withdrawal amount must be at least $10 and a multiple of $10")
      return
    }
    
    const allowedAmounts = getAllowedAmounts(availableBalance)
    if (!allowedAmounts.includes(withdrawAmount)) {
      setError(`Amount exceeds available balance. Maximum: $${Math.floor(availableBalance / 10) * 10}`)
      return
    }

    setWithdrawing(true)

    try {
      const requestBody: {
        amount: number
        withdrawalMethod: "bank" | "crypto"
        bankName?: string
        accountNumber?: string
        accountHolderName?: string
        ifscCode?: string
        branchName?: string
        saveForLater?: boolean
        bankPassbookImage?: string
        cryptoWalletAddress?: string
        cryptoNetwork?: string
        cryptoQrCodeImage?: string
      } = {
        amount: withdrawAmount,
        withdrawalMethod: withdrawalMethod,
      }
      
      if (withdrawalMethod === "bank") {
        requestBody.bankName = bankName || ""
        requestBody.accountNumber = accountNumber || ""
        requestBody.accountHolderName = accountHolderName || ""
        requestBody.ifscCode = ifscCode || ""
        requestBody.branchName = branchName || ""
        requestBody.saveForLater = saveForLater
        requestBody.bankPassbookImage = bankPassbook || "" // Send base64 string
      } else if (withdrawalMethod === "crypto") {
        requestBody.cryptoWalletAddress = cryptoWalletAddress || ""
        requestBody.cryptoNetwork = cryptoNetwork
        requestBody.cryptoQrCodeImage = cryptoQrCode || "" // Send base64 string
      }

      const response = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Withdrawal request submitted successfully! Admin will review and process it.")
        setAmount("")
        if (withdrawalMethod === "bank") {
          // Only clear bank details if not saved for later
          if (!saveForLater) {
            setBankName("")
            setAccountNumber("")
            setAccountHolderName("")
            setIfscCode("")
            setBranchName("")
            setSaveForLater(false)
          }
          // If saveForLater is true, keep the details and checkbox checked
          setBankPassbook(null)
          setPassbookPreview(null)
        } else if (withdrawalMethod === "crypto") {
          setCryptoWalletAddress("")
          // Network is fixed to BEP20
          setCryptoQrCode(null)
          setCryptoQrPreview(null)
        }
        fetchRequests()
        // Refresh user data to get updated savedBankDetails if saveForLater was checked
        if (saveForLater && withdrawalMethod === "bank") {
          await refreshUser()
          // Small delay to ensure user data is updated before loading saved details
          setTimeout(() => {
            loadSavedBankDetails()
          }, 100)
        }
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
                Deposit / Withdraw
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Manage your Main Wallet deposits and withdrawals
              </p>
            </div>

            {/* Deposit/Withdraw Section with Tabs */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">Deposit / Withdraw</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage your Main Wallet deposits and withdrawals</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-4 sm:mb-6 border-b border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("deposit")
                      setError("")
                      setSuccess("")
                    }}
                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-[3px] rounded-t-lg ${
                      activeTab === "deposit"
                        ? "border-primary text-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-neutral-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ArrowDownCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "deposit" ? "text-primary" : ""}`} />
                      <span className={activeTab === "deposit" ? "font-bold" : ""}>Deposit</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("withdraw")
                      setError("")
                      setSuccess("")
                    }}
                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all border-b-[3px] rounded-t-lg ${
                      activeTab === "withdraw"
                        ? "border-primary text-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-neutral-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ArrowUpCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "withdraw" ? "text-primary" : ""}`} />
                      <span className={activeTab === "withdraw" ? "font-bold" : ""}>Withdraw</span>
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "deposit" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left: Deposit Info */}
                    <div className="space-y-4 sm:space-y-5">
                      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                        <div className="bg-white p-2 sm:p-3 rounded-lg border-2 border-primary/20">
                          <Image
                            src="/w3qr.jpeg"
                            alt="BEP20 Deposit QR Code"
                            width={200}
                            height={200}
                            className="w-32 h-32 sm:w-40 sm:h-40"
                            priority
                          />
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                          Scan QR code with your crypto wallet
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] sm:text-xs font-semibold">BEP20 Address (BSC)</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                            <p className="text-[10px] sm:text-xs font-mono break-all text-muted-foreground">
                              {BEP20_ADDRESS}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3"
                          >
                            {copied ? (
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                        <h4 className="font-semibold text-[10px] sm:text-xs">Instructions:</h4>
                        <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-1 list-disc list-inside">
                          <li>Send only BEP20 tokens (BSC Network)</li>
                          <li>Do NOT send from other networks</li>
                          <li>Verify address before sending</li>
                          <li>Submit proof after sending</li>
                        </ul>
                      </div>

                      <Alert className="bg-yellow-500/10 border-yellow-500/20 text-[10px] sm:text-xs">
                        <AlertDescription className="text-[10px] sm:text-xs text-yellow-400">
                          <strong>Important:</strong> Always verify the address and use BSC network only.
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* Right: Deposit Form */}
                    <div className="space-y-3 sm:space-y-4">
                      <form onSubmit={handleSubmitDeposit} className="space-y-3 sm:space-y-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor="depositAmount" className="text-[10px] sm:text-xs">Deposit Amount (USD)</Label>
                          <Input
                            id="depositAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            required
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor="transactionHash" className="text-[10px] sm:text-xs">Transaction Hash (Optional)</Label>
                          <Input
                            id="transactionHash"
                            type="text"
                            placeholder="0x..."
                            value={transactionHash}
                            onChange={(e) => setTransactionHash(e.target.value)}
                            className="text-[10px] sm:text-xs font-mono"
                          />
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                            From wallet or blockchain explorer
                          </p>
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor="proofImage" className="text-[10px] sm:text-xs">
                            <div className="flex items-center space-x-1.5">
                              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Proof Image</span>
                            </div>
                          </Label>
                          {!proofPreview ? (
                            <div className="border-2 border-dashed border-neutral-800 rounded-lg p-2 sm:p-3">
                              <input
                                id="proofImage"
                                type="file"
                                accept="image/*"
                                onChange={handleProofImageChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="proofImage"
                                className="cursor-pointer flex flex-col items-center justify-center"
                              >
                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mb-1 sm:mb-1.5" />
                                <span className="text-[10px] sm:text-xs text-muted-foreground">Click to upload</span>
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Max 5MB</span>
                              </label>
                            </div>
                          ) : (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={proofPreview}
                                alt="Proof preview"
                                className="w-full h-32 sm:h-40 object-contain border border-neutral-800 rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={removeProofImage}
                                className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 p-0"
                              >
                                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor="depositNotes" className="text-[10px] sm:text-xs">Notes (Optional)</Label>
                          <Input
                            id="depositNotes"
                            type="text"
                            placeholder="Additional information..."
                            value={depositNotes}
                            onChange={(e) => setDepositNotes(e.target.value)}
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        
                        {error && activeTab === "deposit" && (
                          <Alert variant="destructive" className="text-[10px] sm:text-xs">
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <AlertDescription className="text-[10px] sm:text-xs">{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        {success && activeTab === "deposit" && (
                          <Alert className="bg-green-500/10 border-green-500/20 text-[10px] sm:text-xs">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            <AlertDescription className="text-[10px] sm:text-xs text-green-500">{success}</AlertDescription>
                          </Alert>
                        )}
                        
                        <Button 
                          type="submit" 
                          className="w-full text-[10px] sm:text-xs" 
                          disabled={submittingDeposit || (!transactionHash && !proofImage)}
                        >
                          {submittingDeposit ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Deposit Request"
                          )}
                        </Button>
                      </form>
                      
                      {depositRequests.length > 0 && (
                        <div className="border-t border-neutral-800 pt-3 sm:pt-4 mt-3 sm:mt-4">
                          <h4 className="font-semibold text-[10px] sm:text-xs mb-2 sm:mb-3">Your Deposit Requests</h4>
                          <div className="space-y-1.5 sm:space-y-2 max-h-48 overflow-y-auto">
                            {depositRequests.map((request) => (
                              <div key={request._id} className="p-2 border border-neutral-800 rounded-lg">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-1.5 sm:gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs sm:text-sm">${request.amount.toFixed(2)}</p>
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                                      {new Date(request.requestedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge 
                                    className={
                                      request.status === "approved" 
                                        ? "bg-green-500/20 text-green-400 border-green-500/50 text-[9px] sm:text-[10px]"
                                        : request.status === "rejected"
                                        ? "bg-red-500/20 text-red-400 border-red-500/50 text-[9px] sm:text-[10px]"
                                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[9px] sm:text-[10px]"
                                    }
                                  >
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Withdrawal Form */}
                    <Card className="border-neutral-800 bg-transparent">
                      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          Request Withdrawal
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Withdraw from your Main Wallet</CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 max-h-[600px] sm:max-h-[700px] overflow-y-auto">
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
                                    const numVal = parseFloat(val)
                                    // Allow empty, or numbers that are multiples of 10 and within balance
                                    if (val === "" || (numVal > 0 && numVal % 10 === 0 && numVal <= availableBalance)) {
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
                                    setAmount(allowedAmounts[0].toString())
                                  } else {
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
                              Click &quot;Add&quot; to cycle through allowed amounts: $10 → $20 → $30 → $40 → etc.
                            </p>
                          </div>

                          {/* Withdrawal Method Selection */}
                          <div className="space-y-3 sm:space-y-4 border-t border-neutral-800 pt-3 sm:pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <p className="text-xs sm:text-sm font-semibold">Withdrawal Method</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant={withdrawalMethod === "bank" ? "default" : "outline"}
                                onClick={() => setWithdrawalMethod("bank")}
                                className={`w-full ${withdrawalMethod === "bank" ? "bg-primary text-primary-foreground" : ""}`}
                              >
                                Bank Account
                              </Button>
                              <Button
                                type="button"
                                variant={withdrawalMethod === "crypto" ? "default" : "outline"}
                                onClick={() => setWithdrawalMethod("crypto")}
                                className={`w-full ${withdrawalMethod === "crypto" ? "bg-primary text-primary-foreground" : ""}`}
                              >
                                Crypto
                              </Button>
                            </div>
                          </div>

                          {/* Bank Account Details */}
                          {withdrawalMethod === "bank" && (
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

                            {(bankName && accountNumber && accountHolderName && ifscCode) && (
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
                                  <span>Bank Passbook Image *</span>
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
                                Upload bank passbook image (required)
                              </p>
                            </div>
                          </div>
                          )}

                          {/* Crypto Withdrawal Details */}
                          {withdrawalMethod === "crypto" && (
                          <div className="space-y-3 sm:space-y-4 border-t border-neutral-800 pt-3 sm:pt-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <p className="text-xs sm:text-sm font-semibold">Crypto Wallet Details</p>
                            </div>
                            
                            <div className="space-y-1.5 sm:space-y-2">
                              <Label className="text-xs sm:text-sm">Network</Label>
                              <div className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs sm:text-sm text-foreground">
                                BEP20 (Binance Smart Chain)
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                              <Label htmlFor="cryptoWalletAddress" className="text-xs sm:text-sm">Wallet Address *</Label>
                              <Input
                                id="cryptoWalletAddress"
                                type="text"
                                placeholder="Enter BEP20 wallet address (starts with 0x)"
                                value={cryptoWalletAddress}
                                onChange={(e) => setCryptoWalletAddress(e.target.value)}
                                className="text-xs sm:text-sm font-mono"
                                required
                              />
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                BEP20 addresses start with &apos;0x&apos; and are 42 characters long
                              </p>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2 border-t border-neutral-800 pt-3 sm:pt-4">
                              <Label htmlFor="cryptoQrCode" className="text-xs sm:text-sm">
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>Crypto Wallet QR Code *</span>
                                </div>
                              </Label>
                              {!cryptoQrPreview ? (
                                <div className="border-2 border-dashed border-neutral-800 rounded-lg p-3 sm:p-4">
                                  <input
                                    id="cryptoQrCode"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCryptoQrChange}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="cryptoQrCode"
                                    className="cursor-pointer flex flex-col items-center justify-center"
                                  >
                                    <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mb-1.5 sm:mb-2" />
                                    <span className="text-xs sm:text-sm text-muted-foreground">Click to upload QR code image</span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">Max size: 5MB</span>
                                  </label>
                                </div>
                              ) : (
                                <div className="relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cryptoQrPreview}
                                    alt="Crypto QR code preview"
                                    className="w-full h-40 sm:h-48 object-contain border border-neutral-800 rounded-lg"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={removeCryptoQr}
                                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                                  >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              )}
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Upload QR code image (required)
                              </p>
                            </div>
                          </div>
                          )}

                          {error && activeTab === "withdraw" && (
                            <Alert variant="destructive" className="text-xs sm:text-sm">
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                            </Alert>
                          )}

                          {success && activeTab === "withdraw" && (
                            <Alert className="bg-green-500/10 border-green-500/20 text-xs sm:text-sm">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              <AlertDescription className="text-xs sm:text-sm text-green-500">{success}</AlertDescription>
                            </Alert>
                          )}

                          <Button 
                            type="submit" 
                            className="w-full text-xs sm:text-sm" 
                            disabled={withdrawing || availableBalance < 10}
                          >
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
                          <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
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
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function WithdrawPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <WithdrawPageContent />
    </Suspense>
  )
}

