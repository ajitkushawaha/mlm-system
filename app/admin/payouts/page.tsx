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
import { DollarSign, Search, Receipt, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Payout {
  _id: string
  userId: string
  user: {
    name: string
    email: string
    membershipLevel: string
  }
  amount: number
  netAmount?: number
  tdsAmount?: number
  type: string
  level?: number
  createdAt: string
  cycleTime?: number
}

interface PayoutStats {
  totalPayouts: number
  totalAmount: number
  totalTDS?: number
  totalNet?: number
  avgPayout: number
}

export default function AdminPayoutsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchPayouts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page])

  const fetchPayouts = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/payouts?page=${page}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setPayouts(data.payouts || [])
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        setError("Failed to fetch payouts")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const filteredPayouts = payouts.filter(
    (payout) =>
      payout.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payouts...</p>
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
              <h1 className="text-2xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">Payout Management</h1>
              <p className="text-neutral-400 max-w-lg">View and manage all user payouts</p>
            </div>

            {/* Summary Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="border-neutral-800 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPayouts}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card className="border-neutral-800 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                    <p className="text-xs text-muted-foreground">All payouts</p>
                  </CardContent>
                </Card>

                <Card className="border-neutral-800 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.avgPayout || 0)}</div>
                    <p className="text-xs text-muted-foreground">Per payout</p>
                  </CardContent>
                </Card>

                <Card className="border-neutral-800 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                      {formatCurrency(stats.totalNet || stats.totalAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">After deductions</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card className="border-neutral-800 bg-transparent">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>All user payouts from the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">User</TableHead>
                            <TableHead className="text-xs sm:text-sm">Type</TableHead>
                            <TableHead className="text-xs sm:text-sm">Level</TableHead>
                            <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                            <TableHead className="text-xs sm:text-sm">Net Amount</TableHead>
                            <TableHead className="text-xs sm:text-sm">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayouts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground text-xs sm:text-sm">
                                {searchTerm ? "No payouts found matching your search" : "No payouts found"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredPayouts.map((payout) => (
                              <TableRow key={payout._id}>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  <div>
                                    <div>{payout.user?.name || "Unknown"}</div>
                                    <div className="text-[10px] sm:text-xs text-muted-foreground">{payout.user?.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">{payout.type || "N/A"}</Badge>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {payout.level ? (
                                    <Badge className="text-[10px] sm:text-xs">Level {payout.level}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold text-xs sm:text-sm">{formatCurrency(payout.amount)}</TableCell>
                                <TableCell className="text-green-500 text-xs sm:text-sm">
                                  {formatCurrency(payout.netAmount || payout.amount)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  <span>
                                    {new Date(payout.createdAt).toLocaleDateString()}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {filteredPayouts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {searchTerm ? "No payouts found matching your search" : "No payouts found"}
                        </div>
                      ) : (
                        filteredPayouts.map((payout) => (
                          <Card key={payout._id} className="border-neutral-800 bg-transparent">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">User:</span>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{payout.user?.name || "Unknown"}</div>
                                  <div className="text-xs text-muted-foreground">{payout.user?.email}</div>
                                </div>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Type:</span>
                                <Badge variant="outline" className="text-xs">{payout.type || "N/A"}</Badge>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Level:</span>
                                {payout.level ? (
                                  <Badge className="text-xs">Level {payout.level}</Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Amount:</span>
                                <span className="text-sm font-semibold">{formatCurrency(payout.amount)}</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Net Amount:</span>
                                <span className="text-sm font-semibold text-green-500">
                                  {formatCurrency(payout.netAmount || payout.amount)}
                                </span>
                              </div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground font-medium">Date:</span>
                                <span className="text-sm">
                                  {new Date(payout.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
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

