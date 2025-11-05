"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowLeft, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function NetworkStats() {
  const { user } = useAuth()

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {/* Connection Structure */}
      <Card className="border-neutral-800 bg-transparent">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Connection Structure</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your binary tree structure</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Binary Tree Visual */}
            <div className="flex justify-center">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs sm:text-sm font-bold text-primary-foreground">YOU</span>
                </div>
                <div className="flex justify-center space-x-6 sm:space-x-8 mt-3 sm:mt-4">
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mb-1 mx-auto">
                      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium">Left Leg</p>
                    <p className="text-base sm:text-lg font-bold text-green-600">{user?.leftDirects || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 border-2 border-blue-500 rounded-full flex items-center justify-center mb-1 mx-auto">
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium">Right Leg</p>
                    <p className="text-base sm:text-lg font-bold text-blue-600">{user?.rightDirects || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Status */}
            <div className="pt-3 sm:pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Balance Status:</span>
                {user?.leftDirects && user?.rightDirects ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">Balanced</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">Needs Balance</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
                {user?.leftDirects && user?.rightDirects
                  ? "Great! Both legs have members. Continue growing both sides equally."
                  : "Add members to both left and right legs to activate booster and earn payouts."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
