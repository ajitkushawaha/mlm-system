"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Target, BarChart3 } from "lucide-react"

interface ConnectionStats {
  totalConnectionSize: number
  leftLegSize: number
  rightLegSize: number
  potentialPairs: number
  directReferrals: number
  balanceRatio: number
}

export function NetworkAnalytics() {
  const [stats, setStats] = useState<ConnectionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/connection/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch connection stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border-neutral-800 bg-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="border-neutral-800 bg-transparent">
        <CardContent className="p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">Unable to load connection analytics</p>
        </CardContent>
      </Card>
    )
  }

  const legData = [
    { name: "Left Leg", value: stats.leftLegSize, color: "#10b981" },
    { name: "Right Leg", value: stats.rightLegSize, color: "#3b82f6" },
  ]

  const balancePercentage =
    (Math.min(stats.leftLegSize, stats.rightLegSize) / Math.max(stats.leftLegSize, stats.rightLegSize, 1)) * 100

  const getBalanceStatus = () => {
    if (balancePercentage >= 80) return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-100" }
    if (balancePercentage >= 60) return { status: "Good", color: "text-blue-600", bgColor: "bg-blue-100" }
    if (balancePercentage >= 40) return { status: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    return { status: "Needs Work", color: "text-red-600", bgColor: "bg-red-100" }
  }

  const balanceStatus = getBalanceStatus()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Connection Overview */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Connection Overview</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your binary connection statistics</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-2.5 sm:p-3 bg-muted/30 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalConnectionSize}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Connection</div>
            </div>
            <div className="text-center p-2.5 sm:p-3 bg-muted/30 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.potentialPairs}</div>
              <div className="text-xs text-muted-foreground mt-1">Potential Pairs</div>
            </div>
          </div>

          {/* Leg Comparison */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">Left Leg</span>
              <span className="text-xs sm:text-sm font-bold text-green-600">{stats.leftLegSize}</span>
            </div>
            <Progress
              value={(stats.leftLegSize / Math.max(stats.leftLegSize, stats.rightLegSize, 1)) * 100}
              className="h-1.5 sm:h-2"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">Right Leg</span>
              <span className="text-xs sm:text-sm font-bold text-blue-600">{stats.rightLegSize}</span>
            </div>
            <Progress
              value={(stats.rightLegSize / Math.max(stats.leftLegSize, stats.rightLegSize, 1)) * 100}
              className="h-1.5 sm:h-2"
            />
          </div>

          {/* Balance Status */}
          <div className="p-2.5 sm:p-3 rounded-lg border border-neutral-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs sm:text-sm font-medium">Balance Status</span>
              <Badge className={`${balanceStatus.bgColor} ${balanceStatus.color} text-xs`}>{balanceStatus.status}</Badge>
            </div>
            <Progress value={balancePercentage} className="h-1.5 sm:h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {balancePercentage.toFixed(1)}% balanced -{" "}
              {stats.leftLegSize < stats.rightLegSize
                ? "Add more to left leg"
                : stats.rightLegSize < stats.leftLegSize
                  ? "Add more to right leg"
                  : "Perfect balance!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visual Analytics */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Leg Distribution</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Visual breakdown of your connection structure</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="h-40 sm:h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={legData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {legData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} members`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col sm:flex-row justify-center items-center sm:items-start gap-3 sm:gap-6 mt-3 sm:mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm">Left Leg ({stats.leftLegSize})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs sm:text-sm">Right Leg ({stats.rightLegSize})</span>
            </div>
          </div>

          {/* Growth Recommendations */}
          <div className="mt-4 sm:mt-6 p-2.5 sm:p-3 bg-muted/30 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Growth Recommendations
            </h4>
            <ul className="text-xs text-muted-foreground space-y-0.5 sm:space-y-1">
              {stats.leftLegSize === 0 && <li>• Add your first member to the left leg</li>}
              {stats.rightLegSize === 0 && <li>• Add your first member to the right leg</li>}
              {stats.leftLegSize < stats.rightLegSize && <li>• Focus on growing your left leg for better balance</li>}
              {stats.rightLegSize < stats.leftLegSize && <li>• Focus on growing your right leg for better balance</li>}
              {stats.leftLegSize === stats.rightLegSize && stats.totalConnectionSize > 0 && (
                <li>• Perfect balance! Continue growing both legs equally</li>
              )}
              <li>• Current potential pairs: {stats.potentialPairs}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
