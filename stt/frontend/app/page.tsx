import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Brain, CheckCircle2, Lightbulb, TrendingUp, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Smart Study Assistant</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Zap className="h-4 w-4" />
            <span>AI-Powered Learning Platform</span>
          </div>
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Master Any Subject with Intelligent Study Tools
          </h1>
          <p className="mb-10 text-pretty text-lg text-muted-foreground sm:text-xl">
            Transform your learning experience with AI-generated summaries, practice questions, and personalized study
            guidance. Study smarter, not harder.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">Start Learning Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required • Unlimited topics</p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Excel
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Comprehensive study tools designed for effective learning
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Topic Breakdown</CardTitle>
              <CardDescription className="leading-relaxed">
                Complex subjects simplified into digestible summaries and key concepts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Practice Questions</CardTitle>
              <CardDescription className="leading-relaxed">
                Reinforce learning with tailored multiple-choice questions and explanations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Study Tips</CardTitle>
              <CardDescription className="leading-relaxed">
                Personalized learning strategies to enhance retention and understanding
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Learning History</CardTitle>
              <CardDescription className="leading-relaxed">
                Track your progress and revisit topics to strengthen knowledge
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, Effective Learning Process
            </h2>
            <p className="text-pretty text-lg text-muted-foreground">Get started in three easy steps</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Enter Your Topic</h3>
              <p className="text-muted-foreground leading-relaxed">
                Type in any subject or concept you want to learn about
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">AI Generates Materials</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive instant summaries, quiz questions, and study tips
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Learn & Practice</h3>
              <p className="text-muted-foreground leading-relaxed">
                Review content and test your knowledge with interactive quizzes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary">Unlimited</div>
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Study Topics</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary">Instant</div>
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Content Generation</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary">Advanced</div>
            <div className="text-sm uppercase tracking-wider text-muted-foreground">AI Technology</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to Transform Your Learning?
          </h2>
          <p className="mb-8 text-pretty text-lg text-muted-foreground">
            Join students who are already learning smarter with AI
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>&copy; 2025 Smart Study Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
