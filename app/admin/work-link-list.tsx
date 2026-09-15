import { ArrowSquareOutIcon, LinkSimpleIcon } from '@phosphor-icons/react'
import { isSafeWorkLink } from '@/lib/application-questions'

export function WorkLinkList({ links }: { links: string[] }) {
  const safeLinks = links.filter(isSafeWorkLink)
  if (!safeLinks.length) return null
  return <ul className="admin-work-links" aria-label="Work examples">
    {safeLinks.map((url, index) => <li key={`${index}:${url}`}>
      <a href={url} target="_blank" rel="noopener noreferrer"><LinkSimpleIcon aria-hidden size={17} />
        <span>{url}</span><ArrowSquareOutIcon aria-hidden size={15} />
      </a>
    </li>)}
  </ul>
}
