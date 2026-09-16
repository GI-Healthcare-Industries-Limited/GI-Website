import { type QuestionSnapshot } from '@/lib/role-questions'
import { isSafeWorkLink } from '@/lib/application-questions'
export function SubmissionQuestions({snapshot}:{snapshot:QuestionSnapshot}) {
  return <section aria-label="Submitted role questions">{snapshot.questions.map(q=>{
    const a=snapshot.answers[q.id]
    return <article className="admin-message-body" key={q.id}><p className="section-index">{q.label}</p>
      {a?.text ? q.type==='url' && isSafeWorkLink(a.text)?<p><a href={a.text} target="_blank" rel="noreferrer">{a.text}</a></p>:<p>{a.text}</p> : a?.none?<p>No competitions or awards yet</p>:!a?.entries.length?<p>Not provided (optional).</p>:null}
      {Boolean(a?.entries.length)&&<ul>{a.entries.map((entry,i)=><li key={i}>{q.type==='work'&&isSafeWorkLink(entry)?<a href={entry} target="_blank" rel="noreferrer">{entry}</a>:entry}</li>)}</ul>}
    </article>
  })}</section>
}
