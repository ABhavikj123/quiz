"use client"

import { useState, useEffect } from "react"
import type { QuizState, QuizData, FlattenedGroup, FlattenedRounds, GroupState } from "@/lib/quiz-types"
import {
  getQuizState,
  saveQuizState,
  initializeQuizState,
  resetQuizState,
  resetGroupState,
  updateTeamScoreByDelta,
} from "@/lib/quiz-storage"

// Raw question types matching questions.json structure
type RawMCQQuestion = {
  question: string
  options: string[]
  answer: string
}

type RawRecognitionQuestion = {
  question: string
  media_type: string
  media_link: string
  answer: string
}

type RawGeneralQuestion = RawMCQQuestion

type RawRoundSection<T> = {
  section: string
  questions: T[]
}

type RawRound = {
  round_number: number
  type: string
  sections: Array<RawRoundSection<unknown>>
}

type RawGroup = {
  group_number: number
  rounds: RawRound[]
}

type RawQuiz = { groups: RawGroup[] }

const flattenQuizData = (rawData: RawQuiz): QuizData => {
  return {
    groups: rawData.groups.map((group): FlattenedGroup => {
      const rounds: FlattenedRounds = {
        round1_mcq: [],
        round2_recognition: [],
        round3_general: [],
      }

      group.rounds.forEach((round) => {
        if (round.round_number === 1) {
          // Flatten Round 1 sections (Science, Commerce, Arts)
          const sections = round.sections as RawRoundSection<RawMCQQuestion>[]
          sections.forEach((section) => {
            // attach section name to each question so UI can show tags
            const tagged = section.questions.map((q) => ({ ...q, section: (section.section as "Science" | "Commerce" | "Arts") }))
            rounds.round1_mcq.push(...tagged)
          })
        } else if (round.round_number === 2) {
          // Flatten Round 2 sections (Image, Audio) and transform media_type/media_link to type/url
          const sections = round.sections as RawRoundSection<RawRecognitionQuestion>[]
          sections.forEach((section) => {
            const transformedQuestions = section.questions.map((q) => {
              // Normalize media type to app's expected values and make URLs root-relative
              const rawType = (q.media_type || "").toLowerCase()
              const type: "image" | "sound" = rawType === "image" ? "image" : "sound"
              let url = q.media_link || ""
              // Convert ./path/... to /path/... so asset URLs resolve correctly from the site root
              if (typeof url === "string" && url.startsWith("./")) {
                url = url.replace(/^\.\//, "/")
              }
              return {
                question: q.question,
                type,
                url,
                answer: q.answer,
              }
            })
            rounds.round2_recognition.push(...transformedQuestions)
          })
        } else if (round.round_number === 3) {
          // Flatten Round 3 sections (General)
          const sections = round.sections as RawRoundSection<RawGeneralQuestion>[]
          sections.forEach((section) => {
            rounds.round3_general.push(...section.questions)
          })
        }
      })

      return {
        group_id: group.group_number,
        name: `Group ${group.group_number}`,
        rounds,
      }
    }),
  }
}

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

        const rawData = await response.json()
        const flattenedData = flattenQuizData(rawData)

        // Attempt to load final.json and attach it as quizData.final (do NOT append to groups)
        try {
          const finalResp = await fetch("/final.json", {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          })

          if (finalResp.ok) {
            const finalJson = await finalResp.json()
            const finalQuestions = Array.isArray(finalJson.questions) ? finalJson.questions : []

            // Use a fixed, high id for the final group to avoid colliding with regular groups
            const finalGroupId = 5   

            const finalFlattened: FlattenedGroup = {
              group_id: finalGroupId,
              name: "Final",
              rounds: {
                round1_mcq: [],
                round2_recognition: [],
                // Map final questions into round3_general so existing UI/logic can reuse it
                    round3_general: finalQuestions.map((q: { question: string; answer: string }) => ({
                      question: q.question,
                      answer: q.answer,
                    })),
              },
            }
                // attach final separately
                flattenedData.final = finalFlattened
          }
        } catch (e) {
          console.warn("Could not load final.json", e)
        }

        setQuizData(flattenedData)

        const persisted = getQuizState()
        if (persisted) {
          // If final data exists, ensure any persisted 'Final' group is mapped to the fixed final id
          const finalData = flattenedData.final
          if (finalData) {
            const finalId = finalData.group_id
            const idx = persisted.groups.findIndex((g) => g.groupName === "Final")
            if (idx !== -1) {
              const oldId = persisted.groups[idx].groupId
              if (oldId !== finalId) {
                // remap persisted group's id to finalId and update references
                persisted.groups[idx].groupId = finalId
                if (persisted.currentGroup === oldId) persisted.currentGroup = finalId
                persisted.groupWinners = persisted.groupWinners.map((w) => (w.groupId === oldId ? { ...w, groupId: finalId } : w))
                // Update any saved state in localStorage
                saveQuizState(persisted)
              }
            }
          }

          setQuizState(persisted)
        } else {
          const state = initializeQuizState(flattenedData)
          setQuizState(state)
        }
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

  const addTeamScore = (groupId: number, teamName: string, round: 1 | 2 | 3, delta = 1) => {
    if (!quizState) return false

    const currentGroup = quizState.groups.find((g) => g.groupId === groupId)
    if (!currentGroup) return false

    const team = currentGroup.teams.find((t) => t.teamName === teamName)
    if (!team) return false

    // allow multiple scoring per question; track last scored question if delta provided
    updateTeamScoreByDelta(groupId, teamName, round, delta, currentGroup.currentQuestion)
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

    // Revoke by subtracting 1 point (previous behavior)
    updateTeamScoreByDelta(groupId, teamName, round, -1)
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

    // Support final data stored separately on quizData.final
    let groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
    if (!groupData && quizData.final && quizData.final.group_id === quizState.currentGroup) {
      groupData = quizData.final
    }
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
      newState.groups[groupIndex].currentQuestion += 1
    } else if (currentGroup.currentRound < 3) {
      newState.groups[groupIndex].currentRound += 1
      newState.groups[groupIndex].currentQuestion = 0
    } else {
      newState.groups[groupIndex].isCompleted = true

      const winner = currentGroup.teams.reduce((prev, current) =>
        prev.totalScore > current.totalScore ? prev : current,
      )

      newState.groups[groupIndex].winner = winner.teamName

      if (!newState.groupWinners.find((w) => w.groupId === quizState.currentGroup)) {
        newState.groupWinners.push({
          groupId: quizState.currentGroup,
          winner: winner.teamName,
          schoolName: winner.schoolName,
        })
      }

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
    if (!quizState || !quizData) return

    const currentGroup = quizState.groups.find((g) => g.groupId === quizState.currentGroup)
    if (!currentGroup) return

    // Support final data stored separately on quizData.final
    let groupData = quizData.groups.find((g) => g.group_id === quizState.currentGroup)
    if (!groupData && quizData.final && quizData.final.group_id === quizState.currentGroup) {
      groupData = quizData.final
    }
    if (!groupData) return

    const newState = { ...quizState }
    const groupIndex = newState.groups.findIndex((g) => g.groupId === quizState.currentGroup)

    if (currentGroup.currentQuestion > 0) {
      newState.groups[groupIndex].currentQuestion -= 1
    } else if (currentGroup.currentRound > 1) {
      newState.groups[groupIndex].currentRound -= 1

      let maxQuestions = 0
      if (newState.groups[groupIndex].currentRound === 1) {
        maxQuestions = groupData.rounds.round1_mcq.length
      } else if (newState.groups[groupIndex].currentRound === 2) {
        maxQuestions = groupData.rounds.round2_recognition.length
      }

      newState.groups[groupIndex].currentQuestion = maxQuestions - 1
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
    let groupIndex = newState.groups.findIndex((g) => g.groupId === groupId)

    if (groupIndex === -1) {
      // group missing in state (likely the Final group). Try to create it from quizData
      const gData = quizData?.groups.find((g) => g.group_id === groupId)
      const isFinal = quizData?.final?.group_id === groupId || gData?.name?.toLowerCase() === "final"

      const newGroupState: GroupState = {
        groupId,
        groupName: gData?.name || `Group ${groupId}`,
        currentRound: isFinal ? 3 : 1,
        currentQuestion: 0,
        teams: ["Alpha", "Beta", "Gamma", "Delta"].map((teamName) => ({
          teamName,
          round1Score: 0,
          round2Score: 0,
          round3Score: 0,
          totalScore: 0,
        })),
        isCompleted: false,
        isStarted: true,
      }

      newState.groups.push(newGroupState)
      groupIndex = newState.groups.findIndex((g) => g.groupId === groupId)
    } else {
      newState.groups[groupIndex].isStarted = true
    }

    newState.currentGroup = groupId
    updateState(newState)
  }

  // Start the final round (keeps final separate from normal groups)
  const startFinal = () => {
    if (!quizData) return
    if (!quizData.final) {
      console.warn("No final data available")
      return
    }

    const finalId = quizData.final.group_id

  // If final already exists in state, just switch and mark started
  const newState = quizState ? { ...quizState } : null

    if (newState) {
      let groupIndex = newState.groups.findIndex((g) => g.groupId === finalId)
      if (groupIndex === -1) {
        const newGroupState: GroupState = {
          groupId: finalId,
          groupName: quizData.final.name || "Final",
          currentRound: 3 as 1 | 2 | 3,
          currentQuestion: 0,
          teams: ["Alpha", "Beta", "Gamma", "Delta"].map((teamName) => ({
            teamName,
            round1Score: 0,
            round2Score: 0,
            round3Score: 0,
            totalScore: 0,
          })),
          isCompleted: false,
          isStarted: true,
        }
        newState.groups.push(newGroupState)
        groupIndex = newState.groups.findIndex((g) => g.groupId === finalId)
      } else {
        newState.groups[groupIndex].isStarted = true
      }

      newState.currentStage = "final"
      newState.currentGroup = finalId
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
    startFinal,
    updateTeamName,
    closeGameOverModal,
  }
}
