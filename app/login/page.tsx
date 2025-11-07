"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true) 

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      })

      const data = await response.json()
      if (response.ok) {
        // Regular users go to dashboard, admins should use admin login page
        if (data.user?.role === "admin") {
          setError("Admin access required. Please use the admin login page.")
          setLoading(false)
          return
        }
        
        // Redirect regular users to dashboard
        window.location.href = "/dashboard"
      } else {
        // Check if error is about inactive account
        if (data.error?.includes("not active") || data.error?.includes("Account is not active")) {
          setError(
            `${data.error} If you have sufficient balance in your Main Wallet (≥$10), you can activate yourself.`,
          )
          // Show link to self-activate in the error message
          return
        }
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">DreamStake</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Welcome back to your DreamStake dashboard</p>
        </div>

        <Card className="border-neutral-800 bg-transparent">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
            <CardTitle className="text-base sm:text-lg">Sign In</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enter your User ID and password to access your account</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant={error.includes("not active") ? "default" : "destructive"} className="text-xs sm:text-sm">
                  <AlertDescription className="text-xs sm:text-sm">
                    {error}
                    {error.includes("not active") && (
                      <div className="mt-2 sm:mt-3">
                        <Link href="/self-activate">
                          <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                            Activate Account with Main Wallet Balance
                          </Button>
                        </Link>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="userId" className="text-xs sm:text-sm">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter your User ID (e.g., DS123456)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  required
                  pattern="DS[0-9]{6}"
                  title="User ID format: DS followed by 6 digits (e.g., DS123456)"
                  className="text-xs sm:text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Format: DS123456</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password (eg.123456)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-xs sm:text-sm pr-10 sm:pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full text-xs sm:text-sm" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
