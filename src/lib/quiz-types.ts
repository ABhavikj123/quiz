export interface MCQQuestion {
  question: string
  options: string[]
  answer: string
  section?: "Science" | "Commerce" | "Arts"
}

export interface RecognitionQuestion {
  question: string
  type: "image" | "sound"
  url: string
  answer: string
}

export interface GeneralQuestion {
  question: string
  options: string[]
  answer: string
}

export interface Round1Section {
  section: "Science" | "Commerce" | "Arts"
  questions: MCQQuestion[]
}

export interface Round2Section {
  section: "Image" | "Audio"
  questions: RecognitionQuestion[]
}

export interface Round3Section {
  section: "General"
  questions: GeneralQuestion[]
}

export interface Round {
  round_number: number
  type: string
  sections: Round1Section[] | Round2Section[] | Round3Section[]
}

export interface QuizGroup {
  group_number: number
  rounds: Round[]
}

export interface FlattenedRounds {
  round1_mcq: MCQQuestion[]
  round2_recognition: RecognitionQuestion[]
  round3_general: GeneralQuestion[]
}

export interface FlattenedGroup {
  group_id: number
  name: string
  rounds: FlattenedRounds
}

export interface QuizData {
  groups: FlattenedGroup[]
  // Optional final group (separate from group stage)
  final?: FlattenedGroup
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
  isStarted: boolean
  winner?: string
}

export interface QuizState {
  // 'groups' for group stage, 'final' when final round is active
  currentStage: "groups" | "final"
  currentGroup: number
  groups: GroupState[]
  finalists: string[]
  finalState?: GroupState
  groupWinners: { groupId: number; winner: string; schoolName?: string }[]
}
