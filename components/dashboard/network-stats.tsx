"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowLeft, ArrowRight, Target } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function NetworkStats() {
  const { user } = useAuth()

  const getProgressToNextLevel = () => {
    if (user?.membershipLevel === "green") {
      const progress = ((user.greenPayouts || 0) / 6) * 100
      return {
        current: user.greenPayouts || 0,
        target: 6,
        progress,
        label: "payouts to Blue ID",
      }
    } else if (user?.membershipLevel === "blue") {
      const progress = ((user.blueStep || 0) / 10) * 100
      return {
        current: user.blueStep || 0,
        target: 10,
        progress,
        label: "steps to Gold ID",
      }
    }
    return null
  }

  const levelProgress = getProgressToNextLevel()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Network Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Network Structure</span>
          </CardTitle>
          <CardDescription>Your binary tree structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Binary Tree Visual */}
            <div className="flex justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-primary-foreground">YOU</span>
                </div>
                <div className="flex justify-center space-x-8 mt-4">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mb-1">
                      <ArrowLeft className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium">Left Leg</p>
                    <p className="text-lg font-bold text-green-600">{user?.leftDirects || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-100 border-2 border-blue-500 rounded-full flex items-center justify-center mb-1">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium">Right Leg</p>
                    <p className="text-lg font-bold text-blue-600">{user?.rightDirects || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Status */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Balance Status:</span>
                {user?.leftDirects && user?.rightDirects ? (
                  <Badge className="bg-green-100 text-green-800">Balanced</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800">Needs Balance</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.leftDirects && user?.rightDirects
                  ? "Great! Both legs have members. Continue growing both sides equally."
                  : "Add members to both left and right legs to activate booster and earn payouts."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Level Progress</span>
          </CardTitle>
          <CardDescription>Track your advancement to the next level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Level:</span>
              <Badge
                className={`${
                  user?.membershipLevel === "green"
                    ? "bg-green-500"
                    : user?.membershipLevel === "blue"
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                } text-white`}
              >
                {user?.membershipLevel?.toUpperCase()} ID
              </Badge>
            </div>

            {/* Progress to Next Level */}
            {levelProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress to next level:</span>
                  <span className="text-sm font-medium">
                    {levelProgress.current}/{levelProgress.target} {levelProgress.label}
                  </span>
                </div>
                <Progress value={levelProgress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {levelProgress.target - levelProgress.current} more {levelProgress.label}
                </p>
              </div>
            )}

            {/* Level Benefits */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Current Level Benefits:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {user?.membershipLevel === "green" && (
                  <>
                    <li>• $760 per pair (after TDS)</li>
                    <li>• 2 cycle timings daily</li>
                    <li>• Auto upgrade after 6 payouts</li>
                  </>
                )}
                {user?.membershipLevel === "blue" && (
                  <>
                    <li>• 10-step progression system</li>
                    <li>• Up to $5.39M earning potential</li>
                    <li>• Progressive pair requirements</li>
                  </>
                )}
                {user?.membershipLevel === "gold" && (
                  <>
                    <li>• Leadership bonuses</li>
                    <li>• Global sharing bonus</li>
                    <li>• Company profit sharing</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
