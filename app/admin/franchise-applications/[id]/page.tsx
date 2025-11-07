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
import { ArrowLeft, CheckCircle, XCircle, Loader2, TrendingUp, Hash, Image as ImageIcon, FileText } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface FranchiseApplication {
  _id: string
  userId: string
  userName: string
  userEmail: string
  userIdString?: string
  amount: number
  bonusPercent?: number
  bonusAmount?: number
  totalCredit?: number
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  processedAt?: string
  rejectionReason?: string
  transactionHash?: string
  proofImage?: string
  notes?: string
  network: string
}

export default function FranchiseApplicationDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const [application, setApplication] = useState<FranchiseApplication | null>(null)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; userId?: string; phone?: string } | null>(null)
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
    if (user?.role === "admin" && applicationId) {
      fetchApplication()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applicationId])

  const fetchApplication = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/franchise-applications/${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
        setUserInfo(data.user)
      } else {
        setError("Failed to fetch franchise application")
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
      const response = await fetch("/api/admin/franchise-applications/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action: "approve" }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Franchise application approved and credited to user's Franchise Wallet")
        fetchApplication()
        setTimeout(() => {
          router.push("/admin/franchise-applications")
        }, 2000)
      } else {
        setError(data.error || "Failed to approve franchise application")
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
      const response = await fetch("/api/admin/franchise-applications/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action: "reject", rejectionReason }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Franchise application rejected")
        fetchApplication()
        setShowRejectModal(false)
        setRejectionReason("")
        setTimeout(() => {
          router.push("/admin/franchise-applications")
        }, 2000)
      } else {
        setError(data.error || "Failed to reject franchise application")
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

  if (!user || user.role !== "admin" || !application) {
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
              <Link href="/admin/franchise-applications">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                  Franchise Application Details
                </h1>
                <p className="text-[10px] sm:text-xs lg:text-sm text-neutral-400">Review and approve franchise membership applications ($100 fee)</p>
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
              {/* Application Details */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center justify-between gap-2">
                    <span>Application Information</span>
                    {getStatusBadge(application.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Payment Amount</p>
                      <p className="font-semibold text-base sm:text-lg lg:text-xl">${application.amount.toFixed(2)}</p>
                      {application.bonusAmount && application.bonusAmount > 0 && (
                        <div className="mt-1 sm:mt-2 space-y-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Bonus: <span className="text-primary font-semibold">{application.bonusPercent}% (+${application.bonusAmount.toFixed(2)})</span>
                          </p>
                          <p className="text-[10px] sm:text-xs text-green-400 font-semibold">
                            Total Credit: ${application.totalCredit?.toFixed(2) || (application.amount + application.bonusAmount).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Network</p>
                      <p className="font-medium text-xs sm:text-sm">{application.network}</p>
                    </div>
                  </div>

                  {application.transactionHash && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Transaction Hash</p>
                        <p className="font-mono text-[10px] sm:text-xs lg:text-sm break-all">{application.transactionHash}</p>
                        <a
                          href={`https://bscscan.com/tx/${application.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] sm:text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View on BSCScan →
                        </a>
                      </div>
                    </div>
                  )}

                  {application.notes && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Notes</p>
                        <p className="text-xs sm:text-sm break-words">{application.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 sm:gap-3">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Requested At</p>
                      <p className="text-xs sm:text-sm">{new Date(application.requestedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {application.processedAt && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Processed At</p>
                        <p className="text-xs sm:text-sm">{new Date(application.processedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {application.rejectionReason && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Rejection Reason</p>
                        <p className="text-xs sm:text-sm text-red-400 break-words">{application.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Details */}
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Name</p>
                      <p className="font-medium text-xs sm:text-sm break-words">{application.userName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-xs sm:text-sm break-all">{application.userEmail}</p>
                    </div>
                  </div>

                  {userInfo?.phone && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Mobile Number</p>
                        <p className="font-medium text-xs sm:text-sm">{userInfo.phone}</p>
                      </div>
                    </div>
                  )}

                  {application.userIdString && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">User ID</p>
                        <p className="font-medium text-xs sm:text-sm">{application.userIdString}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Proof Image */}
            {application.proofImage && (
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Payment Proof Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="border border-neutral-800 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={application.proofImage}
                      alt="Payment proof"
                      className="w-full h-auto object-contain max-h-64 sm:max-h-96"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {application.status === "pending" && (
              <Card className="border-neutral-800 bg-transparent">
                <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Processing...</span>
                          <span className="sm:hidden">Processing</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Approve & Credit Franchise Wallet</span>
                          <span className="sm:hidden">Approve</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      variant="destructive"
                      className="flex-1 text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
                    >
                      <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                  <CardTitle className="text-sm sm:text-base lg:text-lg">Reject Franchise Application</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Please provide a reason for rejection</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                  <Input
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      variant="destructive"
                      className="flex-1 text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Processing...</span>
                          <span className="sm:hidden">Processing</span>
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
                      className="flex-1 text-[10px] sm:text-xs lg:text-sm h-9 sm:h-10"
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

