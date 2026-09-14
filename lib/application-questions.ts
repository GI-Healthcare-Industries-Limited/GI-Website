export const APPLICATION_QUESTIONS_VERSION = 'application-questions-v1'
export const AUTHORSHIP_STATEMENT = 'These answers describe my own experience and are my own writing, not AI-generated or AI-rewritten responses.'
export const NO_AWARDS_LABEL = 'No competitions or awards yet'
export const AWARDS_QUESTION = 'List any competitions or awards you’ve won.'
export const AWARD_DETAIL_QUESTION = 'Choose one result from your list. Describe a specific moment, what you personally did, and how the result was decided.'
export const ACTIVITY_DETAIL_QUESTION = 'Instead, tell us about an extracurricular activity or personal challenge you stuck with. Describe one specific moment, what you did, and what happened.'
export const WORK_QUESTION = 'Tell us about things you’ve built before.'
export const FAILURE_QUESTION = 'What’s your biggest failure or setback in a project, work or study, and what did you learn from it?'
export const GROWTH_QUESTION = 'What’s one habit or working style a close friend or teammate would encourage you to improve, and what are you doing about it?'

// A UI-only nudge, not an AI detector or a security boundary. Never record
// clipboard contents, key events, input timings or the accessibility preference.
export function shouldDiscourageInsertion(ownDraftInput: boolean, operation: string) {
  return !ownDraftInput && (operation === 'paste' || operation === 'drop')
}
