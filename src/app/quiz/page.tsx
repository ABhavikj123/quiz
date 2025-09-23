"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Eye,
  EyeOff,
  RotateCcw,
  Home,
  Timer,
  Users,
  Trophy,
  Volume2,
  ImageIcon,
  Minus,
  Settings,
  Crown,
} from "lucide-react"
import { useQuiz } from "@/hooks/use-quiz"
import type { MCQQuestion, RecognitionQuestion, GeneralQuestion } from "@/lib/quiz-types"

export default function QuizPage() {
  const {
    quizState,
    quizData,
    gameOverModal,
    resetQuiz,
    resetGroup,
    addTeamScore,
    revokeTeamScore,
    nextQuestion,
    previousQuestion,
    switchGroup,
    startGroup,
    updateTeamName,
    closeGameOverModal,
  } = useQuiz()

  const [timer, setTimer] = useState(30)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showTeamSetup, setShowTeamSetup] = useState(false)
  const [teamNames, setTeamNames] = useState<{ [key: string]: string }>({})
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [roundStartModal, setRoundStartModal] = useState<{
    show: boolean
    round: number
    groupId: number
    leader?: { name: string; score: number }
  } | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timer])

  useEffect(() => {
    if (quizState) {
      const names: { [key: string]: string } = {}
      quizState.groups.forEach((group) => {
        group.teams.forEach((team) => {
          if (team.schoolName) {
            names[`${group.groupId}-${team.teamName}`] = team.schoolName
          }
        })
      })
      setTeamNames(names)
    }
  }, [quizState])

  useEffect(() => {
    if (quizState && quizState.currentGroup) {
      const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
      if (
        currentGroup &&
        currentGroup.currentQuestion === 0 &&
        currentGroup.isStarted &&
        currentGroup.currentRound > 1
      ) {
        const leader = getCurrentLeader()
        setRoundStartModal({
          show: true,
          round: currentGroup.currentRound,
          groupId: currentGroup.groupId,
          leader: leader ? { name: leader.schoolName || leader.teamName, score: leader.totalScore } : undefined,
        })
      }
    }
  }, [quizState])

  const startTimer = () => {
    setTimer(30)
    setIsTimerRunning(true)
    setShowAnswer(false)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    setTimer(30)
    setIsTimerRunning(false)
  }

  const handleShowQuestion = () => {
    setShowQuestion(true)
    setShowAnswer(false)
    startTimer()
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    setIsTimerRunning(false)
  }

  const isLastQuestion = () => {
    if (!quizState || !quizData) return false

    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return false

    const groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
    if (!groupData) return false

    let maxQuestions = 0
    if (currentGroup.currentRound === 1) {
      maxQuestions = groupData.rounds.round1_mcq.length
    } else if (currentGroup.currentRound === 2) {
      maxQuestions = groupData.rounds.round2_recognition.length
    } else if (currentGroup.currentRound === 3) {
      maxQuestions = groupData.rounds.round3_general.length
    }

    return currentGroup.currentRound === 3 && currentGroup.currentQuestion === maxQuestions - 1
  }

  const handleNextQuestion = () => {
    nextQuestion()
    setShowQuestion(false)
    setShowAnswer(false)
    resetTimer()
  }

  const handlePreviousQuestion = () => {
    previousQuestion()
    setShowQuestion(false)
    setShowAnswer(false)
    resetTimer()
  }

  const handleTeamScore = (teamName: string) => {
    if (!quizState) return
    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return

    const success = addTeamScore(quizState.currentGroup, teamName, currentGroup.currentRound)
    if (!success) {
      console.log("Point already awarded for this question")
    }
  }

  const handleRevokeScore = (teamName: string) => {
    if (!quizState) return
    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return

    revokeTeamScore(quizState.currentGroup, teamName, currentGroup.currentRound)
  }

  const handleStartGroup = () => {
    if (!selectedGroup) return

    const groupId = Number.parseInt(selectedGroup)
 

    const otherStartedGroup = quizState?.groups.find((g) => g.groupId !== groupId && g.isStarted && !g.isCompleted)
    if (otherStartedGroup) {
      alert(`Group ${otherStartedGroup.groupId} is already in progress. Please complete it first.`)
      return
    }

    startGroup(groupId)
    setSelectedGroup("")
    setShowQuestion(false)
    setShowAnswer(false)
    resetTimer()
   
  }

  const handleUpdateTeamName = (teamName: string, schoolName: string) => {
    if (!quizState) return
    updateTeamName(quizState.currentGroup, teamName, schoolName)
    setTeamNames((prev) => ({ ...prev, [`${quizState.currentGroup}-${teamName}`]: schoolName }))
  }

  const handleSwitchGroup = (groupId: number) => {
    if (!quizState) return

    
    const targetGroup = quizState.groups.find((g) => g.groupId === groupId)

    if (!targetGroup) {
      alert("Group not found.")
      return
    }

    if (!targetGroup.isStarted) {
      setSelectedGroup("")
      startGroup(groupId)
      setShowQuestion(false)
      setShowAnswer(false)
      resetTimer()
      return
    }

    setSelectedGroup("")
    switchGroup(groupId)
    setShowQuestion(false)
    setShowAnswer(false)
    resetTimer()
  }

  const handleGameOverClose = () => {
    closeGameOverModal()
    setSelectedGroup("")
  }

  const getCurrentLeader = () => {
    if (!quizState) return null
    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return null

    return currentGroup.teams.reduce((prev, current) => (prev.totalScore > current.totalScore ? prev : current))
  }

  if (!quizState || !quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz data...</p>
        </div>
      </div>
    )
  }

  const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
 

  if (!currentGroup && quizState.currentGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Switching to Group {quizState.currentGroup}...</p>
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold mb-4">Select a Group to Continue</h2>
          <p className="text-muted-foreground mb-4">Choose a group to start or continue the quiz.</p>

          <div className="space-y-4">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-64 mx-auto">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {quizData.groups.map((g) => {
                  const group = quizState.groups.find((gg) => gg.groupId === g.group_id)
                  const isStarted = group?.isStarted
                  const isCompleted = group?.isCompleted

                  return (
                    <SelectItem key={g.group_id} value={g.group_id.toString()}>
                      {g.name} {isCompleted ? "✓ Completed" : isStarted ? "▶ In Progress" : "○ Not Started"}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {selectedGroup && (
              <div className="space-y-2">
                {(() => {
                  const groupId = Number.parseInt(selectedGroup)
                  const group = quizState.groups.find((g) => g.groupId === groupId)
                  const isStarted = group?.isStarted
                  const isCompleted = group?.isCompleted

                  if (isCompleted) {
                    return (
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">This group is already completed.</p>
                        <Button
                          variant="outline"
                          onClick={() => handleSwitchGroup(groupId)}
                          className="hover:bg-muted transition-all duration-200 hover:scale-105"
                        >
                          View Group {selectedGroup}
                        </Button>
                      </div>
                    )
                  } else if (isStarted) {
                    return (
                      <Button
                        onClick={() => handleSwitchGroup(groupId)}
                        className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                      >
                        Continue Group {selectedGroup}
                      </Button>
                    )
                  } else {
                    return (
                      <Button
                        onClick={handleStartGroup}
                        className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                      >
                        Start Group {selectedGroup}
                      </Button>
                    )
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
  if (!groupData) return null

  let currentQuestionData: MCQQuestion | RecognitionQuestion | GeneralQuestion | null = null
  let totalQuestions = 0
  let roundName = ""

  if (currentGroup.currentRound === 1) {
    currentQuestionData = groupData.rounds.round1_mcq[currentGroup.currentQuestion]
    totalQuestions = groupData.rounds.round1_mcq.length
    roundName = "Round 1: Multiple Choice"
  } else if (currentGroup.currentRound === 2) {
    currentQuestionData = groupData.rounds.round2_recognition[currentGroup.currentQuestion]
    totalQuestions = groupData.rounds.round2_recognition.length
    roundName = "Round 2: Recognition"
  } else if (currentGroup.currentRound === 3) {
    currentQuestionData = groupData.rounds.round3_general[currentGroup.currentQuestion]
    totalQuestions = groupData.rounds.round3_general.length
    roundName = "Round 3: General Knowledge"
  }

  const progress = ((currentGroup.currentQuestion + 1) / totalQuestions) * 100

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={gameOverModal?.show || false} onOpenChange={handleGameOverClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              {gameOverModal?.type === "group" ? "Group Complete!" : "Quiz Complete!"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>
                  <span className="font-bold">{gameOverModal?.winner}</span> wins Group {gameOverModal?.groupId} with{" "}
                  <span className="font-bold">{gameOverModal?.score} points</span>!
                </div>
                <div>
                  {quizState && quizState.groupWinners.length < 4 ? (
                    <span>Ready to move to the next group?</span>
                  ) : (
                    <span>All groups complete! Ready for the final round?</span>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleGameOverClose} className="hover:bg-primary/90 transition-colors">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roundStartModal?.show || false} onOpenChange={() => setRoundStartModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-6 h-6 text-primary" />
              Starting Round {roundStartModal?.round}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>
                  Group {roundStartModal?.groupId} - Round {roundStartModal?.round} is about to begin!
                </div>
                {roundStartModal?.leader && (
                  <div>
                    Current leader: <span className="font-bold">{roundStartModal.leader.name}</span> with{" "}
                    {roundStartModal.leader.score} points
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setRoundStartModal(null)}
              className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              Start Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/")}
                className="hover:bg-muted transition-all duration-200 hover:scale-105"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="text-lg font-bold">Quiz Championship</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-32 hover:bg-muted transition-all duration-200">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizState.groups.map((group) => {
                      const isStarted = group?.isStarted
                      const isCompleted = group?.isCompleted

                      return (
                        <SelectItem key={group.groupId} value={group.groupId.toString()}>
                          Group {group.groupId} {isCompleted ? "✓ Completed" : isStarted ? "▶ In Progress" : "○ Not Started"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>

                </Select>

                {selectedGroup && (
                  <div className="flex gap-2">
                    {(() => {
                      const groupId = Number.parseInt(selectedGroup)
                      const group = quizState.groups.find((g) => g.groupId === groupId)
                      const isStarted = group?.isStarted

                      if (isStarted) {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSwitchGroup(groupId)}
                            className="hover:bg-muted transition-all duration-200 hover:scale-105"
                          >
                            Switch to Group {selectedGroup}
                          </Button>
                        )
                      } else {
                        return (
                          <Button
                            size="sm"
                            onClick={handleStartGroup}
                            className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                          >
                            Start Group {selectedGroup}
                          </Button>
                        )
                      }
                    })()}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTeamSetup(true)}
                className="hover:bg-muted transition-all duration-200 hover:scale-105"
              >
                <Settings className="w-4 h-4 mr-2" />
                Team Setup
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetGroup(quizState?.currentGroup || 1)}
                className="hover:bg-muted transition-all duration-200 hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetQuiz}
                className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-105 bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showTeamSetup} onOpenChange={setShowTeamSetup}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Team Setup - Group {quizState?.currentGroup}</DialogTitle>
            <DialogDescription>Add school/college names for each team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {currentGroup?.teams.map((team) => (
              <div key={team.teamName} className="space-y-2">
                <Label htmlFor={team.teamName}>{team.teamName}</Label>
                <Input
                  id={team.teamName}
                  placeholder="Enter school/college name"
                  value={team.schoolName || ""}
                  onChange={(e) => handleUpdateTeamName(team.teamName, e.target.value)}
                  className="hover:border-primary/50 transition-colors duration-200"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowTeamSetup(false)}
              className="hover:bg-primary/90 transition-colors duration-200"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Quiz Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentGroup.currentQuestion === 0 && (
              <Card className="p-6 bg-primary/10 border-primary/20">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-primary mb-2">Starting Round {currentGroup.currentRound}</h2>
                  {getCurrentLeader() && (
                    <p className="text-muted-foreground">
                      Current leader: <strong>{getCurrentLeader()?.schoolName || getCurrentLeader()?.teamName}</strong>{" "}
                      with {getCurrentLeader()?.totalScore} points
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Quiz Header */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {currentGroup.groupName || `Group ${quizState.currentGroup}`}
                  </h1>
                  <p className="text-muted-foreground">{roundName}</p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Question {currentGroup.currentQuestion + 1} of {totalQuestions}
                  {isLastQuestion() && <span className="ml-2 text-destructive">FINAL</span>}
                </Badge>
              </div>

              <Progress value={progress} className="h-2 mb-4" />

              {/* Timer */}
              <div className="flex items-center justify-center mb-6">
                <div
                  className={`text-6xl font-bold ${timer <= 10 ? "text-destructive" : "text-primary"
                    } transition-colors duration-200`}
                >
                  <Timer className="w-8 h-8 inline mr-2" />
                  {timer}s
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center gap-4 mb-6">
                <Button
                  onClick={startTimer}
                  disabled={isTimerRunning}
                  className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
                <Button
                  variant="outline"
                  onClick={stopTimer}
                  disabled={!isTimerRunning}
                  className="hover:bg-muted transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Timer
                </Button>
                <Button
                  variant="outline"
                  onClick={resetTimer}
                  className="hover:bg-muted transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Timer
                </Button>
              </div>
            </Card>

            {/* Question Display */}
            <Card className="p-8">
              <div className="text-center mb-8">
                <Button
                  size="lg"
                  onClick={handleShowQuestion}
                  disabled={showQuestion}
                  className="text-lg px-8 py-4 hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  {showQuestion ? (
                    <>
                      <Eye className="w-5 h-5 mr-2" />
                      Question Shown
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-5 h-5 mr-2" />
                      Show Question
                    </>
                  )}
                </Button>
              </div>

              {showQuestion && currentQuestionData && (
                <div className="space-y-6">
                  {/* Question */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-6 leading-relaxed">
                      {currentQuestionData.question}
                    </h2>

                    {/* Recognition Question Media (image or sound) */}
                    {currentGroup.currentRound === 2 && "type" in currentQuestionData && currentQuestionData.url && currentQuestionData.url.trim() !== "" && (
                      <div className="mb-6">
                        {currentQuestionData.type === "image" ? (
                          <div className="flex justify-center">
                            <img
                              src={currentQuestionData.url}
                              alt={currentQuestionData.question}
                              className="w-64 h-64 object-contain rounded-lg border"
                            />
                          </div>
                        ) : currentQuestionData.type === "sound" ? (
                          <div className="flex justify-center">
                            <audio controls className="w-64">
                              <source src={currentQuestionData.url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* MCQ Options */}
                    {"options" in currentQuestionData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {currentQuestionData.options.map((option, index) => (
                          <div
                            key={index}
                            className="p-4 bg-muted rounded-lg text-left font-medium text-lg hover:bg-muted/80 transition-colors"
                          >
                            <span className="font-bold text-primary mr-3">{String.fromCharCode(65 + index)}.</span>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Show Answer Button */}
                  <div className="text-center">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleShowAnswer}
                      disabled={showAnswer}
                      className="text-lg px-8 py-4 bg-transparent hover:bg-muted transition-all duration-200 hover:scale-105"
                    >
                      {showAnswer ? "Answer Shown" : "Show Answer"}
                    </Button>
                  </div>

                  {/* Answer Display */}
                  {showAnswer && (
                    <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
                      <h3 className="text-xl font-bold text-primary mb-2">Correct Answer:</h3>
                      <p className="text-2xl font-bold text-foreground">{currentQuestionData.answer}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Navigation Controls */}
            <Card className="p-6">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentGroup.currentQuestion === 0 && currentGroup.currentRound === 1}
                  className="hover:bg-muted transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <SkipBack className="w-4 h-4 mr-2" />
                  Previous Question
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Round {currentGroup.currentRound} • Question {currentGroup.currentQuestion + 1}
                  </p>
                </div>

                <Button
                  onClick={handleNextQuestion}
                  className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  {isLastQuestion() ? "Finish Group" : "Next Question"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar - Team Scoring */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Scoring
              </h3>
              <div className="space-y-3">
                {currentGroup.teams.map((team) => {
                  const hasScored =
                    team.lastScoredQuestion === currentGroup.currentQuestion &&
                    team.lastScoredRound === currentGroup.currentRound

                  return (
                    <div key={team.teamName} className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant={hasScored ? "default" : "outline"}
                          className={`flex-1 justify-between p-4 h-auto transition-all duration-200 hover:scale-105 ${hasScored ? "bg-green-600 hover:bg-green-700" : "bg-transparent hover:bg-muted"
                            }`}
                          onClick={() => handleTeamScore(team.teamName)}
                          disabled={hasScored}
                        >
                          <span className="font-semibold">{team.schoolName || team.teamName}</span>
                          <Badge variant={hasScored ? "secondary" : "outline"} className="ml-2">
                            {hasScored ? "✓ Scored" : "+1 Point"}
                          </Badge>
                        </Button>

                        {hasScored && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeScore(team.teamName)}
                            className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Current Scores */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Current Scores
              </h3>
              <div className="space-y-3">
                {currentGroup.teams
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((team, index) => (
                    <div key={team.teamName} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                              ? "bg-gray-400 text-white"
                              : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-muted-foreground text-white"
                            }`}
                        >
                          {index + 1}
                        </div>
                        <span className="font-semibold">{team.schoolName || team.teamName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{team.totalScore}</div>
                        <div className="text-xs text-muted-foreground">
                          R1: {team.round1Score} • R2: {team.round2Score} • R3: {team.round3Score}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Round Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Round Progress</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((round) => (
                  <div key={round} className="flex items-center justify-between">
                    <span
                      className={`font-medium ${currentGroup.currentRound === round ? "text-primary" : "text-muted-foreground"}`}
                    >
                      Round {round}
                    </span>
                    <Badge
                      variant={
                        currentGroup.currentRound > round
                          ? "default"
                          : currentGroup.currentRound === round
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {currentGroup.currentRound > round
                        ? "Completed"
                        : currentGroup.currentRound === round
                          ? "In Progress"
                          : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
