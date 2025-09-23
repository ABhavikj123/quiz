"use client"

import { useState, useEffect } from "react"
import type { QuizState, QuizData } from "@/lib/quiz-types"
import {
  getQuizState,
  saveQuizState,
  initializeQuizState,
  resetQuizState,
  resetGroupState,
  updateTeamScore,
  revokeLastScore,
} from "@/lib/quiz-storage"

export const useQuiz = () => {
  const [quizState, setQuizState] = useState<QuizState | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [gameOverModal, setGameOverModal] = useState<{
    show: boolean
    type: "group"
    winner: string
    score: number
    groupId?: number
  } | null>(null)

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const response = await fetch("/questions.json", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON")
        }

        const data = await response.json()
        setQuizData(data)
        // Only initialize state after quizData is loaded
        const state = getQuizState() || initializeQuizState(data)
        setQuizState(state)
        
      } catch (error) {
        console.error("Error loading quiz data:", error)
        setQuizData(null)
      }
    }

    loadQuizData()
  }, [])

  const updateState = (newState: QuizState) => {
    setQuizState(newState)
    saveQuizState(newState)
  }

  const resetQuiz = () => {
    if (!quizData) return
    const newState = resetQuizState(quizData)
    setQuizState(newState)
  }

  const resetGroup = (groupId: number) => {
    resetGroupState(groupId)
    const updatedState = getQuizState()
    if (updatedState) {
      setQuizState(updatedState)
    }
  }

  const addTeamScore = (groupId: number, teamName: string, round: 1 | 2 | 3) => {
    if (!quizState) return false

    const currentGroup = quizState.groups.find((g) => g.groupId === groupId)
    if (!currentGroup) return false

    const team = currentGroup.teams.find((t) => t.teamName === teamName)
    if (!team) return false

    // Prevent multiple scoring for same question
    if (
      team.lastScoredQuestion === currentGroup.currentQuestion &&
      team.lastScoredRound === currentGroup.currentRound
    ) {
      return false
    }

    updateTeamScore(groupId, teamName, round, currentGroup.currentQuestion)
    const updatedState = getQuizState()
    if (updatedState) {
      setQuizState(updatedState)
      return true
    }
    return false
  }

  const revokeTeamScore = (groupId: number, teamName: string, round: 1 | 2 | 3) => {
    if (!quizState) return false

    const currentGroup = quizState.groups.find((g) => g.groupId === groupId)
    if (!currentGroup) return false

    revokeLastScore(groupId, teamName, round)
    const updatedState = getQuizState()
    if (updatedState) {
      setQuizState(updatedState)
      return true
    }
    return false
  }

  const nextQuestion = () => {
    if (!quizState || !quizData) return

    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return

    const groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
    if (!groupData) return

    let maxQuestions = 0
    if (currentGroup.currentRound === 1) {
      maxQuestions = groupData.rounds.round1_mcq.length
    } else if (currentGroup.currentRound === 2) {
      maxQuestions = groupData.rounds.round2_recognition.length
    } else if (currentGroup.currentRound === 3) {
      maxQuestions = groupData.rounds.round3_general.length
    }

    const newState = { ...quizState }
    const groupIndex = newState.groups.findIndex((g) => g.groupId === quizState.currentGroup)

    if (currentGroup.currentQuestion < maxQuestions - 1) {
      // Next question in current round
      newState.groups[groupIndex].currentQuestion += 1
    } else if (currentGroup.currentRound < 3) {
      // Next round
      newState.groups[groupIndex].currentRound += 1
      newState.groups[groupIndex].currentQuestion = 0
    } else {
      // Group completed - show game over modal
      newState.groups[groupIndex].isCompleted = true

      // Find winner
      const winner = currentGroup.teams.reduce((prev, current) =>
        prev.totalScore > current.totalScore ? prev : current,
      )

      newState.groups[groupIndex].winner = winner.teamName

      // Add to group winners
      if (!newState.groupWinners.find((w) => w.groupId === quizState.currentGroup)) {
        newState.groupWinners.push({
          groupId: quizState.currentGroup,
          winner: winner.teamName,
          schoolName: winner.schoolName,
        })
      }

      // Show game over modal
      setGameOverModal({
        show: true,
        type: "group",
        winner: winner.schoolName || winner.teamName,
        score: winner.totalScore,
        groupId: quizState.currentGroup,
      })
    }

    updateState(newState)
  }

  const previousQuestion = () => {
    if (!quizState) return

    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return

    const newState = { ...quizState }
    const groupIndex = newState.groups.findIndex((g) => g.groupId === quizState.currentGroup)

    if (currentGroup.currentQuestion > 0) {
      // Previous question in current round
      newState.groups[groupIndex].currentQuestion -= 1
    } else if (currentGroup.currentRound > 1) {
      // Previous round
      newState.groups[groupIndex].currentRound -= 1
      // Set to last question of previous round
      if (currentGroup.currentRound === 2) {
        newState.groups[groupIndex].currentQuestion = 1 // Round 1 has 2 questions (0-1)
      } else if (currentGroup.currentRound === 3) {
        newState.groups[groupIndex].currentQuestion = 1 // Round 2 has 2 questions (0-1)
      }
    }

    updateState(newState)
  }

  const switchGroup = (groupId: number) => {
    if (!quizState) return

    const newState = { ...quizState }
    newState.currentGroup = groupId
    updateState(newState)
  }

  const startGroup = (groupId: number) => {
    if (!quizState) return

    const newState = { ...quizState }
    const groupIndex = newState.groups.findIndex((g) => g.groupId === groupId)

    if (groupIndex !== -1) {
      newState.groups[groupIndex].isStarted = true
      newState.currentGroup = groupId
      updateState(newState)
    }
  }

  const updateTeamName = (groupId: number, teamName: string, schoolName: string) => {
    if (!quizState) return

    const newState = { ...quizState }
    const groupIndex = newState.groups.findIndex((g) => g.groupId === groupId)

    if (groupIndex !== -1) {
      const teamIndex = newState.groups[groupIndex].teams.findIndex((t) => t.teamName === teamName)
      if (teamIndex !== -1) {
        newState.groups[groupIndex].teams[teamIndex].schoolName = schoolName
        updateState(newState)
      }
    }
  }

  const closeGameOverModal = () => {
    setGameOverModal(null)
  }

  return {
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
  }
}
