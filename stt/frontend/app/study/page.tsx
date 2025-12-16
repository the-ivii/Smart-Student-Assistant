"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Brain, BookOpen, CheckCircle2, Circle, Lightbulb, ExternalLink, ArrowLeft, RotateCcw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export default function StudyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [data, setData] = useState<any | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem("studyData")
    if (!stored) {
      router.push("/dashboard")
      return
    }
    try {
      const parsed = JSON.parse(stored)
      setData(parsed)
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error loading study data",
        description: "Failed to load study materials. Please try again.",
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  const [resetKey, setResetKey] = useState(0)

  const handleResetAnswers = () => {
    setSelectedAnswers({})
    setShowResults(false)
    setResetKey((prev) => prev + 1) // Force re-render of RadioGroups
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary-foreground" />
              <span className="text-lg font-semibold text-foreground">Smart Study Assistant</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <Skeleton className="h-10 w-64" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const topic = data.topic
  const summary: string[] = data.summary || []
  const questions =
    data.quiz?.map((q: any, idx: number) => ({
      id: idx + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })) || []

  const studyTip = data.studyTip || ""
  const source = data.source

  // Calculate score
  const totalQuestions = questions.length
  const correctAnswers = questions.filter((q: any) => selectedAnswers[q.id] === q.correctAnswer).length
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Smart Study Assistant</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Topic Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Study Materials: {topic}</h1>
              <p className="text-muted-foreground">AI-generated learning content</p>
            </div>
            {source && (
              <Button variant="outline" size="sm" asChild>
                <Link href={source} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Source
                </Link>
              </Button>
            )}
          </div>

          {/* Summary Card */}
          <Card className="border-border shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {summary.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Circle className="h-3 w-3 fill-primary text-primary" />
                    </div>
                    <p className="flex-1 leading-relaxed text-foreground">{point}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Quiz Section - Only show if questions exist */}
          {questions.length > 0 && (
            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl">Practice Questions</CardTitle>
                  </div>
                  {showResults && totalQuestions > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{scorePercentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {correctAnswers} of {totalQuestions} correct
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <CardDescription className="leading-relaxed">Test your understanding of the topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {questions.map((q, index) => {
                  const isSelected = selectedAnswers[q.id] !== undefined
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer
                  return (
                    <div key={q.id} className="space-y-4 rounded-lg border border-border bg-muted/20 p-6">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="mb-2">
                          Question {index + 1}
                        </Badge>
                        <h3 className="text-lg font-medium leading-relaxed text-foreground">{q.question}</h3>
                      </div>
                      <RadioGroup
                        key={`${q.id}-${resetKey}`}
                        value={selectedAnswers[q.id] || ""}
                        onValueChange={(value) => setSelectedAnswers({ ...selectedAnswers, [q.id]: value })}
                      >
                        <div className="space-y-3">
                          {q.options.map((option: string, optIndex: number) => {
                            const optionLetter = String.fromCharCode(65 + optIndex)
                            const isSelectedOption = selectedAnswers[q.id] === optionLetter
                            const isCorrectOption = optionLetter === q.correctAnswer
                            const showState = showResults
                            const baseClasses = "flex items-start space-x-3 rounded-md border border-border bg-card p-4 transition-colors"
                            const stateClasses = showState
                              ? isCorrectOption
                                ? " border-green-500 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
                                : isSelectedOption && !isCorrectOption
                                  ? " border-red-500 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
                                  : ""
                              : " hover:bg-muted/50"
                            return (
                              <div key={optIndex} className={baseClasses + stateClasses}>
                                <RadioGroupItem
                                  value={optionLetter}
                                  id={`q${q.id}-${optionLetter}-${resetKey}`}
                                  className="mt-0.5"
                                  disabled={showResults}
                                />
                                <Label
                                  htmlFor={`q${q.id}-${optionLetter}-${resetKey}`}
                                  className="flex-1 cursor-pointer font-normal leading-relaxed"
                                >
                                  <span className="font-medium">{optionLetter})</span> {option}
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      </RadioGroup>
                      {showResults && (
                        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                          <p className="font-semibold">
                            {isCorrect ? "✓ Correct!" : `✗ Incorrect. The correct answer is ${q.correctAnswer}.`}
                          </p>
                          {q.explanation && <p className="mt-2 text-muted-foreground">{q.explanation}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Study Tip */}
          <Card className="border-primary/20 bg-primary/5 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Study Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-foreground">{studyTip}</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={`flex flex-col gap-3 ${questions.length > 0 ? "sm:flex-row" : "sm:flex-row sm:justify-center"}`}>
            <Button size="lg" className={questions.length > 0 ? "flex-1" : "w-full sm:w-auto"} asChild>
              <Link href="/dashboard">Study Another Topic</Link>
            </Button>
            {questions.length > 0 && (
              <>
                {showResults ? (
                  <Button size="lg" variant="outline" className="flex-1 bg-transparent" onClick={handleResetAnswers}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Answers
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      if (Object.keys(selectedAnswers).length === 0) {
                        toast({
                          variant: "destructive",
                          title: "No answers selected",
                          description: "Please select answers before reviewing.",
                        })
                        return
                      }
                      setShowResults(true)
                    }}
                  >
                    Review Answers
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
