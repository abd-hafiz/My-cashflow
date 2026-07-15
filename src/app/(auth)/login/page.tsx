'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C10',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Sora', sans-serif",
      padding: '24px',
    }}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0D1923 inset !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .input-field:focus { outline: none; border-color: #00D4AA; box-shadow: 0 0 0 3px rgba(0,212,170,0.12); }
        .link-teal:hover { color: #00B4D8; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px', fontWeight: '800', color: '#000',
          }}>M</div>
          <h1 style={{
            fontSize: '22px', fontWeight: '800',
            background: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
          }}>MyCashflow</h1>
          <p style={{ color: '#64748B', fontSize: '13px' }}>De la discipline financière à la liberté</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#0D1923',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
            Connexion
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '28px' }}>
            Accédez à votre espace financier
          </p>

          {/* Erreur */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#EF4444',
              fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94A3B8', marginBottom: '8px' }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="input-field"
                style={{
                  width: '100%',
                  background: '#080C10',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: "'Sora', sans-serif",
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#94A3B8' }}>
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="link-teal" style={{
                  fontSize: '12px', color: '#00D4AA', textDecoration: 'none', transition: 'color 0.2s',
                }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  style={{
                    width: '100%',
                    background: '#080C10',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '12px 44px 12px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: "'Sora', sans-serif",
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748B', fontSize: '16px', padding: '0',
                  }}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                background: loading ? '#334155' : 'linear-gradient(135deg, #00D4AA, #00B4D8)',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                color: loading ? '#64748B' : '#000',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: "'Sora', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid #64748B',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}/>
                  Connexion en cours...
                </>
              ) : 'Se connecter'}
            </button>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>
        </div>

        {/* Lien inscription */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: '#00D4AA', textDecoration: 'none', fontWeight: '600' }}>
            Créer un compte
          </Link>
        </p>

      </div>
    </div>
  )
}
