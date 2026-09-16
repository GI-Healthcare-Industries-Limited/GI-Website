'use client'
import { useState } from 'react'
import { countWords, isSafeWorkLink } from '@/lib/application-questions'
import { type RoleQuestion, type RoleAnswers } from '@/lib/role-questions'
import { ApplicationQuestions } from './application-questions'
import styles from './apply-form.module.css'

export function SectionThree({questions,disabled}:{questions:RoleQuestion[]|null;disabled:boolean}) {
  const [shown,setShown]=useState(questions)
  const changed=Boolean(questions)!==Boolean(shown)
  return <>
    {changed&&<p role="status">The questions for this role have changed. Your current answers are still here. Please keep a copy before <button type="button" disabled={disabled} onClick={()=>setShown(questions)}>loading the updated Section 3</button>. Your other details will stay unchanged.</p>}
    {shown?<RoleQuestions questions={questions ?? shown} disabled={disabled}/>:<ApplicationQuestions disabled={disabled}/>}
  </>
}

export function RoleQuestions({questions,disabled}:{questions:RoleQuestion[];disabled:boolean}) {
  const [shown,setShown]=useState(questions)
  const [answers,setAnswers]=useState<RoleAnswers>({})
  const changed=JSON.stringify(questions)!==JSON.stringify(shown)
  const current=Object.fromEntries(shown.map(q=>[q.id,answers[q.id]??{text:'',entries:[],none:false}]))
  const update=(id:string,patch:Partial<RoleAnswers[string]>)=>setAnswers({...current,[id]:{...current[id],...patch}})
  return <fieldset className={`${styles.section} ${styles.roleQuestions}`} disabled={disabled}>
    <legend><span>03</span> A little more about you</legend>
    {changed&&<p role="status">This role’s questions have changed. <button type="button" onClick={()=>{setAnswers(Object.fromEntries(questions.filter(q=>shown.some(old=>old.id===q.id&&old.type===q.type)).map(q=>[q.id,current[q.id]])));setShown(questions)}}>Review updated questions</button> Your existing answers are kept for matching question formats; please review them before submitting.</p>}
    <input type="hidden" name="questionSet" value={JSON.stringify(shown)}/>
    <input type="hidden" name="roleAnswers" value={JSON.stringify(current)}/>
    <div className={styles.shortQuestions}>{shown.map(q=>{
      const a=current[q.id],id=`question-${q.id}`
      const textInput=(value:string,onChange:(v:string)=>void,inputId:string,required:boolean,rows=3)=><><textarea id={inputId} required={required} maxLength={4000} rows={rows} value={value} aria-describedby={`${inputId}-count`} onChange={e=>{e.target.setCustomValidity(countWords(e.target.value)>q.wordLimit?`Use ${q.wordLimit} words or fewer.`:'');onChange(e.target.value)}}/><p id={`${inputId}-count`} className={`${styles.wordCount} ${countWords(value)>q.wordLimit?styles.overLimit:''}`}>{countWords(value)} / {q.wordLimit} words</p></>
      return <div className={styles.shortAnswer} key={q.id}>
        {q.type==='awards'?<fieldset className={styles.awardsSection}><legend>{q.label}{!q.required?' (Optional)':''}</legend>
          <label className={styles.inputChoice}><input type="checkbox" checked={a.none} onChange={e=>update(q.id,{none:e.target.checked,entries:[]})}/><span>No competitions or awards yet</span></label>
          {!a.none&&<><div className={styles.awardCards}>{(a.entries.length?a.entries:['']).map((entry,i)=><div className={styles.awardCard} key={i}><label htmlFor={`${id}-${i}`}>Award {i+1}</label>{textInput(entry,text=>{const entries=a.entries.length?[...a.entries]:[''];entries[i]=text;update(q.id,{entries})},`${id}-${i}`,q.required,2)}{a.entries.length>1&&<button type="button" aria-label={`Remove award ${i+1}`} onClick={()=>update(q.id,{entries:a.entries.filter((_,j)=>i!==j)})}>Remove</button>}</div>)}</div><button type="button" className={styles.addAward} disabled={a.entries.length>=10} onClick={()=>update(q.id,{entries:[...(a.entries.length?a.entries:['']),'']})}>+ Add another award</button></>}
        </fieldset>:<><label htmlFor={q.type==='choice'?undefined:id}>{q.label}{!q.required?' (Optional)':''}</label>
          {q.type==='choice'?<fieldset className={styles.roleChoices} aria-label={q.label}>{q.options.map(option=><label className={styles.inputChoice} key={option}><input type="radio" name={id} value={option} checked={a.text===option} required={q.required} onChange={()=>update(q.id,{text:option})}/><span>{option}</span></label>)}{!q.required&&<button className={styles.addAward} type="button" onClick={()=>update(q.id,{text:''})}>Clear selection</button>}</fieldset>
          :q.type==='url'?<input id={id} type="url" required={q.required} maxLength={2048} value={a.text} placeholder="https://" onChange={e=>{e.target.setCustomValidity(e.target.value&&!isSafeWorkLink(e.target.value)?'Enter an http:// or https:// link without login details.':'');update(q.id,{text:e.target.value})}}/>
          :textInput(a.text,text=>update(q.id,{text}),id,q.required)}
          {q.type==='work'&&<div className={styles.workLinks}>{a.entries.map((url,i)=><div className={styles.workLinkRow} key={i}><label>Link {i+1}<input type="url" maxLength={2048} value={url} placeholder="https://" onChange={e=>{const entries=[...a.entries];entries[i]=e.target.value;update(q.id,{entries})}}/></label><button type="button" aria-label={`Remove link ${i+1}`} onClick={()=>update(q.id,{entries:a.entries.filter((_,j)=>i!==j)})}>Remove</button></div>)}<button type="button" className={styles.addAward} disabled={a.entries.length>=5} onClick={()=>update(q.id,{entries:[...a.entries,'']})}>+ Add link</button></div>}
        </>}
      </div>
    })}</div>
  </fieldset>
}
