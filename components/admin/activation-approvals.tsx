"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Eye, Loader2, Wallet } from "lucide-react"
import Image from "next/image"

interface ActivationRequest {
  _id: string
  name: string
  email: string
  phone: string
  activationStatus: "pending" | "approved" | "rejected"
  activationPaymentProof?: string
  activatedBy?: string
  isActive: boolean
  franchiseMember?: {
    name: string
    email: string
    franchiseWallet: number
  } | null
}

export function ActivationApprovals() {
  const [activations, setActivations] = useState<ActivationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const fetchActivations = useCallback(async (status: string = "pending") => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/activation/approve?status=${status}`)
      const data = await response.json()

      if (response.ok) {
        setActivations(data.activations || [])
      } else {
        setError(data.error || "Failed to fetch activation requests")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivations()
  }, [fetchActivations])

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setProcessing(userId)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/activation/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(
          action === "approve"
            ? `User activated successfully. ${data.commissionsDistributed || 0} commission(s) distributed.`
            : "Activation rejected",
        )
        // Remove from list
        setActivations(activations.filter((act) => act._id !== userId))
      } else {
        setError(data.error || `Failed to ${action} activation`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      )
    }
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
        <h1 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">User Activation Requests</h1>
        <p className="text-neutral-400 max-w-lg">Review and approve user activations ($10 fee paid by Franchise Member)</p>
      </div>
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader>
          <CardTitle>Pending Activations</CardTitle>
          <CardDescription>Review and approve user activations ($10 fee paid by Franchise Member)</CardDescription>
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

          {activations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending activation requests</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Franchise Member</TableHead>
                  <TableHead>Franchise Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activations.map((activation) => (
                  <TableRow key={activation._id}>
                    <TableCell className="font-medium">{activation.name}</TableCell>
                    <TableCell>{activation.email}</TableCell>
                    <TableCell>
                      {activation.franchiseMember ? (
                        <div>
                          <div className="font-medium">{activation.franchiseMember.name}</div>
                          <div className="text-sm text-muted-foreground">{activation.franchiseMember.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activation.franchiseMember ? (
                        <div className="flex items-center gap-1">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">${activation.franchiseMember.franchiseWallet || 0}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(activation.activationStatus || "pending", activation.isActive)}</TableCell>
                    <TableCell>
                      {activation.activationPaymentProof ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(activation.activationPaymentProof || null)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No proof</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {activation.activationStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(activation._id, "approve")}
                              disabled={processing === activation._id}
                            >
                              {processing === activation._id ? (
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
                              onClick={() => handleAction(activation._id, "reject")}
                              disabled={processing === activation._id}
                            >
                              {processing === activation._id ? (
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
              <h3 className="text-lg font-semibold">Activation Payment Proof</h3>
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

