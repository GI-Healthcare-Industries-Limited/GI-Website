import Image from 'next/image'
import Link from 'next/link'

export function SiteHeader({ backLabel = 'Back to website' }: { backLabel?: string }) {
  return (
    <header className="site-header">
      <Link className="brand-link" href="/">
        <Image
          alt="GI Healthcare"
          className="brand-mark"
          height={42}
          priority
          src="/assets/assets/images/butterfly.webp"
          width={42}
        />
        <span>GI Healthcare</span>
      </Link>
      <Link className="back-link" href="/">{backLabel}</Link>
    </header>
  )
}
