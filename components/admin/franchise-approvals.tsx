"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, DollarSign } from "lucide-react"
import Image from "next/image"

interface FranchiseApplication {
  _id: string
  name: string
  email: string
  phone: string
  franchiseStatus: "pending" | "approved" | "rejected"
  franchisePaymentProof?: string
  franchisePurchaseDate?: string
  role?: string
}

export function FranchiseApprovals() {
  const [applications, setApplications] = useState<FranchiseApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [franchiseWalletCredit, setFranchiseWalletCredit] = useState<Record<string, string>>({})

  const fetchApplications = useCallback(async (status: string = "pending") => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/franchise/approve?status=${status}`)
      const data = await response.json()

      if (response.ok) {
        setApplications(data.applications || [])
      } else {
        setError(data.error || "Failed to fetch applications")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setProcessing(userId)
    setError("")
    setSuccess("")

    try {
      const credit = franchiseWalletCredit[userId] ? parseFloat(franchiseWalletCredit[userId]) : 0

      const response = await fetch("/api/admin/franchise/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          franchiseWalletCredit: action === "approve" ? credit : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(
          action === "approve"
            ? `Application approved${credit > 0 ? ` with $${credit} franchise wallet credit` : ""}`
            : "Application rejected",
        )
        // Remove from list
        setApplications(applications.filter((app) => app._id !== userId))
        // Clear credit input
        const newCredits = { ...franchiseWalletCredit }
        delete newCredits[userId]
        setFranchiseWalletCredit(newCredits)
      } else {
        setError(data.error || `Failed to ${action} application`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">Franchise Applications</h1>
        <p className="text-neutral-400 max-w-lg">Review and approve franchise membership applications ($100 fee)</p>
      </div>
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>Review and approve franchise membership applications ($100 fee)</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-500/10 border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">{success}</AlertDescription>
            </Alert>
          )}

          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending franchise applications</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead>Payment Proof</TableHead> */}
                  <TableHead>Franchise Wallet Credit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.phone}</TableCell>
                    <TableCell>{getStatusBadge(app.franchiseStatus)}</TableCell>
                    {/* <TableCell>
                      {app.franchisePaymentProof ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(app.franchisePaymentProof || null)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No proof</span>
                      )}
                    </TableCell> */}
                    <TableCell>
                      {app.franchiseStatus === "pending" && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-24"
                            value={franchiseWalletCredit[app._id] || ""}
                            onChange={(e) =>
                              setFranchiseWalletCredit({ ...franchiseWalletCredit, [app._id]: e.target.value })
                            }
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {app.franchiseStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(app._id, "approve")}
                              disabled={processing === app._id}
                            >
                              {processing === app._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(app._id, "reject")}
                              disabled={processing === app._id}
                            >
                              {processing === app._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-neutral-900 rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Proof</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedImage(null)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative w-full h-auto">
              <Image
                src={selectedImage}
                alt="Payment proof"
                width={800}
                height={600}
                className="rounded-lg"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

