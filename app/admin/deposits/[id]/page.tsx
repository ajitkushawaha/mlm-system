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
import { ArrowLeft, CheckCircle, XCircle, Loader2, Wallet, Hash, Image as ImageIcon, FileText } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DepositRequest {
  _id: string
  userId: string
  userName: string
  userEmail: string
  userIdString?: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
  transactionHash?: string
  proofImage?: string
  notes?: string
  network: string
}

export default function DepositDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<DepositRequest | null>(null)
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
      const response = await fetch(`/api/admin/deposits/${requestId}`)
      if (response.ok) {
        const data = await response.json()
        setRequest(data.request)
      } else {
        setError("Failed to fetch deposit request")
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
      const response = await fetch("/api/admin/deposits/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve" }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Deposit approved and credited to user's Main Wallet")
        fetchRequest()
        setTimeout(() => {
          router.push("/admin/deposits")
        }, 2000)
      } else {
        setError(data.error || "Failed to approve deposit")
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
      const response = await fetch("/api/admin/deposits/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "reject", rejectionReason }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Deposit request rejected")
        fetchRequest()
        setShowRejectModal(false)
        setRejectionReason("")
        setTimeout(() => {
          router.push("/admin/deposits")
        }, 2000)
      } else {
        setError(data.error || "Failed to reject deposit")
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
            <div className="flex items-center gap-4">
              <Link href="/admin/deposits">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                  Deposit Request Details
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400">Review deposit request and process</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20 text-xs sm:text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Request Details */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <span>Request Information</span>
                    {getStatusBadge(request.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Wallet className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg sm:text-xl">${request.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Network</p>
                      <p className="font-medium">{request.network}</p>
                    </div>
                  </div>

                  {request.transactionHash && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Transaction Hash</p>
                        <p className="font-mono text-xs sm:text-sm break-all">{request.transactionHash}</p>
                        <a
                          href={`https://bscscan.com/tx/${request.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View on BSCScan →
                        </a>
                      </div>
                    </div>
                  )}

                  {request.notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm">{request.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Requested At</p>
                      <p className="text-sm">{new Date(request.requestedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {request.processedAt && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Processed At</p>
                        <p className="text-sm">{new Date(request.processedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {request.rejectionReason && (
                    <div className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-red-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Rejection Reason</p>
                        <p className="text-sm text-red-400">{request.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Details */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-base sm:text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium">{request.userName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{request.userEmail}</p>
                    </div>
                  </div>

                  {request.userIdString && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">User ID</p>
                        <p className="font-medium">{request.userIdString}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Proof Image */}
            {request.proofImage && (
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Proof Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="border border-neutral-800 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.proofImage}
                      alt="Deposit proof"
                      className="w-full h-auto object-contain max-h-96"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {request.status === "pending" && (
              <Card className="border-neutral-800 bg-transparent">
                <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve & Credit Main Wallet
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      variant="destructive"
                      className="flex-1 text-xs sm:text-sm"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-base sm:text-lg">Reject Deposit Request</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Please provide a reason for rejection</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4">
                  <Input
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      variant="destructive"
                      className="flex-1 text-xs sm:text-sm"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Reject"
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectModal(false)
                        setRejectionReason("")
                      }}
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

