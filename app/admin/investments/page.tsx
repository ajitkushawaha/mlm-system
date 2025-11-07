"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { calculateStakingIncome } from "@/lib/staking-calculator"
import { Input } from "@/components/ui/input"
import { TrendingUp, Search, CheckCircle, XCircle, Loader2, DollarSign, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Investment {
  _id: string
  name: string
  email: string
  investmentAmount: number
  investmentDate?: Date | string
  investmentLockPeriod?: number
  investmentUnlockDate?: Date | string
  lastRoiCreditDate?: Date | string
  lastDailyRoiCreditDate?: Date | string
  shakingWallet: number
}

export default function AdminInvestmentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [distributing, setDistributing] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchInvestments()
    }
  }, [user])

  const fetchInvestments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/investments")
      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments || [])
      } else {
        setError("Failed to fetch investments")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleDistributeDailyRoi = async () => {
    setDistributing(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/roi-distribute-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        const foundCount = data.found || 0
        setSuccess(
          `Daily ROI distribution completed. Found ${foundCount} investors, Processed ${data.processed} investments, Skipped ${data.skipped}, Total Daily ROI: $${data.totalRoi}`
        )
        fetchInvestments()
      } else {
        setError(data.error || "Failed to distribute daily ROI")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setDistributing(false)
    }
  }


  const filteredInvestments = investments.filter(
    (inv) =>
      inv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0)
  const monthlyRoi = investments.reduce((sum, inv) => sum + calculateStakingIncome(inv.investmentAmount), 0)

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
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-beams mb-2 font-sans">Investment Management</h1>
            <p className="text-neutral-400 max-w-lg">Manage Staking Wallet investments and ROI distribution</p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalInvestments.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{investments.length} active investments</p>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly ROI</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">${monthlyRoi.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Tiered ROI (4% - 8%) based on investment amounts</p>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI Distribution</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={handleDistributeDailyRoi} disabled={distributing} className="w-full" variant="default">
                    {distributing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Distributing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Distribute Daily ROI
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleDistributeDailyRoi} 
                    disabled={distributing} 
                    className="w-full" 
                    variant="outline"
                    title="Test button for immediate ROI distribution"
                  >
                    {distributing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Distribute Daily ROI (manual)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
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

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
              <CardDescription>View and manage all user investments</CardDescription>
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

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Investment Amount</TableHead>
                      <TableHead>Monthly ROI</TableHead>
                      <TableHead>Investment Date</TableHead>
                      <TableHead>Last ROI Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No active investments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvestments.map((investment) => {
                        const monthlyRoiAmount = calculateStakingIncome(investment.investmentAmount)
                        const roiRate = monthlyRoiAmount > 0 
                          ? ((monthlyRoiAmount / investment.investmentAmount) * 100).toFixed(1)
                          : "0"

                        return (
                          <TableRow key={investment._id}>
                            <TableCell className="font-medium">{investment.name}</TableCell>
                            <TableCell>${investment.investmentAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-green-500 font-semibold">
                              ${monthlyRoiAmount.toFixed(2)} ({roiRate}%)
                            </TableCell>
                            <TableCell>
                              {investment.investmentDate ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {new Date(investment.investmentDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(investment.investmentDate).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not set</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {investment.lastDailyRoiCreditDate ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-green-500">
                                    {new Date(investment.lastDailyRoiCreditDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(investment.lastDailyRoiCreditDate).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span className="text-xs text-blue-400 mt-0.5">(Daily ROI)</span>
                                </div>
                              ) : investment.lastRoiCreditDate ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {new Date(investment.lastRoiCreditDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(investment.lastRoiCreditDate).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span className="text-xs text-yellow-400 mt-0.5">(Monthly ROI)</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Never</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
    </div>
  )
}

