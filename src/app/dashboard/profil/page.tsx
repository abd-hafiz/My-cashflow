'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile { full_name:string; phone:string; country:string; currency:string; avatar_url:string }

const COUNTRIES = [{ code:'NE', label:'Niger 🇳🇪' }, { code:'SN', label:'Sénégal 🇸🇳' }, { code:'CI', label:"Côte d'Ivoire 🇨🇮" }, { code:'BF', label:'Burkina Faso 🇧🇫' }, { code:'ML', label:'Mali 🇲🇱' }, { code:'TG', label:'Togo 🇹🇬' }, { code:'BJ', label:'Bénin 🇧🇯' }, { code:'CM', label:'Cameroun 🇨🇲' }]
const CURRENCIES = [{ code:'XOF', label:'XOF — Franc CFA (UEMOA)' }, { code:'XAF', label:'XAF — Franc CFA (CEMAC)' }, { code:'GNF', label:'GNF — Franc guinéen' }, { code:'EUR', label:'EUR — Euro' }, { code:'USD', label:'USD — Dollar américain' }]

export default function ProfilPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile>({ full_name:'', phone:'', country:'NE', currency:'XOF', avatar_url:'' })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'profil'|'securite'>('profil')
  const [pwd, setPwd] = useState({ current:'', new:'', confirm:'' })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setEmail(user.email || '')
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSuccess(''); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ full_name:profile.full_name, phone:profile.phone, country:profile.country, currency:profile.currency }).eq('id', user!.id)
    setSaving(false)
    if (error) setError('Erreur lors de la sauvegarde.')
    else setSuccess('Profil mis à jour avec succès !')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('')
    if (pwd.new !== pwd.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (pwd.new.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.new })
    setSavingPwd(false)
    if (error) setError(error.message)
    else { setSuccess('Mot de passe modifié avec succès !'); setPwd({ current:'', new:'', confirm:'' }) }
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || '?'

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'24px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'13px', fontFamily:"'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:'600', color:'#94A3B8', marginBottom:'6px' }

  return (
    <div style={{ minHeight:'100vh', background:'#080C10', fontFamily:"'Sora',sans-serif", display:'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:10px 20px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-teal:hover{opacity:0.88}
        .btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 20px;color:#fff;font-size:13px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        @keyframes spin{to{transform:rotate(360deg)}}
        select option{background:#0D1923}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:'220px', flexShrink:0, background:'#0D1923', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', padding:'20px 12px', position:'sticky', top:0, height:'100vh' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 4px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'12px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#000' }}>M</div>
          <span style={{ fontSize:'14px', fontWeight:'700', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MyCashflow</span>
        </div>
        {[
          {icon:'▦',label:'Tableau de bord',path:'/dashboard'},
          {icon:'↑',label:'Revenus',path:'/dashboard/revenus'},
          {icon:'↓',label:'Dépenses',path:'/dashboard/depenses'},
          {icon:'◈',label:'Patrimoine',path:'/dashboard/patrimoine'},
          {icon:'◎',label:'Objectifs',path:'/dashboard/objectifs'},
          {icon:'⊞',label:'Budget',path:'/dashboard/budget'},
          {icon:'📖',label:'Éducation',path:'/dashboard/education'},
          {icon:'👤',label:'Profil',path:'/dashboard/profil',active:true},
        ].map(item=>(
          <a key={item.label} href={item.path} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', fontSize:'13px', color:item.active?'#00D4AA':'#64748B', background:item.active?'rgba(0,212,170,0.1)':'transparent', fontWeight:item.active?'600':'400', textDecoration:'none', marginBottom:'2px' }}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', fontSize:'13px', color:'#EF4444', background:'none', border:'none', cursor:'pointer', width:'100%', fontFamily:"'Sora',sans-serif" }}><span>⏻</span>Déconnexion</button>
        </div>
      </aside>

      <main style={{ flex:1, padding:'28px', overflow:'auto', maxWidth:'720px' }}>
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>Mon profil</h1>
          <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>Gérez vos informations personnelles</p>
        </div>

        {/* Avatar + infos */}
        <div style={{ ...card, display:'flex', alignItems:'center', gap:'20px', marginBottom:'20px' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:'800', color:'#000', flexShrink:0 }}>
            {loading ? '?' : initials}
          </div>
          <div>
            <div style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>{profile.full_name || 'Utilisateur'}</div>
            <div style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>{email}</div>
            <div style={{ fontSize:'12px', color:'#00D4AA', marginTop:'4px' }}>
              {COUNTRIES.find(c=>c.code===profile.country)?.label} · {profile.currency}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'20px', width:'fit-content' }}>
          {(['profil','securite'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 20px', borderRadius:'7px', border:'none', fontSize:'13px', fontWeight:'600', cursor:'pointer', background:tab===t?'#0D1923':'transparent', color:tab===t?'#fff':'#64748B', fontFamily:"'Sora',sans-serif" }}>
              {t==='profil'?'Informations':'Sécurité'}
            </button>
          ))}
        </div>

        {/* Messages */}
        {success && <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', color:'#10B981', fontSize:'13px' }}>✓ {success}</div>}
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', color:'#EF4444', fontSize:'13px' }}>⚠ {error}</div>}

        {tab === 'profil' ? (
          <div style={card}>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'20px' }}>Informations personnelles</div>
            <form onSubmit={saveProfile}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <div>
                  <label style={labelSt}>Nom complet</label>
                  <input className="input-field" style={inputSt} value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})} placeholder="Mahamadou Achiraf" required />
                </div>
                <div>
                  <label style={labelSt}>Téléphone</label>
                  <input className="input-field" style={inputSt} value={profile.phone||''} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="+227 90 00 00 00" />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <div>
                  <label style={labelSt}>Pays</label>
                  <select className="input-field" style={inputSt} value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}>
                    {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Devise</label>
                  <select className="input-field" style={inputSt} value={profile.currency} onChange={e=>setProfile({...profile,currency:e.target.value})}>
                    {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={labelSt}>Email</label>
                <input style={{ ...inputSt, opacity:0.5, cursor:'not-allowed' }} value={email} disabled />
                <div style={{ fontSize:'11px', color:'#64748B', marginTop:'4px' }}>L'email ne peut pas être modifié ici</div>
              </div>
              <button type="submit" className="btn-teal" disabled={saving}>{saving?'Enregistrement...':'Sauvegarder les modifications'}</button>
            </form>
          </div>
        ) : (
          <div style={card}>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'20px' }}>Changer le mot de passe</div>
            <form onSubmit={changePassword}>
              <div style={{ marginBottom:'14px' }}>
                <label style={labelSt}>Nouveau mot de passe</label>
                <input className="input-field" style={inputSt} type="password" value={pwd.new} onChange={e=>setPwd({...pwd,new:e.target.value})} placeholder="8 caractères minimum" required />
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={labelSt}>Confirmer le nouveau mot de passe</label>
                <input className="input-field" style={inputSt} type="password" value={pwd.confirm} onChange={e=>setPwd({...pwd,confirm:e.target.value})} placeholder="••••••••" required />
                {pwd.confirm && pwd.new === pwd.confirm && <p style={{ fontSize:'12px', color:'#10B981', marginTop:'6px' }}>✓ Les mots de passe correspondent</p>}
              </div>
              <button type="submit" className="btn-teal" disabled={savingPwd}>{savingPwd?'Modification...':'Modifier le mot de passe'}</button>
            </form>

            <div style={{ marginTop:'32px', paddingTop:'24px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#EF4444', marginBottom:'8px' }}>Zone dangereuse</div>
              <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'16px' }}>Se déconnecter de tous les appareils</p>
              <button onClick={handleLogout} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'10px 20px', color:'#EF4444', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}