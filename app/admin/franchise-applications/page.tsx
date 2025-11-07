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
import { TrendingUp, Search, XCircle, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface FranchiseApplication {
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

export default function FranchiseApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<FranchiseApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const url = statusFilter !== "all" ? `/api/admin/franchise-applications?status=${statusFilter}` : "/api/admin/franchise-applications"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        setError("Failed to fetch franchise applications")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchApplications()
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

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.userIdString?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.transactionHash?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const pendingApplications = applications.filter((a) => a.status === "pending")
  const totalPending = pendingApplications.reduce((sum, a) => sum + a.amount, 0)

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
                Franchise Applications
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-neutral-400 max-w-lg">
                Review and process franchise membership applications with deposit details
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Pending Applications
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold">{pendingApplications.length}</div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Total Pending
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">${totalPending.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card className="border-neutral-800 bg-transparent">
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Applications</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-2xl sm:text-3xl font-bold">{applications.length}</div>
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

            {/* Applications Table */}
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
                <CardTitle className="text-base sm:text-lg">Franchise Applications</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Review and process franchise membership applications</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No franchise applications found</p>
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
                        {filteredApplications.map((application) => (
                          <TableRow key={application._id}>
                            <TableCell className="text-xs sm:text-sm">
                              <div>
                                <p className="font-medium">{application.userName}</p>
                                <p className="text-muted-foreground text-[10px] sm:text-xs">{application.userEmail}</p>
                                {application.userIdString && (
                                  <p className="text-muted-foreground text-[10px] sm:text-xs">ID: {application.userIdString}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm font-semibold">${application.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{application.network}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {application.transactionHash ? (
                                <p className="font-mono text-[10px] sm:text-xs break-all max-w-[150px]">
                                  {application.transactionHash.substring(0, 20)}...
                                </p>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {new Date(application.requestedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(application.status)}</TableCell>
                            <TableCell>
                              {application.status === "pending" ? (
                                <div className="flex gap-2">
                                  <Link href={`/admin/franchise-applications/${application._id}`}>
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

