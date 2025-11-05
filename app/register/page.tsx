"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Users, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sponsorCode: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sponsorName, setSponsorName] = useState("")
  const [checkingSponsor, setCheckingSponsor] = useState(false)
  const [registrationCredentials, setRegistrationCredentials] = useState<{
    userId: string
    name: string
    password: string
    sponsorId?: string
    email: string
  } | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get referral code from URL
    const refCode = searchParams.get("ref")
    if (refCode) {
      setFormData((prev) => ({ ...prev, sponsorCode: refCode }))
      checkSponsorStatus(refCode)
    }
  }, [searchParams])

  const checkSponsorStatus = async (sponsorCode: string) => {
    if (!sponsorCode) return

    setCheckingSponsor(true)
    try {
      const response = await fetch(`/api/auth/check-sponsor?sponsorCode=${sponsorCode}`)
      const data = await response.json()

      if (response.ok && data.sponsorName) {
        setSponsorName(data.sponsorName || "")
      } else {
        setSponsorName("")
      }
    } catch (err) {
      console.error("Failed to check sponsor:", err)
      setSponsorName("")
    } finally {
      setCheckingSponsor(false)
    }
  }

  const handleSponsorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setFormData((prev) => ({ ...prev, sponsorCode: code }))
    if (code) {
      checkSponsorStatus(code)
    } else {
      setSponsorName("")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation (no password needed - will be auto-generated)
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Name, email, and phone are required")
      return
    }

    setLoading(true)

    try {
      // All registrations use JSON (no password needed - auto-generated)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          sponsorCode: formData.sponsorCode || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.userDetails) {
        // Show credentials page instead of redirecting
        // Store credentials for display
        setRegistrationCredentials(data.userDetails)
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show credentials page if registration was successful
  if (registrationCredentials) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-3 sm:p-4 lg:p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">DreamStake</h1>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border-neutral-700">
            <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl text-yellow-400 mb-1.5 sm:mb-2">WELCOME TO DreamStake</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-neutral-300">
                Your account has been created successfully. Please save your login credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center border-b border-neutral-700 pb-2">
                  <span className="text-xs sm:text-sm text-neutral-300">User ID :</span>
                  <span className="text-yellow-400 font-bold text-base sm:text-lg">{registrationCredentials.userId}</span>
                </div>

                <div className="flex justify-between items-center border-b border-neutral-700 pb-2">
                  <span className="text-xs sm:text-sm text-neutral-300">Name :</span>
                  <span className="text-yellow-400 font-bold text-sm sm:text-base">{registrationCredentials.name}</span>
                </div>

                <div className="flex justify-between items-center border-b border-neutral-700 pb-2">
                  <span className="text-xs sm:text-sm text-neutral-300">Password :</span>
                  <span className="text-yellow-400 font-bold text-base sm:text-lg">{registrationCredentials.password}</span>
                </div>

                {registrationCredentials.sponsorId && (
                  <div className="flex justify-between items-center border-b border-neutral-700 pb-2">
                    <span className="text-xs sm:text-sm text-neutral-300">Sponsor Id :</span>
                    <span className="text-yellow-400 font-bold text-sm sm:text-base">{registrationCredentials.sponsorId}</span>
                  </div>
                )}
              </div>

              <Alert className="mt-3 sm:mt-4 border-blue-500/50 bg-blue-500/10">
                <AlertDescription className="text-xs sm:text-sm text-blue-300">
                  <strong>📸 Save Your Credentials:</strong> Please take a screenshot of this page to save your User ID and Password. 
                  You will need these credentials to login to your account.
                </AlertDescription>
              </Alert>

              <Alert className="mt-3 sm:mt-4 border-orange-500/50 bg-orange-500/10">
                <AlertDescription className="text-xs sm:text-sm text-orange-300">
                  <strong>Important:</strong> Your account is inactive. Please contact a Franchise Member to activate
                  your account before you can login.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end mt-4 sm:mt-6">
                <Link href="/login">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-xs sm:text-sm">
                    Login Here
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <p className="text-xs sm:text-sm text-muted-foreground">Join our trading and staking platform today</p>
        </div>

        <Card className="border-neutral-800 bg-transparent">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
            <CardTitle className="text-base sm:text-lg">Create Account</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Start your journey with Green ID membership</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {/* Referral Info */}
            {formData.sponsorCode && sponsorName && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Referral Detected:</strong> Your sponsor is {sponsorName}. Your sponsor will be automatically
                  assigned.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive" className="text-xs sm:text-sm">
                  <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="sponsorCode" className="text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Sponsor Code {formData.sponsorCode ? "(Auto-filled)" : "(Optional)"}</span>
                  </div>
                </Label>
                <Input
                  id="sponsorCode"
                  name="sponsorCode"
                  type="text"
                  placeholder="Enter sponsor's user ID"
                  value={formData.sponsorCode}
                  onChange={handleSponsorCodeChange}
                  readOnly={!!searchParams.get("ref")}
                  className="text-xs sm:text-sm"
                />
                {checkingSponsor && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Checking sponsor status...</p>
                )}
                {sponsorName && (
                  <p className="text-[10px] sm:text-xs text-green-600 mt-1">Sponsor: {sponsorName}</p>
                )}
              </div>

              <Button type="submit" className="w-full text-xs sm:text-sm" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
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
