import { z } from 'zod'
import { AWARDS_QUESTION, WORK_QUESTION, FAILURE_QUESTION, GROWTH_QUESTION, countWords, isSafeWorkLink } from '@/lib/application-questions'

export const ROLE_QUESTIONS_VERSION = 'role-questions-v1'
export const questionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/),
  label: z.string().trim().min(3).max(400),
  type: z.enum(['text', 'url', 'choice', 'awards', 'work']),
  required: z.boolean(), wordLimit: z.number().int().min(10).max(200),
  options: z.array(z.string().trim().min(1).max(120)).max(8),
}).strict().superRefine((q, ctx) => {
  if (q.type === 'choice' && (q.options.length < 2 || new Set(q.options).size !== q.options.length)) ctx.addIssue({code:'custom',message:'Give each multiple-choice question 2–8 distinct options.'})
})
export const questionSetSchema = z.array(questionSchema).min(1, 'Keep at least one question.').max(12).refine(q => new Set(q.map(x=>x.id)).size === q.length, 'Question IDs must be unique.').refine(q=>new TextEncoder().encode(JSON.stringify(q)).length<=12000,'The question set is too long. Shorten some questions or options.')
export type RoleQuestion = z.infer<typeof questionSchema>
export const DEFAULT_ROLE_QUESTIONS: RoleQuestion[] = [
  {id:'awards',label:AWARDS_QUESTION,type:'awards',required:true,wordLimit:20,options:[]},
  {id:'work',label:WORK_QUESTION,type:'work',required:true,wordLimit:80,options:[]},
  {id:'failure',label:FAILURE_QUESTION,type:'text',required:true,wordLimit:50,options:[]},
  {id:'growth',label:GROWTH_QUESTION,type:'text',required:true,wordLimit:40,options:[]},
  {id:'portfolio',label:'Portfolio or project link',type:'url',required:false,wordLimit:80,options:[]},
]
export const answerSchema = z.object({text:z.string().trim().max(4000),entries:z.array(z.string().trim().max(2048)).max(10),none:z.boolean()}).strict()
export const roleAnswersSchema = z.record(z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/), answerSchema).refine(a=>Object.keys(a).length<=12)
export type RoleAnswers = z.infer<typeof roleAnswersSchema>
export type QuestionSnapshot = { questions: RoleQuestion[]; answers: RoleAnswers }
export function validateRoleAnswers(questions: RoleQuestion[], answers: RoleAnswers) {
  const allowed = new Set(questions.map(q=>q.id))
  if (Object.keys(answers).some(id=>!allowed.has(id))) throw new Error('The questions have changed. Please review Section 3.')
  for (const q of questions) {
    const a = answers[q.id]
    if (!a) throw new Error(`Please review: ${q.label}`)
    if (q.type === 'awards') {
      if (a.text || (a.none && a.entries.length) || (!a.none && q.required && !a.entries.length) || a.entries.some(t=>!t || countWords(t)>q.wordLimit)) throw new Error(`Please check your award cards: ${q.label}`)
    } else {
      if (a.none || (q.type !== 'work' && a.entries.length)) throw new Error(`Please check: ${q.label}`)
      if (q.required && !a.text) throw new Error(`Please answer: ${q.label}`)
      if (q.type === 'url' && a.text && !isSafeWorkLink(a.text)) throw new Error(`Enter an http:// or https:// link: ${q.label}`)
      if (q.type === 'choice' && a.text && !q.options.includes(a.text)) throw new Error(`Choose an option: ${q.label}`)
      if (['text','work'].includes(q.type) && countWords(a.text)>q.wordLimit) throw new Error(`Use ${q.wordLimit} words or fewer: ${q.label}`)
      if (q.type === 'work' && (a.entries.length>5 || a.entries.some(t=>!isSafeWorkLink(t)))) throw new Error(`Check the links: ${q.label}`)
    }
  }
  return answers
}
