"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, XCircle, Loader2, Wallet, Building2, User, Hash } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface WithdrawalRequest {
  _id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
  withdrawalMethod?: "bank" | "crypto"
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
  ifscCode?: string
  branchName?: string
  bankPassbookImage?: string // Base64 string
  cryptoWalletAddress?: string
  cryptoNetwork?: "BEP20" | "ERC20" | "TRC20"
  cryptoQrCodeImage?: string // Base64 string
}

export default function WithdrawalDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<WithdrawalRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === "admin" && requestId) {
      fetchRequest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, requestId])

  const fetchRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/withdrawals/${requestId}`)
      if (response.ok) {
        const data = await response.json()
        setRequest(data.request)
      } else {
        setError("Failed to fetch withdrawal request")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setProcessing(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/withdrawals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve" }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Withdrawal request approved successfully")
        fetchRequest()
        setTimeout(() => {
          router.push("/admin/withdrawals")
        }, 2000)
      } else {
        setError(data.error || "Failed to approve withdrawal")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }

    setProcessing(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/withdrawals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "reject", rejectionReason }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Withdrawal request rejected")
        fetchRequest()
        setShowRejectModal(false)
        setRejectionReason("")
        setTimeout(() => {
          router.push("/admin/withdrawals")
        }, 2000)
      } else {
        setError(data.error || "Failed to reject withdrawal")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setProcessing(false)
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

  if (!user || user.role !== "admin" || !request) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <BackgroundBeams />
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/admin/withdrawals">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                  Withdrawal Request Details
                </h1>
                <p className="text-[10px] sm:text-xs lg:text-sm text-neutral-400 max-w-lg">Review bank details and process withdrawal request</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <AlertDescription className="text-green-500">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Request Information */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary" />
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Amount</span>
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">${request.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Status</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">User</span>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium break-words">{request.userName}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground break-all">{request.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Requested Date</span>
                    <span className="text-xs sm:text-sm">{new Date(request.requestedAt).toLocaleString()}</span>
                  </div>
                  {request.processedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">Processed Date</span>
                      <span className="text-xs sm:text-sm">{new Date(request.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {request.rejectionReason && (
                    <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-[10px] sm:text-xs font-medium text-red-400 mb-1">Rejection Reason</p>
                      <p className="text-xs sm:text-sm text-red-300 break-words">{request.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Details or Crypto Details */}
              {request.withdrawalMethod === "crypto" ? (
                <Card className="border-neutral-800 bg-transparent">
                  <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                    <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                      <Wallet className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-accent" />
                      Crypto Wallet Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                    {request.cryptoNetwork && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Network</p>
                          <p className="font-medium text-xs sm:text-sm">{request.cryptoNetwork}</p>
                        </div>
                      </div>
                    )}
                    {request.cryptoWalletAddress && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Wallet Address</p>
                          <p className="font-medium font-mono text-[10px] sm:text-xs break-all">{request.cryptoWalletAddress}</p>
                        </div>
                      </div>
                    )}
                    {request.cryptoQrCodeImage && (
                      <div className="border-t border-neutral-800 pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm font-medium mb-2">QR Code Image</p>
                        <div className="border border-neutral-800 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={request.cryptoQrCodeImage}
                            alt="Crypto QR code"
                            className="w-full h-auto object-contain max-h-64 sm:max-h-96"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-neutral-800 bg-transparent">
                  <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                    <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-accent" />
                      Bank Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                    {/* Bank Details */}
                    {request.bankName && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Bank Name</p>
                          <p className="font-medium text-xs sm:text-sm break-words">{request.bankName}</p>
                        </div>
                      </div>
                    )}
                    {request.accountHolderName && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Account Holder Name</p>
                          <p className="font-medium text-xs sm:text-sm break-words">{request.accountHolderName}</p>
                        </div>
                      </div>
                    )}
                    {request.accountNumber && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Account Number</p>
                          <p className="font-medium font-mono text-xs sm:text-sm break-all">{request.accountNumber}</p>
                        </div>
                      </div>
                    )}
                    {request.ifscCode && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">IFSC Code</p>
                          <p className="font-medium font-mono uppercase text-xs sm:text-sm">{request.ifscCode}</p>
                        </div>
                      </div>
                    )}
                    {request.branchName && (
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Branch Name</p>
                          <p className="font-medium text-xs sm:text-sm break-words">{request.branchName}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Bank Passbook Image */}
                    {request.bankPassbookImage && (
                      <div className="border-t border-neutral-800 pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm font-medium mb-2">Bank Passbook Image</p>
                        <div className="border border-neutral-800 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={request.bankPassbookImage}
                            alt="Bank passbook"
                            className="w-full h-auto object-contain max-h-64 sm:max-h-96"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            {request.status === "pending" && (
              <Card className="border-neutral-800 bg-transparent">
                <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      className="text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
                    >
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="bg-green-500 hover:bg-green-600 text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Processing...</span>
                          <span className="sm:hidden">Processing</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
                <Card className="border-neutral-800 bg-neutral-900 w-full max-w-md">
                  <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                    <CardTitle className="text-sm sm:text-base lg:text-lg">Reject Withdrawal Request</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Please provide a reason for rejection</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-[10px] sm:text-xs font-medium mb-2 block">Rejection Reason *</label>
                      <Input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        required
                        className="text-xs sm:text-sm h-9 sm:h-10"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                      <Button variant="outline" onClick={() => setShowRejectModal(false)} className="text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10">
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectionReason.trim() || processing}
                        className="text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                            <span className="hidden sm:inline">Processing...</span>
                            <span className="sm:hidden">Processing</span>
                          </>
                        ) : (
                          "Confirm Reject"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

