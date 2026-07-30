'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const seen = localStorage.getItem('mcf_onboarding_seen')
    if (seen) {
      router.replace('/login')
    } else {
      router.replace('/onboarding')
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C10',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid rgba(0,212,170,0.2)',
        borderTopColor: '#00D4AA',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}