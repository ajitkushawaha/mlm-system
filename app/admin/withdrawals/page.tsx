"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DollarSign, Search, XCircle, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
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
  bankPassbookImage?: string
  cryptoNetwork?: "BEP20" | "ERC20" | "TRC20"
  cryptoWalletAddress?: string
  cryptoQrCodeImage?: string
}

export default function WithdrawalsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/withdrawals")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setError("Failed to fetch withdrawal requests")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRequests()
    }
  }, [user])


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

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const totalPending = pendingRequests.reduce((sum, r) => sum + r.amount, 0)

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

  if (!user || user.role !== "admin") {
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
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">
                Withdrawal Requests
              </h1>
              <p className="text-neutral-400 max-w-lg">Review and process user withdrawal requests</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingRequests.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">${totalPending.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Pending withdrawal amount</p>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{requests.length}</div>
                  <p className="text-xs text-muted-foreground">All withdrawal requests</p>
                </CardContent>
              </Card>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}


            {/* Filters */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader>
                <CardTitle>All Withdrawal Requests</CardTitle>
                <CardDescription>Review and process user withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-background border border-input rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">User</TableHead>
                            <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                            <TableHead className="text-xs sm:text-sm">Bank</TableHead>
                            <TableHead className="text-xs sm:text-sm">Requested Date</TableHead>
                            <TableHead className="text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground text-xs sm:text-sm">
                                No withdrawal requests found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRequests.map((request) => (
                              <TableRow key={request._id}>
                                <TableCell className="text-xs sm:text-sm">
                                  <div>
                                    <p className="font-medium">{request.userName}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">{request.userEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-xs sm:text-sm">${request.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {request.withdrawalMethod === "crypto" 
                                    ? (request.cryptoNetwork || "Select crypto network")
                                    : (request.bankName || "N/A")}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-xs sm:text-sm">{getStatusBadge(request.status)}</TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  <Link href={`/admin/withdrawals/${request._id}`}>
                                    <Button size="sm" variant="outline" className="text-[10px] sm:text-xs">
                                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      View
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {filteredRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No withdrawal requests found
                        </div>
                      ) : (
                        filteredRequests.map((request) => (
                          <Card key={request._id} className="border-neutral-800 bg-transparent">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">User:</span>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{request.userName}</p>
                                  <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Amount:</span>
                                <span className="text-sm font-semibold">${request.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Bank/Crypto:</span>
                                <span className="text-sm">
                                  {request.withdrawalMethod === "crypto" 
                                    ? (request.cryptoNetwork || "Select crypto network")
                                    : (request.bankName || "N/A")}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Requested Date:</span>
                                <span className="text-sm">{new Date(request.requestedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                                <div>{getStatusBadge(request.status)}</div>
                              </div>
                              <div className="flex justify-end pt-2">
                                <Link href={`/admin/withdrawals/${request._id}`}>
                                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}


