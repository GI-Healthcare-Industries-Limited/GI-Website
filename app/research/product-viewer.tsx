'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowCounterClockwiseIcon, ArrowLeftIcon, ArrowRightIcon, HandSwipeLeftIcon } from '@phosphor-icons/react'
import poster from '@/assets/research/machine-poster.webp'
import styles from './research.module.css'

export function ProductViewer() {
  const mount = useRef<HTMLDivElement>(null)
  const controls = useRef<{ rotate: (delta: number) => void; reset: () => void } | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const container = mount.current
    if (!container) return
    let disposed = false
    let cleanup: (() => void) | undefined
    // Load this route's WebGL code separately; the static poster is immediately usable.
    import('./render-product').then(async ({ renderProduct }) => {
      if (disposed) return
      const instance = await renderProduct(container, () => { if (!disposed) setReady(true) }, () => { if (!disposed) setFailed(true) })
      if (disposed) instance.dispose()
      else { controls.current = instance; cleanup = instance.dispose }
    }).catch(() => { if (!disposed) setFailed(true) })
    return () => { disposed = true; controls.current = null; cleanup?.() }
  }, [])
  return <figure className={styles.productViewer}>
    <div className={styles.productStage}>
      <Image src={poster} alt="Visual recreation of the GI autonomous cooking machine, with stainless-steel cabinet, black front and touchscreen" fill preload sizes="(max-width: 760px) 100vw, 52vw" className={`${styles.productPoster} ${ready && !failed ? styles.posterHidden : ''}`} />
      <div ref={mount} className={styles.webgl} hidden={failed} tabIndex={ready && !failed ? 0 : -1} role="group" aria-label="Interactive 360 degree product view. Use left and right arrow keys to rotate; Home to reset." onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); controls.current?.rotate(event.key === 'ArrowLeft' ? -.22 : .22) }
        if (event.key === 'Home') { event.preventDefault(); controls.current?.reset() }
      }} />
    </div>
    <div className={styles.viewerControls}>
      <span><HandSwipeLeftIcon size={19} aria-hidden />{failed ? 'Product visual' : ready ? 'Drag to explore' : 'Loading interactive view…'}</span>
      {ready && !failed && <div><button type="button" aria-label="Rotate machine left" onClick={() => controls.current?.rotate(-.3)}><ArrowLeftIcon size={18} /></button><button type="button" aria-label="Rotate machine right" onClick={() => controls.current?.rotate(.3)}><ArrowRightIcon size={18} /></button><button type="button" aria-label="Reset machine view" onClick={() => controls.current?.reset()}><ArrowCounterClockwiseIcon size={18} /></button></div>}
    </div>
    <figcaption className={styles.finePrint}>Visual recreation · Not a technical model</figcaption>
  </figure>
}
