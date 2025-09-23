export interface MCQQuestion {
  question: string
  options: string[]
  answer: string
}

export interface RecognitionQuestion {
  type: "image" | "sound"
  url: string
  question: string
  answer: string
}

export interface GeneralQuestion {
  question: string
  options: string[]
  answer: string
}

export interface QuizRounds {
  round1_mcq: MCQQuestion[]
  round2_recognition: RecognitionQuestion[]
  round3_general: GeneralQuestion[]
}

export interface QuizGroup {
  group_id: number
  name: string
  rounds: QuizRounds
}

export interface QuizData {
  title: string
  description: string
  groups: QuizGroup[]
  final: {
    name: string
    description: string
    rounds: QuizRounds
  }
}

export interface TeamScore {
  teamName: string
  schoolName?: string
  round1Score: number
  round2Score: number
  round3Score: number
  totalScore: number
  lastScoredQuestion?: number 
  lastScoredRound?: number 
}

export interface GroupState {
  groupId: number
  groupName?: string
  currentRound: 1 | 2 | 3
  currentQuestion: number
  teams: TeamScore[]
  isCompleted: boolean
  isStarted: boolean // Track if group has started
  winner?: string 
}

export interface QuizState {
  currentStage: "groups" 
  currentGroup: number
  groups: GroupState[]
  finalists: string[] 
  finalState?: GroupState
  groupWinners: { groupId: number; winner: string; schoolName?: string }[] 
}
