export type MoodReading =
  | { kind: 'unreadable' }
  | { kind: 'score'; index: number }

export type ActionPlan = {
  direction: string
  phrasing?: string
}

export interface AnalysisOptions {
  apiKey?: string
}

export interface ExGirlfriendReport {
  message: string
  context: string
  mood: MoodReading
  action: ActionPlan
  landmines: string[]
}

export interface GirlfriendReport {
  message: string
  context: string
  mood: MoodReading
  diagnosis: string
  action: ActionPlan
  landmines: string[]
}

export type Report = ExGirlfriendReport | GirlfriendReport
