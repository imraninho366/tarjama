import Head from 'next/head'
import Link from 'next/link'
import { G } from '../lib/theme'
import Button from '../components/common/Button'

export default function NotFound() {
  return (
    <>
      <Head><title>Page introuvable — Tarjama</title></Head>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 32
      }}>
        <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 64, color: 'var(--tarjama-color-primary)', marginBottom: 8 }}>٤٠٤</div>
        <h1 style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--tarjama-color-text)', margin: '0 0 8px' }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 14, color: 'var(--tarjama-color-text-secondary)', marginBottom: 24, maxWidth: 320 }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button variant="primary">Retour à l'accueil →</Button>
        </Link>
      </div>
    </>
  )
}
