"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Receipt, Target } from "lucide-react"

interface Payout {
  _id: string
  amount: number
  type: "pair" | "direct" | "matching" | "leadership" | "global"
  level: "green" | "blue" | "gold"
  tdsAmount: number
  netAmount: number
  pairDetails?: {
    leftPairs: number
    rightPairs: number
    step?: number
  }
  createdAt: string
  cycleTime: "12am-12pm" | "12pm-12am"
}

interface PayoutSummary {
  totalEarnings: number
  totalTDS: number
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
      default:
        return "bg-gray-100 text-gray-800"
    }
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">Net amount received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total TDS</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalTDS)}</div>
              <p className="text-xs text-muted-foreground">Tax deducted at source</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPayouts}</div>
              <p className="text-xs text-muted-foreground">Number of payouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.avgPayout)}</div>
              <p className="text-xs text-muted-foreground">Per payout average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payout History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your complete earnings and payout history</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Gross Amount</TableHead>
                    <TableHead>TDS</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout._id}>
                      <TableCell className="text-sm">
                        {new Date(payout.createdAt).toLocaleDateString("en-US")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPayoutTypeColor(payout.type)}>{payout.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(payout.level)}>{payout.level.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className="text-red-600">-{formatCurrency(payout.tdsAmount)}</TableCell>
                      <TableCell className="font-bold text-green-600">{formatCurrency(payout.netAmount)}</TableCell>
                      <TableCell className="text-xs">{payout.cycleTime}</TableCell>
                      <TableCell className="text-xs">
                        {payout.pairDetails && (
                          <div>
                            {payout.pairDetails.step && `Step ${payout.pairDetails.step} - `}
                            {payout.pairDetails.leftPairs}L + {payout.pairDetails.rightPairs}R
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Payouts Yet</h3>
              <p className="text-muted-foreground">
                Start building your network to earn your first payout. Remember to maintain balance in both legs!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
