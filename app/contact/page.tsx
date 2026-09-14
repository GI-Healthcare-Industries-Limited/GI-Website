import type { Metadata } from 'next'
import { ContactForm } from './contact-form'

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with GI Healthcare.' }

export default function ContactPage() { return <ContactForm /> }
