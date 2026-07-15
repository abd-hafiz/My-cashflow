'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        country: 'NE',
        currency: 'XOF',
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: '#080C10',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: "'Sora', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: '8px',
  } as React.CSSProperties

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #080C10 inset !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .input-field:focus { outline: none; border-color: #00D4AA !important; box-shadow: 0 0 0 3px rgba(0,212,170,0.12); }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
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

          {success ? (
            /* Message succès */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '60px', height: '60px',
                background: 'rgba(16,185,129,0.12)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '28px',
              }}>✓</div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>
                Compte créé !
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
                Un email de confirmation a été envoyé à <span style={{ color: '#00D4AA' }}>{email}</span>.<br />
                Vérifiez votre boîte mail pour activer votre compte.
              </p>
              <Link href="/login" style={{
                display: 'block',
                background: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
                borderRadius: '10px',
                padding: '13px',
                color: '#000',
                fontSize: '14px',
                fontWeight: '700',
                textDecoration: 'none',
                textAlign: 'center',
              }}>
                Aller à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                Créer un compte
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
                Commencez à gérer vos finances gratuitement
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: '#EF4444',
                  fontSize: '13px',
                }}>
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleRegister}>
                {/* Nom complet */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Nom complet</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Mahamadou Achiraf"
                    required
                    className="input-field"
                    style={inputStyle}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    className="input-field"
                    style={inputStyle}
                  />
                </div>

                {/* Mot de passe */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="8 caractères minimum"
                      required
                      className="input-field"
                      style={{ ...inputStyle, paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '14px', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: '#64748B', fontSize: '16px',
                      }}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                  {/* Barre de force */}
                  {password.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '99px',
                          background: password.length >= i * 2
                            ? i <= 1 ? '#EF4444' : i <= 2 ? '#F59E0B' : i <= 3 ? '#00D4AA' : '#10B981'
                            : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.2s',
                        }}/>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field"
                    style={{
                      ...inputStyle,
                      borderColor: confirm && confirm !== password
                        ? 'rgba(239,68,68,0.5)'
                        : confirm && confirm === password
                        ? 'rgba(16,185,129,0.5)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                  />
                  {confirm && confirm === password && (
                    <p style={{ fontSize: '12px', color: '#10B981', marginTop: '6px' }}>✓ Les mots de passe correspondent</p>
                  )}
                </div>

                {/* Bouton */}
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
                      Création en cours...
                    </>
                  ) : 'Créer mon compte'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Lien connexion */}
        {!success && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#00D4AA', textDecoration: 'none', fontWeight: '600' }}>
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}