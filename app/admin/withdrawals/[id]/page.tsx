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
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
  ifscCode?: string
  branchName?: string
  bankPassbookImage?: string
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
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/withdrawals">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">
                  Withdrawal Request Details
                </h1>
                <p className="text-neutral-400 max-w-lg">Review bank details and process withdrawal request</p>
              </div>
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

            <div className="grid md:grid-cols-2 gap-6">
              {/* Request Information */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-2xl font-bold text-primary">${request.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">User</span>
                    <div className="text-right">
                      <p className="font-medium">{request.userName}</p>
                      <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Requested Date</span>
                    <span>{new Date(request.requestedAt).toLocaleString()}</span>
                  </div>
                  {request.processedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Processed Date</span>
                      <span>{new Date(request.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {request.rejectionReason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm font-medium text-red-400 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-300">{request.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-accent" />
                    Bank Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.bankPassbookImage ? (
                    <div>
                      <p className="text-sm font-medium mb-2">Bank Passbook Image</p>
                      <div className="border border-neutral-800 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={request.bankPassbookImage}
                          alt="Bank passbook"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {request.bankName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Bank Name</p>
                            <p className="font-medium">{request.bankName}</p>
                          </div>
                        </div>
                      )}
                      {request.accountHolderName && (
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Account Holder Name</p>
                            <p className="font-medium">{request.accountHolderName}</p>
                          </div>
                        </div>
                      )}
                      {request.accountNumber && (
                        <div className="flex items-start gap-3">
                          <Hash className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Account Number</p>
                            <p className="font-medium font-mono">{request.accountNumber}</p>
                          </div>
                        </div>
                      )}
                      {request.ifscCode && (
                        <div className="flex items-start gap-3">
                          <Hash className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">IFSC Code</p>
                            <p className="font-medium font-mono uppercase">{request.ifscCode}</p>
                          </div>
                        </div>
                      )}
                      {request.branchName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Branch Name</p>
                            <p className="font-medium">{request.branchName}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            {request.status === "pending" && (
              <Card className="border-neutral-800 bg-transparent">
                <CardContent className="pt-6">
                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
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
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="border-neutral-800 bg-neutral-900 w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Reject Withdrawal Request</CardTitle>
                    <CardDescription>Please provide a reason for rejection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rejection Reason *</label>
                      <Input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectionReason.trim() || processing}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
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

