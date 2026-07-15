'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080C10', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", padding:'24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:'22px', fontWeight:'800', color:'#000' }}>M</div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MyCashflow</h1>
        </div>
        <div style={{ background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'32px' }}>
          {sent ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:'60px', height:'60px', background:'rgba(0,212,170,0.12)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'28px' }}>✉</div>
              <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#fff', marginBottom:'10px' }}>Email envoyé !</h2>
              <p style={{ fontSize:'13px', color:'#64748B', lineHeight:'1.6', marginBottom:'24px' }}>
                Vérifiez votre boîte mail <span style={{ color:'#00D4AA' }}>{email}</span> et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <Link href="/login" style={{ display:'block', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'10px', padding:'13px', color:'#000', fontSize:'14px', fontWeight:'700', textDecoration:'none', textAlign:'center' }}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#fff', marginBottom:'6px' }}>Mot de passe oublié</h2>
              <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'24px' }}>Entrez votre email pour recevoir un lien de réinitialisation</p>
              {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', color:'#EF4444', fontSize:'13px' }}>⚠ {error}</div>}
              <form onSubmit={handleReset}>
                <div style={{ marginBottom:'20px' }}>
                  <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#94A3B8', marginBottom:'8px' }}>Adresse email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" required className="input-field" style={{ width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'12px 16px', color:'#fff', fontSize:'14px', fontFamily:"'Sora',sans-serif" }} />
                </div>
                <button type="submit" disabled={loading} style={{ width:'100%', background:loading?'#334155':'linear-gradient(135deg,#00D4AA,#00B4D8)', border:'none', borderRadius:'10px', padding:'13px', color:loading?'#64748B':'#000', fontSize:'14px', fontWeight:'700', fontFamily:"'Sora',sans-serif", cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {loading ? <><span style={{ width:'16px', height:'16px', border:'2px solid #64748B', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }}/>Envoi...</> : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>
        <p style={{ textAlign:'center', marginTop:'24px', fontSize:'13px', color:'#64748B' }}>
          <Link href="/login" style={{ color:'#00D4AA', textDecoration:'none', fontWeight:'600' }}>← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}