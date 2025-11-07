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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Search, XCircle, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
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

export default function DepositsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<DepositRequest[]>([])
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
      const url = statusFilter !== "all" ? `/api/admin/deposits?status=${statusFilter}` : "/api/admin/deposits"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        setError("Failed to fetch deposit requests")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

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
      req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userIdString?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.transactionHash?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
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

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-beams mb-1 sm:mb-2 font-sans">
                Deposit Requests
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Review and process deposit requests from users
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold">{pendingRequests.length}</div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Total Pending
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">${totalPending.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Requests</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold">{requests.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-neutral-800 bg-transparent">
              <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, user ID, or transaction hash..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Requests Table */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">Deposit Requests</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Review and process user deposit requests</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No deposit requests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">User</TableHead>
                          <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                          <TableHead className="text-xs sm:text-sm">Network</TableHead>
                          <TableHead className="text-xs sm:text-sm">Transaction Hash</TableHead>
                          <TableHead className="text-xs sm:text-sm">Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request._id}>
                            <TableCell className="text-xs sm:text-sm">
                              <div>
                                <p className="font-medium">{request.userName}</p>
                                <p className="text-muted-foreground text-[10px] sm:text-xs">{request.userEmail}</p>
                                {request.userIdString && (
                                  <p className="text-muted-foreground text-[10px] sm:text-xs">ID: {request.userIdString}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm font-semibold">${request.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{request.network}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {request.transactionHash ? (
                                <p className="font-mono text-[10px] sm:text-xs break-all max-w-[150px]">
                                  {request.transactionHash.substring(0, 20)}...
                                </p>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {new Date(request.requestedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              {request.status === "pending" ? (
                                <div className="flex gap-2">
                                  <Link href={`/admin/deposits/${request._id}`}>
                                    <Button variant="outline" size="sm" className="text-[10px] sm:text-xs">
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      View
                                    </Button>
                                  </Link>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Processed</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

