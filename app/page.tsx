"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, TrendingUp, Award, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { BinaryTreeDemo } from "@/components/network/binary-tree-demo"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { BackgroundLines } from "@/components/ui/background-lines"
import { AnimatedCard } from "@/components/ui/animated-card"
import { BeamEffect } from "@/components/ui/beam-effect"
import { ShineEffect } from "@/components/ui/shine-effect"
import { motion } from "framer-motion"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <BackgroundBeams />
      {/* Header */}
      <header className="border-b border-neutral-800/50 bg-transparent backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gradient-beams">DreamStake</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm hidden md:block">
                Login
              </Button>
            </Link>
            <Button size="sm" className="text-xs sm:text-sm" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 px-4 relative overflow-hidden min-h-[65vh] sm:min-h-[90vh] flex items-center">
        <BackgroundLines className="absolute inset-0 h-full w-full bg-neutral-950">
          <BeamEffect />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none"></div>
        </BackgroundLines>
        <div className="container mx-auto text-center max-w-4xl relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30" variant="secondary">
              Trading & Staking Platform
            </Badge>
          </motion.div>
          <motion.h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-gradient-beams relative z-10 px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            DreamStake Income Streams
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed relative z-10 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            A transparent, balanced growth plan designed to ensure fair earnings for all members through a binary system
            with Left and Right legs. Income is generated through direct joining, matching pairs, and ID upgrades across
            three membership levels.
          </motion.p>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button 
              size="lg" 
              className="w-full sm:w-auto relative overflow-hidden group"
              onClick={handleGetStarted}
            >
              <span className="relative z-10 flex items-center">
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4" />
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Example Flow */}
      <section className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-beams mb-2 px-2">
              How It Works (Example)
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto my-2 text-xs sm:text-sm text-center relative z-10 px-4">
              A simple example showing ROI, generation commission, and residual referral income.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatedCard delay={0}>
              <ShineEffect>
                <Card className="border-neutral-800 bg-gradient-to-br from-card to-neutral-900/50 hover:border-primary/40 transition-all h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-primary">1) Staking ROI</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2 flex-1 flex flex-col">
                    <p>You stake $5,000 → falls in 6% tier → you earn $300 monthly.</p>
                    <p className="text-xs mt-auto">Rounded to 2 decimals; handled automatically.</p>
                  </CardContent>
                </Card>
              </ShineEffect>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <ShineEffect>
                <Card className="border-neutral-800 bg-gradient-to-br from-card to-neutral-900/50 hover:border-primary/40 transition-all h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-accent">2) Generation Commission</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2 flex-1 flex flex-col">
                    <p>Your Level-1 joins with a package → you get $3 instantly.</p>
                    <p className="text-xs mt-auto">Levels 2–5 get $1, $0.80, $0.70, $0.60 respectively.</p>
                  </CardContent>
                </Card>
              </ShineEffect>
            </AnimatedCard>
            <AnimatedCard delay={0.4}>
              <ShineEffect>
                <Card className="border-neutral-800 bg-gradient-to-br from-card to-neutral-900/50 hover:border-primary/40 transition-all h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg text-primary">3) Residual Referral</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2 flex-1 flex flex-col">
                    <p>Your Level-1 earns $500 staking income this month → you get 20% = $100.</p>
                    <p className="text-xs mt-auto">Level 2 = 17%, Level 3 = 13%, Level 4 = 9%, Level 5 = 5% of staking income.</p>
                  </CardContent>
                </Card>
              </ShineEffect>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Income Streams Overview */}
      <section className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 bg-neutral-950">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-beams mb-3 sm:mb-4 px-2">
              Income Streams
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Transparent staking returns, generation commissions, and residual referral income.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* 1. Staking Income */}
            <AnimatedCard delay={0}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all h-full flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg text-emerald-600">Staking Income</CardTitle>
                  <Badge variant="secondary" className="text-xs">Monthly ROI</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm flex-1 flex flex-col">
                <p className="text-muted-foreground">Passive income based on staked capital:</p>
                  <ul className="space-y-1.5 sm:space-y-2 flex-1">
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>$100–$1,000 → 4% monthly</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>$1,000–$4,000 → 5% monthly</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>$4,000–$6,000 → 6% monthly</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>$6,000–$10,000 → 7% monthly</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>Above $10,000 → 8% monthly</li>
                  </ul>
                <div className="pt-2 mt-auto">
                  <Link href="/payouts">
                    <Button size="sm" variant="outline">View Payouts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* 2. Generation Income */}
            <AnimatedCard delay={0.2}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all h-full flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-400"></div>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg text-indigo-600">Generation Income</CardTitle>
                  <Badge className="text-xs">Per Join</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm flex-1 flex flex-col">
                <p className="text-muted-foreground">Fixed commission up to 5 generations on package purchase. Unlock each level by connecting direct referrals:</p>
                  <ul className="space-y-1.5 sm:space-y-2 flex-1">
                    <li className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="flex items-center"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>1st Gen: $3</span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">Need 1+ direct</span>
                    </li>
                    <li className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="flex items-center"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>2nd Gen: $1</span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">Need 2+ directs</span>
                    </li>
                    <li className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="flex items-center"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>3rd Gen: $0.80</span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">Need 3+ directs</span>
                    </li>
                    <li className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="flex items-center"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>4th Gen: $0.70</span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">Need 4+ directs</span>
                    </li>
                    <li className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="flex items-center"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>5th Gen: $0.60</span>
                      <span className="text-muted-foreground text-[10px] sm:text-xs">Need 5+ directs</span>
                    </li>
                  </ul>
                <div className="pt-2 mt-auto">
                  <Link href="/referrals">
                    <Button size="sm" variant="outline">Manage Referrals</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* 3. Staking Referral */}
            <AnimatedCard delay={0.4}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-accent/5 hover:shadow-lg hover:shadow-accent/20 transition-all h-full flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg text-amber-600">Staking Referral</CardTitle>
                  <Badge variant="secondary" className="text-xs">Residual</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm flex-1 flex flex-col">
                <p className="text-muted-foreground">Earn a percentage of your referrals&apos; monthly staking income:</p>
                  <ul className="space-y-1.5 sm:space-y-2 flex-1">
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0"></div>Level 1: 20%</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0"></div>Level 2: 17%</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0"></div>Level 3: 13%</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0"></div>Level 4: 9%</li>
                    <li className="flex items-center text-xs sm:text-sm"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0"></div>Level 5: 5%</li>
                  </ul>
                <p className="text-xs text-muted-foreground">Example: If a 1st-level referral earns $500 staking income → you get $100 (20%).</p>
                <div className="pt-2 mt-auto">
                  <Link href="/dashboard">
                    <Button size="sm">Go to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-beams mb-3 sm:mb-4 px-2">
              Why Choose Our System?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <AnimatedCard delay={0}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-2 ring-primary/30">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 font-sans">Binary Structure</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Simple left and right leg system for balanced growth</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.15}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-2 ring-accent/30">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">Progressive Earnings</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Increasing rewards as you advance through levels</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-2 ring-primary/30">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">Rank Rewards</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Physical rewards including mobile, laptop, bike, and car</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.45}>
              <Card className="text-center border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 ring-2 ring-accent/30">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">Transparent System</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Clear rules and fair compensation for all members</p>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* Connection Tree Preview (Example Only) */}
      <section className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 px-2">Your Connection Structure (Preview)</h2>
            <p className="text-xs sm:text-sm text-muted-foreground px-4">
              Example visualization of a connection tree. This is sample data to explain the flow.
            </p>
          </div>
          <BinaryTreeDemo />
          <div className="text-center mt-6">
            <Link href="/network">
              <Button variant="outline">Open Full Connection Structure</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-6 sm:py-8 px-3 sm:px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
                © 2024 DreamStake. All rights reserved. Transparent staking returns and progressive earnings through our trading platform.
              </p>
            </div>
            {/* Contact Section */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs sm:text-sm font-medium text-foreground">Contact Us</p>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-primary/20 bg-white p-1">
                  <img 
                    src="/contacttelegram.jpeg" 
                    alt="Telegram Contact QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Scan to Contact</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Via Telegram</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
