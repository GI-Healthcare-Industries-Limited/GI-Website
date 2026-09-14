'use client'

import { LinkSimpleIcon } from '@phosphor-icons/react'
import { type Ref, type SyntheticEvent, useEffect, useRef, useState } from 'react'
import {
  ACTIVITY_DETAIL_QUESTION, AUTHORSHIP_STATEMENT, AWARD_DETAIL_QUESTION, AWARDS_QUESTION,
  FAILURE_QUESTION, GROWTH_QUESTION, NO_AWARDS_LABEL, WORK_QUESTION, shouldDiscourageInsertion,
} from '@/lib/application-questions'
import styles from './apply-form.module.css'

function WrittenAnswer({ id, label, help, min, max, allowPaste, value, onChange, inputRef }: {
  id: string; label: string; help: string; min: number; max: number; allowPaste: boolean;
  value: string; onChange: (value: string) => void; inputRef?: Ref<HTMLTextAreaElement>
}) {
  const [pasteNotice, setPasteNotice] = useState(false)
  function discourage(event: SyntheticEvent, operation: string) {
    if (shouldDiscourageInsertion(allowPaste, operation)) { event.preventDefault(); setPasteNotice(true) }
  }
  return <div className={`${styles.field} ${styles.summary}`}>
    <label htmlFor={id}>{label}</label>
    <p className={styles.help} id={`${id}-help`}>{help}</p>
    <textarea ref={inputRef} id={id} name={id} required minLength={min} maxLength={max} value={value}
      onChange={(event) => onChange(event.target.value)} autoComplete="off" spellCheck
      onPaste={(event) => discourage(event, 'paste')} onDrop={(event) => discourage(event, 'drop')}
      aria-describedby={`${id}-help ${id}-count ${id}-paste`} />
    <div className={styles.counter} id={`${id}-count`}><span>{min}–{max.toLocaleString('en-GB')} characters</span><span>{value.length} / {max.toLocaleString('en-GB')}</span></div>
    <p className={styles.pasteNotice} id={`${id}-paste`} role="status">{pasteNotice && !allowPaste ? 'Please write this answer in your own words here. To use your own draft or an assistive tool, enable the paste option above. Nothing from your clipboard was read or recorded.' : ''}</p>
  </div>
}

export function ApplicationQuestions({ disabled }: { disabled: boolean }) {
  const [allowPaste, setAllowPaste] = useState(false)
  const [noAwards, setNoAwards] = useState(false)
  const [awards, setAwards] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState('')
  const [work, setWork] = useState('')
  const [failure, setFailure] = useState('')
  const [growth, setGrowth] = useState('')
  const [awardsError, setAwardsError] = useState('')
  const detailRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (detailVisible) detailRef.current?.focus() }, [detailVisible])

  return <fieldset className={styles.section} disabled={disabled}>
    <legend><span>03</span> Your experience, in your words</legend>
    <div className={styles.writingNote}>
      <strong>Specific beats polished.</strong>
      <p>Write these answers yourself, here in the form. Short sentences and bullet points are welcome. Please don’t use AI to generate or rewrite your answers. We may discuss your examples with you at interview.</p>
      <p>Dictation, assistive tools and basic spelling checks are welcome. There is no writing timer, keystroke tracking or AI scoring.</p>
      <label className={styles.inputChoice}><input type="checkbox" checked={allowPaste} onChange={(event) => setAllowPaste(event.target.checked)} /><span>Allow paste from my own draft or assistive tools</span></label>
      <p className={styles.help}>This input preference is not saved or shown to the reviewer. It does not change the request for your own writing.</p>
    </div>

    <div className={styles.answerCard}>
      <p className={styles.answerIndex}>01 · Beyond the day-to-day</p>
      <input type="hidden" name="awardsStatus" value={noAwards ? 'none_yet' : 'listed'} />
      <label className={styles.inputChoice}><input type="checkbox" checked={noAwards} onChange={(event) => { setNoAwards(event.target.checked); setDetailVisible(false); setDetail(''); setAwardsError('') }} /><span>{NO_AWARDS_LABEL}</span></label>
      <p className={styles.help}>An honest “none yet” is welcome—you can tell us about an activity instead.</p>
      {!noAwards && <WrittenAnswer id="competitionAwards" label={AWARDS_QUESTION} help="One result per line: competition or award, organiser, year, what you won, and your individual or team contribution. Include a public result link if you have one; a link is not required." min={10} max={1600} allowPaste={allowPaste} value={awards} onChange={(value) => { setAwards(value); setAwardsError('') }} />}
      {noAwards && <input type="hidden" name="competitionAwards" value="" />}
      {!detailVisible ? <>
        <button id="awards-detail-reveal" className={styles.detailButton} type="button" onClick={() => {
          if (!noAwards && awards.trim().length < 10) { setAwardsError('Add a result first, or choose “No competitions or awards yet”.'); document.getElementById('competitionAwards')?.focus(); return }
          setAwardsError(''); setDetailVisible(true)
        }}>Continue to one quick detail <span aria-hidden>→</span></button>
        <p className={styles.help}>One short follow-up is required before you submit. Take as much time as you need.</p>
        {awardsError && <p role="alert" className={styles.error}>{awardsError}</p>}
      </> : <div className={styles.followUp}>
        <p className={styles.answerIndex}>Behind the result</p>
        <WrittenAnswer id="awardsDetail" label={noAwards ? ACTIVITY_DETAIL_QUESTION : AWARD_DETAIL_QUESTION} help="Use a concrete detail, not a polished biography. Tell us what you actually did. Don’t include anyone else’s private information." min={60} max={800} allowPaste={allowPaste} value={detail} onChange={setDetail} inputRef={detailRef} />
      </div>}
    </div>

    <div className={styles.answerCard}>
      <p className={styles.answerIndex}>02 · Things you’ve made</p>
      <WrittenAnswer id="projectSummary" label={WORK_QUESTION} help="Apps, websites, open-source contributions, YouTube videos, articles, published papers—or something else you brought into the world. Tell us what you made, your own contribution and what happened. Include URLs where possible, but links aren’t required. If you haven’t published anything yet, describe a small personal, study or practical project." min={80} max={2400} allowPaste={allowPaste} value={work} onChange={setWork} />
      <div className={`${styles.field} ${styles.summary}`}>
        <label htmlFor="portfolioUrl">Portfolio or project link <span>Optional</span></label>
        <div className={styles.linkInput}><LinkSimpleIcon aria-hidden size={18} /><input id="portfolioUrl" name="portfolioUrl" maxLength={2048} type="url" placeholder="https://" aria-describedby="portfolio-help" /></div>
        <p className={styles.help} id="portfolio-help">You can leave this blank. Pasting a link here is always allowed. No CV needed.</p>
      </div>
    </div>

    <div className={styles.answerCard}>
      <p className={styles.answerIndex}>03 · When things went wrong</p>
      <WrittenAnswer id="biggestFailure" label={FAILURE_QUESTION} help="Choose an example you’re comfortable sharing: what you were trying to do, where your approach went wrong, and what you changed afterwards. A small but meaningful setback is fine. We’re not asking for personal trauma, health details or confidential information." min={80} max={1400} allowPaste={allowPaste} value={failure} onChange={setFailure} />
    </div>
    <div className={styles.answerCard}>
      <p className={styles.answerIndex}>04 · A little self-awareness</p>
      <WrittenAnswer id="growthArea" label={GROWTH_QUESTION} help="Give a recent, practical example and one step you’re taking to improve. Don’t name your friend or share private or health information. We’re interested in self-awareness, not a flawless answer." min={60} max={1000} allowPaste={allowPaste} value={growth} onChange={setGrowth} />
    </div>
    <p className={styles.help}>All four questions and the short follow-up are required. Please share no identity documents, confidential defence material or unnecessary information about others. Need another way to apply? <a href="mailto:info@gihealthcare.co.uk">Contact us</a>.</p>
    <label className={styles.consent}><input name="authorshipAcknowledged" type="checkbox" value="yes" required /><span>{AUTHORSHIP_STATEMENT}</span></label>
  </fieldset>
}
