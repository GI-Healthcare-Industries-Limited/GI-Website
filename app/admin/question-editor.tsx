'use client'
import { useState } from 'react'
import { DEFAULT_ROLE_QUESTIONS, type RoleQuestion } from '@/lib/role-questions'
import styles from './job-postings.module.css'

export function QuestionEditor({value,onChange}:{value:RoleQuestion[]|null;onChange:(q:RoleQuestion[]|null)=>void}) {
  const questions=value ?? DEFAULT_ROLE_QUESTIONS
  const [reset,setReset]=useState(false)
  const change=(id:string,patch:Partial<RoleQuestion>)=>onChange(questions.map(q=>q.id===id?{...q,...patch}:q))
  function move(index:number,delta:number){const next=[...questions];[next[index],next[index+delta]]=[next[index+delta],next[index]];onChange(next)}
  return <section className={`${styles.wide} ${styles.questionBuilder}`} aria-labelledby="question-builder-title">
    <h3 id="question-builder-title">03 · A little more about you</h3>
    <p className={styles.help}>Build this role’s questions. Sections 1 and 2 stay the same for every role. Changes go live when you save; earlier applications keep their original questions.</p>
    <p className={styles.help}>Ask only job-relevant questions. Do not request sensitive personal information or identity documents here.</p>
    {questions.map((q,index)=><fieldset className={styles.questionCard} key={q.id}>
      <legend>Question {index+1}</legend>
      <label>Question text<textarea aria-label="Question text" required minLength={3} maxLength={400} rows={2} value={q.label} onChange={e=>change(q.id,{label:e.target.value})}/></label>
      <div className={styles.fields}>
        <label>Answer format<select aria-label="Answer format" value={q.type} onChange={e=>change(q.id,{type:e.target.value as RoleQuestion['type'],options:e.target.value==='choice'?['Yes','No']:[]})}>
          <option value="text">Written answer</option><option value="work">Written answer + links</option><option value="url">Website link</option><option value="choice">Multiple choice</option><option value="awards">Award cards</option>
        </select></label>
        {!['url','choice'].includes(q.type)&&<label>Maximum words{q.type==='awards'?' per card':''}<input type="number" min={10} max={200} required value={q.wordLimit} onChange={e=>change(q.id,{wordLimit:Number(e.target.value)})}/></label>}
      </div>
      {q.type==='choice'&&<div>{q.options.map((option,i)=><div className={styles.dateRow} key={i}><label className={styles.wide}>Option {i+1}<input required maxLength={120} value={option} onChange={e=>change(q.id,{options:q.options.map((v,j)=>i===j?e.target.value:v)})}/></label><button type="button" disabled={q.options.length<=2} aria-label={`Remove option ${i+1} from question ${index+1}`} onClick={()=>change(q.id,{options:q.options.filter((_,j)=>j!==i)})}>Remove</button></div>)}<button type="button" disabled={q.options.length>=8} onClick={()=>change(q.id,{options:[...q.options,'']})}>Add option</button></div>}
      <label className={styles.toggle}><input type="checkbox" checked={q.required} onChange={e=>change(q.id,{required:e.target.checked})}/><span>Required answer</span></label>
      <div className={styles.actions}>
        <button type="button" disabled={index===0} aria-label={`Move question ${index+1} up`} onClick={()=>move(index,-1)}>↑ Move up</button>
        <button type="button" disabled={index===questions.length-1} aria-label={`Move question ${index+1} down`} onClick={()=>move(index,1)}>↓ Move down</button>
        <button type="button" disabled={questions.length<=1} onClick={()=>onChange(questions.filter(x=>x.id!==q.id))}>Remove question {index+1}</button>
      </div>
    </fieldset>)}
    <div className={styles.actions}><button type="button" disabled={questions.length>=12} onClick={()=>onChange([...questions,{id:crypto.randomUUID(),label:'',type:'text',required:true,wordLimit:80,options:[]}])}>+ Add question</button><button type="button" disabled={!value} onClick={()=>setReset(true)}>Restore defaults</button></div>
    {reset&&<div className={styles.confirm}><p>Replace this role’s questions with the original five? Existing applications will not change.</p><div className={styles.actions}><button type="button" onClick={()=>{onChange(null);setReset(false)}}>Restore original questions</button><button type="button" onClick={()=>setReset(false)}>Keep editing</button></div></div>}
  </section>
}
