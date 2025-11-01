"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Users, Award } from "lucide-react"

interface Activity {
  id: string
  type: "payout" | "referral" | "upgrade" | "bonus"
  description: string
  amount?: number
  timestamp: Date
  status: "completed" | "pending" | "failed"
}

// Mock data - in real app, this would come from API
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "payout",
    description: "Pair income from Green ID",
    amount: 760,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "completed",
  },
  {
    id: "2",
    type: "referral",
    description: "New member joined your left leg",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: "completed",
  },
  {
    id: "3",
    type: "bonus",
    description: "Direct bonus from referral",
    amount: 100,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: "completed",
  },
]

export function RecentActivity() {
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest transactions and network updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center space-x-3">
                {getActivityIcon(activity.type)}
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activity.amount && (
                  <span className="text-sm font-semibold text-green-600">+{formatCurrency(activity.amount)}</span>
                )}
                {getStatusBadge(activity.status)}
              </div>
            </div>
          ))}

          {mockActivities.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
