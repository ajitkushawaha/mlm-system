"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Target, BarChart3 } from "lucide-react"

interface NetworkStats {
  totalNetworkSize: number
  leftLegSize: number
  rightLegSize: number
  potentialPairs: number
  directReferrals: number
  balanceRatio: number
}

export function NetworkAnalytics() {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/network/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch network stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load network analytics</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Network Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Network Overview</span>
          </CardTitle>
          <CardDescription>Your binary network statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{stats.totalNetworkSize}</div>
              <div className="text-xs text-muted-foreground">Total Network</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.potentialPairs}</div>
              <div className="text-xs text-muted-foreground">Potential Pairs</div>
            </div>
          </div>

          {/* Leg Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Left Leg</span>
              <span className="text-sm font-bold text-green-600">{stats.leftLegSize}</span>
            </div>
            <Progress
              value={(stats.leftLegSize / Math.max(stats.leftLegSize, stats.rightLegSize, 1)) * 100}
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Right Leg</span>
              <span className="text-sm font-bold text-blue-600">{stats.rightLegSize}</span>
            </div>
            <Progress
              value={(stats.rightLegSize / Math.max(stats.leftLegSize, stats.rightLegSize, 1)) * 100}
              className="h-2"
            />
          </div>

          {/* Balance Status */}
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Balance Status</span>
              <Badge className={`${balanceStatus.bgColor} ${balanceStatus.color}`}>{balanceStatus.status}</Badge>
            </div>
            <Progress value={balancePercentage} className="h-2 mb-2" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Leg Distribution</span>
          </CardTitle>
          <CardDescription>Visual breakdown of your network structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={legData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Left Leg ({stats.leftLegSize})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Right Leg ({stats.rightLegSize})</span>
            </div>
          </div>

          {/* Growth Recommendations */}
          <div className="mt-6 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Growth Recommendations
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {stats.leftLegSize === 0 && <li>• Add your first member to the left leg</li>}
              {stats.rightLegSize === 0 && <li>• Add your first member to the right leg</li>}
              {stats.leftLegSize < stats.rightLegSize && <li>• Focus on growing your left leg for better balance</li>}
              {stats.rightLegSize < stats.leftLegSize && <li>• Focus on growing your right leg for better balance</li>}
              {stats.leftLegSize === stats.rightLegSize && stats.totalNetworkSize > 0 && (
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
