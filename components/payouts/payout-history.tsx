"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Receipt, Target } from "lucide-react"
import type { GenerationMeta, ReferralMeta, RoiMeta } from "@/lib/models/Transaction"

interface Payout {
  _id: string
  amount: number
  type: string // Can be old payout types or transaction types (generation, referral, roi, activation, withdrawal, deposit)
  level?: "green" | "blue" | "gold"
  netAmount?: number
  pairDetails?: {
    leftPairs: number
    rightPairs: number
    step?: number
  }
  createdAt: string | Date
  cycleTime?: "12am-12pm" | "12pm-12am"
  source?: "old" | "transaction"
  isDebit?: boolean // true for withdrawals/debits, false/undefined for credits
  meta?: GenerationMeta | ReferralMeta | RoiMeta | Record<string, unknown> // Transaction metadata
}

interface PayoutSummary {
  totalEarnings: number
  totalPayouts: number
  avgPayout: number
}

export function PayoutHistory() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [summary, setSummary] = useState<PayoutSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/payouts/history?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setPayouts(data.payouts)
        setSummary(data.summary)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getPayoutTypeColor = (type: string) => {
    switch (type) {
      case "pair":
        return "bg-green-100 text-green-800"
      case "direct":
        return "bg-blue-100 text-blue-800"
      case "matching":
        return "bg-purple-100 text-purple-800"
      case "leadership":
        return "bg-yellow-100 text-yellow-800"
      case "global":
        return "bg-red-100 text-red-800"
      case "generation":
        return "bg-blue-100 text-blue-800"
      case "referral":
        return "bg-purple-100 text-purple-800"
      case "roi":
        return "bg-yellow-100 text-yellow-800"
      case "activation":
        return "bg-green-100 text-green-800"
      case "withdrawal":
        return "bg-red-100 text-red-800"
      case "deposit":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPayoutTypeLabel = (payout: Payout) => {
    if (payout.type === "generation") {
      const level = (payout.meta as GenerationMeta)?.level
      return `Generation (Level ${level})`
    }
    if (payout.type === "referral") {
      const level = (payout.meta as ReferralMeta)?.level
      return `Referral Income (Level ${level})`
    }
    if (payout.type === "roi") {
      return "ROI"
    }
    if (payout.type === "activation") {
      return "Activation Commission"
    }
    if (payout.type === "withdrawal") {
      return "Withdrawal"
    }
    if (payout.type === "deposit") {
      return "Deposit"
    }
    return payout.type.toUpperCase()
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "gold":
        return "bg-yellow-500 text-white"
      case "blue":
        return "bg-blue-500 text-white"
      default:
        return "bg-green-500 text-white"
    }
  }

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground mt-1">Net amount received</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Payouts</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{summary.totalPayouts}</div>
              <p className="text-xs text-muted-foreground mt-1">Number of payouts</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Average Payout</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(summary.avgPayout)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per payout average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payout History Table */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Payout History</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your complete earnings and payout history</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-3 sm:pb-6">
          {payouts.length > 0 ? (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Level</TableHead>
                        <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Cycle</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout._id}>
                          <TableCell className="text-xs sm:text-sm">
                            {new Date(payout.createdAt).toLocaleDateString("en-US")}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getPayoutTypeColor(payout.type)} text-[10px] sm:text-xs`}>{getPayoutTypeLabel(payout)}</Badge>
                          </TableCell>
                          <TableCell>
                            {payout.level ? (
                              <Badge className={`${getLevelColor(payout.level)} text-[10px] sm:text-xs`}>{payout.level.toUpperCase()}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className={`font-bold text-xs sm:text-sm ${payout.isDebit ? "text-red-500" : "text-green-500"}`}>
                            {payout.isDebit ? "-" : "+"}
                            {formatCurrency(payout.netAmount || payout.amount)}
                          </TableCell>
                          <TableCell className="text-xs hidden sm:table-cell">{payout.cycleTime || "-"}</TableCell>
                          <TableCell className="text-xs hidden md:table-cell">
                            {payout.pairDetails && (
                              <div>
                                {payout.pairDetails.step && `Step ${payout.pairDetails.step} - `}
                                {payout.pairDetails.leftPairs}L + {payout.pairDetails.rightPairs}R
                              </div>
                            )}
                            {payout.type === "generation" && (payout.meta as GenerationMeta)?.downlineUserId && (
                              <div className="text-muted-foreground">From user activation</div>
                            )}
                            {payout.type === "referral" && (payout.meta as ReferralMeta)?.referralUserId && (
                              <div className="text-muted-foreground">From referral ROI</div>
                            )}
                            {payout.type === "roi" && (payout.meta as RoiMeta)?.roiPercentage && (
                              <div className="text-muted-foreground">{(payout.meta as RoiMeta).roiPercentage}% ROI</div>
                            )}
                            {payout.type === "withdrawal" && (
                              <div className="text-muted-foreground">Withdrawal to bank account</div>
                            )}
                            {payout.type === "deposit" && (
                              <div className="text-muted-foreground">Deposit to Main Wallet</div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1} className="text-xs sm:text-sm">
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Receipt className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-1.5 sm:mb-2">No Payouts Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start building your network to earn your first payout. Remember to maintain balance in both legs!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
