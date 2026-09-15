'use client'

import { LinkSimpleIcon, PlusIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import {
  ANSWER_WORD_LIMITS, AWARDS_QUESTION, FAILURE_QUESTION, GROWTH_QUESTION,
  MAX_AWARDS, MAX_WORK_LINKS, NO_AWARDS_LABEL, WORK_QUESTION, countWords, isSafeWorkLink,
} from '@/lib/application-questions'
import styles from './apply-form.module.css'

function ShortAnswer({ id, name = id, label, limit, value, onChange, rows = 3 }: {
  id: string; name?: string; label: string; limit: number; value: string;
  onChange: (value: string) => void; rows?: number
}) {
  const input = useRef<HTMLTextAreaElement>(null)
  const words = countWords(value)
  useEffect(() => { input.current?.setCustomValidity(words > limit ? `Please use ${limit} words or fewer.` : '') }, [words, limit])
  return <div className={styles.shortAnswer}>
    <label htmlFor={id}>{label}</label>
    <textarea ref={input} id={id} name={name} required maxLength={1600} rows={rows} value={value}
      onChange={event => onChange(event.target.value)} aria-describedby={`${id}-count`}
      aria-invalid={words > limit || undefined} />
    <p id={`${id}-count`} className={`${styles.wordCount} ${words > limit ? styles.overLimit : ''}`}>
      {words} / {limit} words
    </p>
  </div>
}

export function ApplicationQuestions({ disabled }: { disabled: boolean }) {
  const [noAwards, setNoAwards] = useState(false)
  const [awards, setAwards] = useState([{ id: 0, text: '' }])
  const nextId = useRef(1)
  const focusAward = useRef<number | null>(null)
  const [work, setWork] = useState('')
  const [failure, setFailure] = useState('')
  const [growth, setGrowth] = useState('')
  useEffect(() => {
    if (focusAward.current !== null) {
      document.getElementById(`award-${focusAward.current}`)?.focus()
      focusAward.current = null
    }
  }, [awards.length])

  return <fieldset className={styles.section} disabled={disabled}>
    <legend><span>03</span> A little more about you</legend>
    <fieldset className={styles.awardsSection}>
      <legend>{AWARDS_QUESTION}</legend>
      <label className={styles.inputChoice}><input type="checkbox" checked={noAwards} onChange={event => setNoAwards(event.target.checked)} /><span>{NO_AWARDS_LABEL}</span></label>
      <input name="awardsStatus" type="hidden" value={noAwards ? 'none_yet' : 'listed'} />
      {!noAwards && <>
        <div className={styles.awardCards}>
          {awards.map((award, index) => <div className={styles.awardCard} key={award.id}>
            <ShortAnswer id={`award-${award.id}`} name="awardEntry" label={`Award ${index + 1}`} limit={ANSWER_WORD_LIMITS.award} rows={2}
              value={award.text} onChange={text => setAwards(current => current.map(item => item.id === award.id ? { ...item, text } : item))} />
            {awards.length > 1 && <button type="button" className={styles.removeAward} aria-label={`Remove award ${index + 1}`} onClick={() => {
              focusAward.current = awards[index + 1]?.id ?? awards[index - 1]?.id ?? null
              setAwards(current => current.filter(item => item.id !== award.id))
            }}><XIcon aria-hidden size={16} /></button>}
          </div>)}
        </div>
        <button type="button" className={styles.addAward} disabled={awards.length >= MAX_AWARDS} onClick={() => {
          const id = nextId.current++
          focusAward.current = id
          setAwards(current => [...current, { id, text: '' }])
        }}><PlusIcon aria-hidden size={16} />{awards.length >= MAX_AWARDS ? '10 awards added' : 'Add another award'}</button>
      </>}
    </fieldset>
    <div className={styles.shortQuestions}>
      <div>
        <ShortAnswer id="projectSummary" label={WORK_QUESTION} limit={ANSWER_WORD_LIMITS.work} value={work} onChange={setWork} rows={4} />
        <WorkLinks />
      </div>
      <ShortAnswer id="biggestFailure" label={FAILURE_QUESTION} limit={ANSWER_WORD_LIMITS.failure} value={failure} onChange={setFailure} />
      <ShortAnswer id="growthArea" label={GROWTH_QUESTION} limit={ANSWER_WORD_LIMITS.growth} value={growth} onChange={setGrowth} />
      <div className={styles.field}>
        <label htmlFor="portfolioUrl">Portfolio or project link <span>Optional</span></label>
        <div className={styles.linkInput}><LinkSimpleIcon aria-hidden size={18} /><input id="portfolioUrl" name="portfolioUrl" maxLength={2048} type="url" placeholder="https://" /></div>
      </div>
    </div>
  </fieldset>
}

function WorkLinks() {
  const [links, setLinks] = useState<{ id: number; url: string }[]>([])
  const nextId = useRef(0)
  const pendingFocus = useRef<number | 'add' | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (pendingFocus.current === 'add') addButton.current?.focus()
    else if (pendingFocus.current !== null) document.getElementById(`work-link-${pendingFocus.current}`)?.focus()
    pendingFocus.current = null
  }, [links.length])

  return <div className={styles.workLinks}>
    {links.length > 0 && <p className={styles.linkHelp} id="work-links-help">Optional · Up to {MAX_WORK_LINKS} links, separate from your word limit.</p>}
    {links.map((link, index) => <div className={styles.workLinkRow} key={link.id}>
      <div className={styles.field}>
        <label htmlFor={`work-link-${link.id}`}>Link {index + 1}</label>
        <input id={`work-link-${link.id}`} name="workLink" type="url" maxLength={2048} placeholder="https://" value={link.url} aria-describedby="work-links-help"
          onChange={event => {
            const value = event.target.value
            event.target.setCustomValidity(value.trim() && !isSafeWorkLink(value.trim()) ? 'Please enter an http:// or https:// link without login details.' : '')
            setLinks(current => current.map(item => item.id === link.id ? { ...item, url: value } : item))
          }} />
      </div>
      <button type="button" className={styles.removeLink} aria-label={`Remove link ${index + 1}`} onClick={() => {
        pendingFocus.current = links[index + 1]?.id ?? links[index - 1]?.id ?? 'add'
        setLinks(current => current.filter(item => item.id !== link.id))
      }}><XIcon aria-hidden size={17} /></button>
    </div>)}
    <button type="button" ref={addButton} className={styles.addAward} disabled={links.length >= MAX_WORK_LINKS} onClick={() => {
      const id = nextId.current++
      pendingFocus.current = id
      setLinks(current => [...current, { id, url: '' }])
    }}><PlusIcon aria-hidden size={16} />{links.length >= MAX_WORK_LINKS ? '5 links added' : links.length ? 'Add another link' : 'Add link'}</button>
  </div>
}
