"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Users, Award, Loader2 } from "lucide-react"

interface Activity {
  id: string
  type: "payout" | "referral" | "upgrade" | "bonus"
  description: string
  amount?: number
  timestamp: Date | string
  status: "completed" | "pending" | "failed"
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/activity/recent?limit=10")
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error)
    } finally {
      setLoading(false)
    }
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payout":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "referral":
        return <Users className="w-4 h-4 text-blue-600" />
      case "upgrade":
        return <Award className="w-4 h-4 text-yellow-600" />
      case "bonus":
        return <TrendingUp className="w-4 h-4 text-purple-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>
      default:
        return null
    }
  }

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      return dateObj.toLocaleDateString()
    }
  }

  return (
    <Card className="border-neutral-800 bg-transparent">
      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your latest transactions and network updates</CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-neutral-800 bg-neutral-900/50"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-auto sm:ml-0">
                  {activity.amount && (
                    <span className="text-xs sm:text-sm font-semibold text-green-500 whitespace-nowrap">
                      +{formatCurrency(activity.amount)}
                    </span>
                  )}
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
