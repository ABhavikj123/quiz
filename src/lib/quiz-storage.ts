import type { QuizData, GroupState, QuizState } from "./quiz-types"

const QUIZ_STORAGE_KEY = "quiz-competition-state"

export const getQuizState = (): QuizState | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(QUIZ_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error reading quiz state:", error)
    return null
  }
}

export const saveQuizState = (state: QuizState): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Error saving quiz state:", error)
  }
}



// New: initialize quiz state from quizData (JSON)
export const initializeQuizState = (quizData: QuizData): QuizState => {
  const initialState: QuizState = {
    currentStage: "groups",
    currentGroup: quizData.groups[0]?.group_id || 1,
    groups: quizData.groups.map((g): GroupState => ({
      groupId: g.group_id,
      groupName: g.name,
      currentRound: 1,
      currentQuestion: 0,
      teams: ["Alpha", "Beta", "Gamma", "Delta"].map((teamName) => ({
        teamName,
        round1Score: 0,
        round2Score: 0,
        round3Score: 0,
        totalScore: 0,
      })),
      isCompleted: false,
      isStarted: false,
    })),
    finalists: [],
    groupWinners: [],
  }
  saveQuizState(initialState)
  return initialState
}

export const resetQuizState = (quizData: QuizData): QuizState => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(QUIZ_STORAGE_KEY)
  }
  return initializeQuizState(quizData)
}

export const resetGroupState = (groupId: number): void => {
  const state = getQuizState()
  if (!state) return

  const groupIndex = state.groups.findIndex((g) => g.groupId === groupId)
  if (groupIndex === -1) return

  const existingTeams = state.groups[groupIndex].teams

  state.groups[groupIndex] = {
    groupId,
    groupName: state.groups[groupIndex].groupName || `Group ${groupId}`,
    currentRound: 1,
    currentQuestion: 0,
    teams: ["Alpha", "Beta", "Gamma", "Delta"].map((teamName) => {
      const existingTeam = existingTeams.find((t) => t.teamName === teamName)
      return {
        teamName,
        schoolName: existingTeam?.schoolName, // Preserve school name
        round1Score: 0,
        round2Score: 0,
        round3Score: 0,
        totalScore: 0,
      }
    }),
    isCompleted: false,
    isStarted: false,
  }

  state.groupWinners = state.groupWinners.filter((w) => w.groupId !== groupId)

  saveQuizState(state)
}

export const updateTeamScore = (groupId: number, teamName: string, round: 1 | 2 | 3, questionIndex: number): void => {
  const state = getQuizState()
  if (!state) return

  const groupIndex = state.groups.findIndex((g) => g.groupId === groupId)
  if (groupIndex === -1) return

  const group = state.groups[groupIndex]
  const teamIndex = group.teams.findIndex((t) => t.teamName === teamName)
  if (teamIndex === -1) return

  const team = group.teams[teamIndex]

  // Increment the score for the specific round
  if (round === 1) team.round1Score += 1
  else if (round === 2) team.round2Score += 1
  else if (round === 3) team.round3Score += 1

  // Update total score
  team.totalScore = team.round1Score + team.round2Score + team.round3Score

  team.lastScoredQuestion = questionIndex
  team.lastScoredRound = round

  saveQuizState(state)
}

// Update team score by a delta (can be negative). Allows adding/subtracting multiple points.
export const updateTeamScoreByDelta = (
  groupId: number,
  teamName: string,
  round: 1 | 2 | 3,
  delta: number,
  questionIndex?: number,
) => {
  const state = getQuizState()
  if (!state) return

  const groupIndex = state.groups.findIndex((g) => g.groupId === groupId)
  if (groupIndex === -1) return

  const group = state.groups[groupIndex]
  const teamIndex = group.teams.findIndex((t) => t.teamName === teamName)
  if (teamIndex === -1) return

  const team = group.teams[teamIndex]

  // Add delta to the appropriate round score
  if (round === 1) team.round1Score += delta
  else if (round === 2) team.round2Score += delta
  else if (round === 3) team.round3Score += delta

  // Update total
  team.totalScore = team.round1Score + team.round2Score + team.round3Score

  if (typeof questionIndex === "number") {
    team.lastScoredQuestion = questionIndex
    team.lastScoredRound = round
  }

  saveQuizState(state)
}

export const revokeLastScore = (groupId: number, teamName: string, round: 1 | 2 | 3): void => {
  const state = getQuizState()
  if (!state) return

  const groupIndex = state.groups.findIndex((g) => g.groupId === groupId)
  if (groupIndex === -1) return

  const group = state.groups[groupIndex]
  const teamIndex = group.teams.findIndex((t) => t.teamName === teamName)
  if (teamIndex === -1) return

  const team = group.teams[teamIndex]

  // Decrement the score for the specific round (but not below 0)
  if (round === 1 && team.round1Score > 0) team.round1Score -= 1
  else if (round === 2 && team.round2Score > 0) team.round2Score -= 1
  else if (round === 3 && team.round3Score > 0) team.round3Score -= 1

  // Update total score
  team.totalScore = team.round1Score + team.round2Score + team.round3Score

  // Clear last scored tracking
  team.lastScoredQuestion = undefined
  team.lastScoredRound = undefined

  saveQuizState(state)
}

export const updateTeamSchoolName = (groupId: number, teamName: string, schoolName: string): void => {
  const state = getQuizState()
  if (!state) return

  const groupIndex = state.groups.findIndex((g) => g.groupId === groupId)
  if (groupIndex === -1) return

  const group = state.groups[groupIndex]
  const teamIndex = group.teams.findIndex((t) => t.teamName === teamName)
  if (teamIndex === -1) return

  group.teams[teamIndex].schoolName = schoolName
  saveQuizState(state)
}
