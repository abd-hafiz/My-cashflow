'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    icon: '💰',
    gradient: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
    accent: '#00D4AA',
    title: 'Gérez vos finances',
    subtitle: 'Suivez revenus, dépenses et patrimoine en temps réel — tout en un seul endroit',
  },
  {
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    accent: '#6366F1',
    title: 'Atteignez vos objectifs',
    subtitle: 'Fonds d\'urgence, terrain, véhicule — définissez vos projets et suivez votre progression',
  },
  {
    icon: '📊',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    accent: '#F59E0B',
    title: 'Budget intelligent',
    subtitle: 'Plafonds par catégorie, alertes de dépassement — gardez le contrôle de vos dépenses',
  },
  {
    icon: '📱',
    gradient: 'linear-gradient(135deg, #F97316, #EF4444)',
    accent: '#F97316',
    title: 'Mobile Money intégré',
    subtitle: 'Airtel Money, Moov Money — bientôt tous vos comptes au même endroit',
  },
  {
    icon: '🌍',
    gradient: 'linear-gradient(135deg, #EC4899, #00B4D8)',
    accent: '#EC4899',
    title: '6 devises africaines',
    subtitle: 'XOF, XAF, NGN, GHS, KES et plus — gérez vos finances dans votre devise locale',
  },
  {
    icon: '📈',
    gradient: 'linear-gradient(135deg, #10B981, #00D4AA)',
    accent: '#10B981',
    title: 'Investis à la BRVM',
    subtitle: 'Bourse Régionale des Valeurs Mobilières — bientôt disponible dans MyCashflow',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  // Vérifier si onboarding déjà vu
  useEffect(() => {
    const seen = localStorage.getItem('mcf_onboarding_seen')
    if (seen) router.replace('/login')
  }, [])

  function next() {
    if (animating) return
    if (current < SLIDES.length - 1) {
      setAnimating(true)
      setTimeout(() => {
        setCurrent(c => c + 1)
        setAnimating(false)
      }, 200)
    } else {
      finish()
    }
  }

  function prev() {
    if (animating || current === 0) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(c => c - 1)
      setAnimating(false)
    }, 200)
  }

  function finish() {
    localStorage.setItem('mcf_onboarding_seen', 'true')
    router.push('/register')
  }

  function skip() {
    localStorage.setItem('mcf_onboarding_seen', 'true')
    router.push('/login')
  }

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C10',
      fontFamily: "'Sora', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .slide-content {
          opacity: 1;
          transform: translateX(0);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .slide-content.animating {
          opacity: 0;
          transform: translateX(-20px);
        }

        .btn-main {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .btn-main:active { transform: scale(0.98); opacity: 0.9; }

        .dot {
          height: 4px;
          border-radius: 99px;
          transition: all 0.3s ease;
        }

        .btn-skip {
          background: none;
          border: none;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          color: #64748B;
          cursor: pointer;
          padding: 8px 16px;
          transition: color 0.2s;
        }
        .btn-skip:hover { color: #94A3B8; }

        @media (min-width: 768px) {
          .onboarding-card {
            max-width: 400px;
            margin: auto;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 24px;
            overflow: hidden;
          }
        }
      `}</style>

      <div className="onboarding-card" style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>

        {/* HEADER — Logo + Skip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '800', color: '#000',
            }}>M</div>
            <span style={{
              fontSize: '14px', fontWeight: '700',
              background: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>MyCashflow</span>
          </div>
          <button className="btn-skip" onClick={skip}>Passer</button>
        </div>

        {/* PROGRESS DOTS */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '20px 24px 0',
          justifyContent: 'center',
        }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="dot"
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '28px' : '8px',
                height: '4px',
                background: i === current ? slide.accent : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* SLIDE CONTENT */}
        <div
          className={`slide-content${animating ? ' animating' : ''}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
            textAlign: 'center',
          }}
        >
          {/* Icône */}
          <div style={{
            width: '100px', height: '100px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px',
            marginBottom: '40px',
            border: `1px solid rgba(255,255,255,0.08)`,
            boxShadow: `0 0 40px ${slide.accent}22`,
          }}>
            {slide.icon}
          </div>

          {/* Titre */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '16px',
          }}>
            {slide.title}
          </h1>

          {/* Sous-titre */}
          <p style={{
            fontSize: '16px',
            color: '#64748B',
            lineHeight: '1.7',
            maxWidth: '320px',
          }}>
            {slide.subtitle}
          </p>
        </div>

        {/* ACTIONS */}
        <div style={{ padding: '0 24px 48px' }}>

          {/* Navigation fleches */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
          }}>
            {current > 0 && (
              <button
                onClick={prev}
                style={{
                  width: '52px', height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                ←
              </button>
            )}

            <button
              className="btn-main"
              onClick={next}
              style={{
                background: slide.gradient,
                color: isLast ? '#000' : '#000',
                flex: 1,
              }}
            >
              {isLast ? 'Commencer →' : 'Continuer →'}
            </button>
          </div>

          {/* Lien connexion */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
            Déjà un compte ?{' '}
            <span
              onClick={skip}
              style={{ color: '#00D4AA', fontWeight: '600', cursor: 'pointer' }}
            >
              Se connecter
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}