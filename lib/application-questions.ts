export const APPLICATION_QUESTIONS_VERSION = 'application-questions-v2'
export const NO_AWARDS_LABEL = 'No competitions or awards yet'
export const AWARDS_QUESTION = 'Have you won any competitions or awards? Tell us what you won and what it was for.'
export const AWARD_DETAIL_QUESTION = 'Choose one result from your list. Describe a specific moment, what you personally did, and how the result was decided.'
export const ACTIVITY_DETAIL_QUESTION = 'Instead, tell us about an extracurricular activity or personal challenge you stuck with. Describe one specific moment, what you did, and what happened.'
export const WORK_QUESTION = 'Tell us about things you’ve built or created—apps, websites, open-source work, videos, articles or research. Include links if you can.'
export const FAILURE_QUESTION = 'What’s your biggest failure?'
export const GROWTH_QUESTION = 'What’s one thing your friends would say you need to work on? Why do you think they’d pick it?'
export const ANSWER_WORD_LIMITS = { award: 20, work: 80, failure: 50, growth: 40 } as const
export const MAX_AWARDS = 10

// Shared by browser counters and server validation. No input monitoring.
export function countWords(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length
}
