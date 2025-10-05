"use client"

import { useState, useEffect, useRef } from "react"
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
import Announce from "@/components/announce"
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
  Minus,
  Settings,
  Crown,
} from "lucide-react"
import { useQuiz } from "@/hooks/use-quiz"
import type { MCQQuestion, RecognitionQuestion, GeneralQuestion, FlattenedGroup } from "@/lib/quiz-types"

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
    startFinal,
    updateTeamName,
    closeGameOverModal,
  } = useQuiz()

  const [timer, setTimer] = useState(30)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showTeamSetup, setShowTeamSetup] = useState(false)
  // teamNames removed (not used) - school names are stored in quiz state
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [roundStartModal, setRoundStartModal] = useState<{
    show: boolean
    round: number
    groupId: number
    leader?: { name: string; score: number }
  } | null>(null)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  // transient per-team delta for the current question (not persisted)
  const [tempDeltas, setTempDeltas] = useState<Record<string, number>>({})

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

  // Keep a snapshot of groups to detect completions and announce the leader when a group completes
  const prevGroupsRef = useRef<{ groupId: number; isStarted: boolean; isCompleted: boolean; currentRound: number; currentQuestion: number }[]>([])

  useEffect(() => {
    if (!quizState) return
    // If we've moved to the final stage, skip announcing previous group completions
    if (quizState.currentStage === "final") return
    const prev = prevGroupsRef.current
    quizState.groups.forEach((g) => {
      const p = prev.find((x) => x.groupId === g.groupId)
      // If group was started before and now it's not started and marked completed => announce leader
      if (p && p.isStarted && !g.isStarted && g.isCompleted) {
        const leader = g.teams.reduce((prevT, curT) => (prevT.totalScore > curT.totalScore ? prevT : curT))
        const isFinalGroup = !!quizData?.final && quizData.final.group_id === g.groupId
        setRoundStartModal({
          show: true,
          round: isFinalGroup ? 0 : g.currentRound,
          groupId: g.groupId,
          leader: leader ? { name: leader.schoolName || leader.teamName, score: leader.totalScore } : undefined,
        })
      }
    })
    prevGroupsRef.current = quizState.groups.map((x) => ({
      groupId: x.groupId,
      isStarted: !!x.isStarted,
      isCompleted: !!x.isCompleted,
      currentRound: x.currentRound,
      currentQuestion: x.currentQuestion,
    }))
  }, [quizState, quizData])

  useEffect(() => {
    if (quizState && quizState.currentGroup) {
      const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
      // Show the round-start announce when a group's question pointer is at 0 and group is started
      // (covers Round 1/2/3 starts). We removed the previous `> 1` restriction so starts for R1/R2 show.
      if (currentGroup && currentGroup.currentQuestion === 0 && currentGroup.isStarted) {
        // compute leader inline to avoid external deps
        const leader = currentGroup.teams.reduce((prevT, curT) => (prevT.totalScore > curT.totalScore ? prevT : curT))
        const isFinalGroup = !!quizData?.final && quizData.final.group_id === currentGroup.groupId
        setRoundStartModal({
          show: true,
          round: isFinalGroup ? 0 : currentGroup.currentRound,
          groupId: currentGroup.groupId,
          leader: leader ? { name: leader.schoolName || leader.teamName, score: leader.totalScore } : undefined,
        })
      }
    }
  }, [quizState, quizData])

  // Clear selection when the current group/round/question changes
  useEffect(() => {
    if (!quizState) return
    const cg = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!cg) return
    setSelectedOptionIndex(null)
    setShowAnswer(false)
    // stop timer when switching questions
    setIsTimerRunning(false)
  }, [quizState])

  // Reset transient per-question deltas whenever the current question or group changes
  const currentQuestionNumber = quizState?.groups.find((g) => g.groupId === quizState.currentGroup)?.currentQuestion
  useEffect(() => {
    setTempDeltas({})
  }, [quizState?.currentGroup, currentQuestionNumber])

  // Keyboard support for MCQ options (a,b,c,d)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showQuestion) return
      if (!quizState || !quizData) return
      const currentGroupState = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
      if (!currentGroupState) return
      // Only handle MCQ options (round 1)
      if (currentGroupState.currentRound !== 1) return
      const group = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
      if (!group) return
      const q = group.rounds.round1_mcq[currentGroupState.currentQuestion]
      if (!q || !q.options) return
      const key = e.key.toLowerCase()
      const idx = key.charCodeAt(0) - 97 // a -> 0
      if (idx >= 0 && idx < q.options.length) {
        // inline selection logic (same as handleOptionSelect) to avoid adding it as effect dependency
        setSelectedOptionIndex(idx)
        setShowAnswer(true)
        setIsTimerRunning(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
    // quizState and quizData are intentionally included; handleOptionSelect is stable in this scope
  }, [showQuestion, quizState, quizData])

  const getCorrectOptionIndex = (answer: string) => {
    if (!answer) return -1
    const trimmed = answer.trim()
    const first = trimmed.charAt(0).toUpperCase()
    const code = first.charCodeAt(0)
    if (code >= 65 && code <= 90) {
      return code - 65
    }
    return -1
  }

  const handleOptionSelect = (index: number) => {
    setSelectedOptionIndex(index)
    setShowAnswer(true)
    // stop timer when an option is chosen; if correct, stop immediately
    setIsTimerRunning(false)
  }

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
    setSelectedOptionIndex(null)
    setShowQuestion(true)
    setShowAnswer(false)
    startTimer()
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    setIsTimerRunning(false)
  }

  // (final round handlers implemented below as openFinalRound/closeFinalRound/...)

  const isLastQuestion = () => {
    if (!quizState || !quizData) return false

    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return false
    // consider final data (stored on quizData.final)
    const groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
    if (!groupData && quizData.final && quizData.final.group_id === quizState.currentGroup) {
      const final = quizData.final
      const maxQuestions = final.rounds.round3_general.length
      return currentGroup.currentQuestion === maxQuestions - 1
    }

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

  // Direct calls to addTeamScore/revokeTeamScore are used in the UI; helper wrappers removed to avoid unused-var warnings.

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
      <div className="min-h-screen bg-gradient-to-br from-amber-300 via-amber-200 to-sky-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-800">Loading quiz data...</p>
        </div>
      </div>
    )
  }

  const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
  // ...existing code...

  

  if (!currentGroup && quizState.currentGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-800">Switching to Group {quizState.currentGroup}...</p>
        </div>
      </div>
    )
  }

  // final-round UI removed; continue to group-based views

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-sky-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold mb-4 text-amber-900">Select a Group to Continue</h2>
          <p className="text-amber-800 mb-4">Choose a group to start or continue the quiz.</p>

          <div className="space-y-4">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-64 mx-auto bg-amber-50">
                <SelectValue placeholder="Select Group"  />
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
                        <p className="text-amber-800 mb-2">This group is already completed.</p>
                        <Button
                          variant="outline"
                          onClick={() => handleSwitchGroup(groupId)}
                          className="hover:bg-amber-200 transition-all duration-200 hover:scale-105"
                        >
                          View Group {selectedGroup}
                        </Button>
                      </div>
                    )
                  } else if (isStarted) {
                    return (
                      <Button
                        onClick={() => handleSwitchGroup(groupId)}
                        className="bg-sky-400 text-white hover:bg-sky-500 transition-all duration-200 hover:scale-105"
                      >
                        Continue Group {selectedGroup}
                      </Button>
                    )
                  }

                  return (
                    <Button onClick={() => handleStartGroup()} className="hover:bg-amber-500 bg-amber-400 text-white">
                      Start Group {selectedGroup}
                    </Button>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
  // If groupData is missing it may be because we're in the Final stage and final is stored separately on quizData.final
  if (!groupData && !(quizState?.currentStage === "final" && !!quizData.final && quizState.currentGroup === quizData.final.group_id)) return null

  let currentQuestionData: MCQQuestion | RecognitionQuestion | GeneralQuestion | null = null
  let totalQuestions = 0
  let roundName = ""
  // If final stage is active, use final data and show 'Final Round'
  const isFinalActive = quizState?.currentStage === "final" && !!quizData.final && quizState.currentGroup === quizData.final.group_id
  const effectiveData: FlattenedGroup = isFinalActive ? (quizData.final as FlattenedGroup) : (groupData as FlattenedGroup)

  if (isFinalActive) {
    currentQuestionData = effectiveData.rounds.round3_general[currentGroup.currentQuestion]
    totalQuestions = effectiveData.rounds.round3_general.length
    roundName = "Final Round"
  } else {
    if (currentGroup.currentRound === 1) {
      currentQuestionData = (groupData as FlattenedGroup).rounds.round1_mcq[currentGroup.currentQuestion]
      totalQuestions = (groupData as FlattenedGroup).rounds.round1_mcq.length
      roundName = "Round 1: Multiple Choice"
    } else if (currentGroup.currentRound === 2) {
      currentQuestionData = (groupData as FlattenedGroup).rounds.round2_recognition[currentGroup.currentQuestion]
      totalQuestions = (groupData as FlattenedGroup).rounds.round2_recognition.length
      roundName = "Round 2: Recognition"
    } else if (currentGroup.currentRound === 3) {
      currentQuestionData = (groupData as FlattenedGroup).rounds.round3_general[currentGroup.currentQuestion]
      totalQuestions = (groupData as FlattenedGroup).rounds.round3_general.length
      roundName = "Round 3: General Knowledge"
    }
  }

  const progress = ((currentGroup.currentQuestion + 1) / totalQuestions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-amber-200 to-sky-300">
      <Announce
        show={!!gameOverModal?.show}
        title={gameOverModal?.type === "group" ? "Group Complete!" : "Quiz Complete!"}
        onClose={handleGameOverClose}
      >
        <div>
          <div>
            <span className="font-bold">{gameOverModal?.winner}</span> wins Group {gameOverModal?.groupId} with {" "}
            <span className="font-bold">{gameOverModal?.score} points</span>!
          </div>
          <div className="mt-2">
            {quizState && quizState.groupWinners.length < 4 ? (
              <span>Ready to move to the next group?</span>
            ) : (
              <span>All groups complete! Ready for the final round?</span>
            )}
          </div>
        </div>
      </Announce>

      <Announce
        show={!!roundStartModal?.show}
        title={roundStartModal?.round === 0 ? "Starting Final Round" : `Starting Round ${roundStartModal?.round}`}
        onClose={() => setRoundStartModal(null)}
      >
        <div>
          <div>
            Group {roundStartModal?.groupId} - {roundStartModal?.round === 0 ? "Final Round" : `Round ${roundStartModal?.round}`} is about to begin!
          </div>
          {roundStartModal?.leader && (
            <div className="mt-2">
              Current leader: <span className="font-bold">{roundStartModal.leader.name}</span> with {roundStartModal.leader.score} points
            </div>
          )}
        </div>
      </Announce>

  <header className="sticky top-0 z-50 bg-amber-200/90 backdrop-blur-md border-b border-amber-300 shadow-md">
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
              <div className="text-lg font-bold text-amber-900">Quiz Championship</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-36 hover:bg-muted transition-all duration-200 bg-white">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizState.groups.map((group) => {
                      const isStarted = group?.isStarted
                      const isCompleted = group?.isCompleted

                      return (
                        <SelectItem key={group.groupId} value={group.groupId.toString()}>
                          Group {group.groupId}{" "}
                          {isCompleted ? "✓ Completed" : isStarted ? "▶ In Progress" : "○ Not Started"}
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

              {/* Final Round button: reuse existing group start/switch logic. */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!quizData?.final) {
                    alert("Final round data not available.")
                    return
                  }
                  const finalId = quizData.final.group_id
                  startFinal()
                  setShowQuestion(false)
                  setShowAnswer(false)
                  resetTimer()
                  const leader = getCurrentLeader()
                  setRoundStartModal({ show: true, round: 0, groupId: finalId, leader: leader ? { name: leader.schoolName || leader.teamName, score: leader.totalScore } : undefined })
                }}
                className="hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                <Crown className="w-4 h-4 mr-2 text-amber-600" />
                Final
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetGroup(quizState?.currentGroup || 1)}
                className="hover:bg-amber-100 transition-all duration-200 hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 mr-2 text-amber-600" />
                Reset Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetQuiz}
                className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-105 bg-white"
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

      {/* final round modal removed; final round UI is rendered inline when isFinalRound is true */}

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Quiz Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentGroup.currentQuestion === 0 && (
              <Card className="p-6 bg-amber-100/60 border-amber-200">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-amber-700 mb-2">{roundName.startsWith("Final") ? "Starting Final Round" : `Starting Round ${currentGroup.currentRound}`}</h2>
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
            <Card className="p-6 bg-white/95 border border-amber-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {currentGroup.groupName || `Group ${quizState.currentGroup}`}
                  </h1>
                  <p className="text-muted-foreground">{roundName}</p>
                </div>
                <div className="flex items-center gap-3">
                  {currentGroup.currentRound === 1 && (currentQuestionData as MCQQuestion)?.section && (
                    <Badge className="text-sm px-4 py-3 bg-sky-100 text-sky-800">{(currentQuestionData as MCQQuestion).section}</Badge>
                  )}
                  <Badge variant="secondary" className="text-lg px-4 py-2 bg-amber-100 text-amber-700">
                    Question {currentGroup.currentQuestion + 1} of {totalQuestions}
                    {isLastQuestion() && <span className="ml-2 text-destructive">FINAL</span>}
                  </Badge>
                  {/* Show section tag for Round 1 MCQs (Science/Commerce/Arts) */}
                  
                </div>
              </div>

              <Progress value={progress} className="h-2 mb-4" />

              {/* Responsive layout: timer left, question center (stacks on small screens) */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                  <Card className="p-6 bg-white/95 border border-amber-100 shadow-sm">
                    <div className="flex flex-col items-center">
                      <div className={`text-4xl font-bold ${timer <= 10 ? "text-red-600" : "text-amber-600"} transition-colors duration-200`}>
                        <Timer className="w-6 h-6 inline mr-2 text-amber-600" />
                        {timer}s
                      </div>

                      <div className="flex flex-col mt-4 gap-3 w-full">
                        <Button
                          onClick={startTimer}
                          disabled={isTimerRunning}
                          className="w-full hover:bg-amber-600 bg-amber-500 text-white transition-all duration-200 hover:scale-105 shadow-sm"
                        >
                          <Play className="w-4 h-4 mr-2 inline" /> Start
                        </Button>

                        <Button
                          variant="outline"
                          onClick={stopTimer}
                          disabled={!isTimerRunning}
                          className="w-full hover:bg-muted transition-all duration-200 hover:scale-105 bg-transparent"
                        >
                          <Pause className="w-4 h-4 mr-2 inline" /> Stop
                        </Button>

                        <Button
                          variant="outline"
                          onClick={resetTimer}
                          className="w-full hover:bg-muted transition-all duration-200 hover:scale-105 bg-transparent"
                        >
                          <RotateCcw className="w-4 h-4 mr-2 inline" /> Reset
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="flex-1">
                  {/* Question Display */}
                  <Card className="p-8 bg-white/95 border border-amber-100 shadow-sm">
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
                          <h2 className="text-2xl font-bold text-amber-700 mb-6 leading-relaxed">
                            {currentQuestionData.question}
                          </h2>

                          {/* Recognition Question Media (image or sound) */}
                          {currentGroup.currentRound === 2 &&
                            "type" in currentQuestionData &&
                            currentQuestionData.url &&
                            currentQuestionData.url.trim() !== "" && (
                              <div className="mb-6">
                                {currentQuestionData.type === "image" ? (
                                  <div className="flex justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic external assets used as-is */}
                                    <img
                                      src={currentQuestionData.url}
                                      alt={currentQuestionData.question}
                                      className="w-64 h-64 object-contain rounded-lg border border-amber-100 shadow-sm"
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
                              {currentQuestionData.options.map((option, index) => {
                                const correctIndex = getCorrectOptionIndex(currentQuestionData.answer as string)
                                const isSelected = selectedOptionIndex === index
                                const isCorrect = isSelected && correctIndex === index
                                const isWrong = isSelected && correctIndex !== index
                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    className={`p-4 rounded-lg text-left font-medium text-lg transition-colors focus:outline-none flex items-start gap-3 ${
                                      isCorrect
                                        ? "bg-emerald-500 text-white"
                                        : isWrong
                                          ? "bg-red-500 text-white"
                                          : "bg-amber-50 hover:bg-amber-100"
                                    }`}
                                  >
                                    <span className="font-bold text-amber-700 mr-3">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                  </button>
                                )
                              })}
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
                </div>
              </div>
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
            {/* Team scoring buttons merged into leaderboard below - duplicate card removed */}

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
                    <div key={team.teamName} className="flex items-start justify-between p-4 bg-muted rounded-lg min-h-[76px]">
                      <div className="flex items-start gap-3 min-w-0 w-full">
                        <div
                          className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
                            index === 0
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

                        <div className="min-w-0 w-full">
                          {/* Controls moved above the name (compact row) */}
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => {
                                if (!quizState) return
                                addTeamScore(quizState.currentGroup, team.teamName, currentGroup.currentRound, 1)
                                setTempDeltas((s) => ({ ...s, [team.teamName]: (s[team.teamName] || 0) + 1 }))
                              }}
                              className="w-8 h-8 rounded-md bg-amber-500 text-white flex items-center justify-center text-sm"
                              aria-label={`Add point to ${team.teamName}`}
                            >
                              +
                            </button>

                            <div className="px-2 text-sm font-semibold">{tempDeltas[team.teamName] ?? 0}</div>

                            <button
                              onClick={() => {
                                if (!quizState) return
                                revokeTeamScore(quizState.currentGroup, team.teamName, currentGroup.currentRound)
                                setTempDeltas((s) => ({ ...s, [team.teamName]: (s[team.teamName] || 0) - 1 }))
                              }}
                              className="w-8 h-8 rounded-md border border-amber-200 flex items-center justify-center text-sm"
                              aria-label={`Remove point from ${team.teamName}`}
                            >
                              −
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="font-semibold truncate">{team.schoolName || team.teamName}</div>
                            <div className="text-sm text-foreground font-bold ml-4">{team.totalScore}</div>
                          </div>

                          <div className="text-xs text-muted-foreground truncate mt-1">R1: {team.round1Score} • R2: {team.round2Score} • R3: {team.round3Score}</div>
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
