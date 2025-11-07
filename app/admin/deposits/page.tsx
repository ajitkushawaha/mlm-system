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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                  <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium flex items-center gap-1 sm:gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span className="truncate">Pending</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold">{pendingRequests.length}</div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                  <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium flex items-center gap-1 sm:gap-2">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    <span className="truncate">Total Pending</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary">${totalPending.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent col-span-2 sm:col-span-1">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
                  <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium">Total Requests</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold">{requests.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-neutral-800 bg-transparent">
              <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, user ID, or transaction hash..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 sm:pl-9 text-xs sm:text-sm h-8 sm:h-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-8 sm:h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm">All Status</SelectItem>
                      <SelectItem value="pending" className="text-xs sm:text-sm">Pending</SelectItem>
                      <SelectItem value="approved" className="text-xs sm:text-sm">Approved</SelectItem>
                      <SelectItem value="rejected" className="text-xs sm:text-sm">Rejected</SelectItem>
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
                <CardTitle className="text-sm sm:text-base lg:text-lg">Deposit Requests</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Review and process user deposit requests</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm">No deposit requests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-full inline-block align-middle">
                      {/* Desktop Table */}
                      <div className="hidden md:block">
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
                                <TableCell className="text-xs sm:text-sm">{getStatusBadge(request.status)}</TableCell>
                                <TableCell className="text-xs sm:text-sm">
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

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-4">
                        {filteredRequests.map((request) => (
                          <Card key={request._id} className="border-neutral-800 bg-transparent">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">User:</span>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{request.userName}</p>
                                  <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                                  {request.userIdString && (
                                    <p className="text-xs text-muted-foreground">ID: {request.userIdString}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Amount:</span>
                                <span className="text-sm font-semibold">${request.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Network:</span>
                                <span className="text-sm">{request.network}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Transaction Hash:</span>
                                <div className="text-right max-w-[60%]">
                                  {request.transactionHash ? (
                                    <p className="font-mono text-xs break-all">
                                      {request.transactionHash.substring(0, 20)}...
                                    </p>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">-</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Date:</span>
                                <span className="text-sm">
                                  {new Date(request.requestedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                                <div>{getStatusBadge(request.status)}</div>
                              </div>
                              {request.status === "pending" && (
                                <div className="flex justify-end pt-2">
                                  <Link href={`/admin/deposits/${request._id}`}>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                      <Eye className="w-4 h-4 mr-1" />
                                      View Details
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
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

