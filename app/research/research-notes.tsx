import Image from 'next/image'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr'
import studio from '@/assets/research/research-hero.webp'
import earth from '@/assets/research/earth-field-concept.webp'
import habitat from '@/assets/research/lunar-habitat.webp'
import styles from './research.module.css'

const notes = [
  { title: 'Designing for less', image: studio, alt: 'Cooking machine concept in a sunlit studio', summary: 'How constraints guide the way we think about cooking systems.', paragraphs: ['Our starting point is a set of constraints: the space available, the resources a cooking process consumes and the practicalities of keeping a machine working. Compactness, resource use and longevity are connected design questions, not separate targets.', 'A smaller enclosure alone is not the answer. Transport, installation, access for cleaning and the ability to replace components all shape a useful footprint. Our research considers these together, with freshly cooked meals as the purpose of the system.'] },
  { title: 'Cooking at the edge', image: earth, alt: 'Illustrative remote research camp', summary: 'What challenging environments ask of an autonomous kitchen.', paragraphs: ['A kitchen in a remote setting has a different starting point from one with ready access to supplies and maintenance. Water, electricity, storage and technical support become important parts of the design brief.', 'Our terrestrial focus spans settings such as remote research, disaster response and other demanding environments. These contexts help frame the questions we explore: how to use available resources carefully, how to make maintenance practical and how to keep cooking systems useful over time.'] },
  { title: 'From Earth to future habitats', image: habitat, alt: 'Concept of a cooking and growing space in a lunar habitat', summary: 'Connecting terrestrial engineering with a longer-term space vision.', paragraphs: ['Our space vision is simple: freshly grown ingredients from space farms, prepared as fresh meals inside a station or habitat. It connects the technical challenge of cooking with something familiar — the comfort and enjoyment of a home-style meal.', 'The knowledge gained from terrestrial systems shapes that research direction. Space brings its own constraints and validation requirements; a terrestrial prototype is not automatically space-qualified. The habitat imagery here illustrates that vision, rather than a deployed or certified space system.'] },
]

export function ResearchNotes() {
  return <section className={styles.notes} id="research-notes" aria-labelledby="notes-title"><div className={styles.sectionInner}>
    <p className={styles.eyebrow}>Research notebook</p><div className={styles.notesHeading}><h2 id="notes-title">Ideas for a more<br />sustainable tomorrow.</h2><p>Perspectives on our design approach.<br />Not peer-reviewed papers or test results.</p></div>
    <div className={styles.noteGrid}>{notes.map(note => <article className={styles.note} key={note.title}><div className={styles.noteImage}><Image src={note.image} alt={note.alt} fill sizes="(max-width: 760px) 90vw, 30vw" /></div><span className={styles.miniLabel}>Research perspective</span><h3>{note.title}</h3><p>{note.summary}</p><details><summary>Read perspective <ArrowUpRightIcon size={18} aria-hidden /></summary><div className={styles.noteBody}>{note.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></details></article>)}</div>
  </div></section>
}
