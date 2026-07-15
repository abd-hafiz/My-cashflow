'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification { id:string; type:string; title:string; message:string; is_read:boolean; created_at:string }

const TYPE_ICONS: Record<string,string> = { objectif_atteint:'🎯', budget_depasse:'⚠️', rappel_saisie:'📝', conseil_financier:'💡', info_systeme:'ℹ️' }
const TYPE_COLORS: Record<string,string> = { objectif_atteint:'#10B981', budget_depasse:'#EF4444', rappel_saisie:'#F59E0B', conseil_financier:'#00D4AA', info_systeme:'#6366F1' }

export default function Notifications() {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifs()
    // Fermer si clic extérieur
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifs() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending:false }).limit(20)
    setNotifs(data || [])
    setLoading(false)
  }

  async function markRead(id:string) {
    await supabase.from('notifications').update({ is_read:true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id===id ? {...n, is_read:true} : n))
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read:true }).eq('user_id', user.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({...n, is_read:true})))
  }

  async function deleteNotif(id:string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id!==id))
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  const timeAgo = (date:string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff/60000)
    const hours = Math.floor(diff/3600000)
    const days = Math.floor(diff/86400000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `Il y a ${mins} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <style>{`
        .notif-panel{position:absolute;top:calc(100% + 8px);right:0;width:360px;background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.5);z-index:200;animation:fadeIn .15s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .notif-item{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background .1s;display:flex;gap:10px;align-items:flex-start}
        .notif-item:hover{background:rgba(255,255,255,0.03)}
        .notif-item:last-child{border-bottom:none}
      `}</style>

      {/* Bouton cloche */}
      <button onClick={()=>setOpen(!open)} style={{ position:'relative', width:'36px', height:'36px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background .15s' }}>
        <span style={{ fontSize:'16px' }}>🔔</span>
        {unreadCount > 0 && (
          <div style={{ position:'absolute', top:'6px', right:'6px', width:'8px', height:'8px', background:'#00D4AA', borderRadius:'50%', border:'2px solid #080C10' }} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="notif-panel">
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>Notifications</span>
              {unreadCount > 0 && <span style={{ marginLeft:'8px', fontSize:'11px', background:'rgba(0,212,170,0.15)', color:'#00D4AA', padding:'2px 8px', borderRadius:'99px', fontWeight:'600' }}>{unreadCount} nouvelles</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize:'12px', color:'#00D4AA', background:'none', border:'none', cursor:'pointer', fontFamily:"'Sora',sans-serif", fontWeight:'600' }}>Tout lire</button>
            )}
          </div>

          <div style={{ maxHeight:'400px', overflowY:'auto' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'24px', color:'#64748B', fontSize:'13px' }}>Chargement...</div>
            ) : notifs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 16px' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>🔔</div>
                <p style={{ fontSize:'13px', color:'#64748B' }}>Aucune notification</p>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} className="notif-item" style={{ background: n.is_read ? 'transparent' : 'rgba(0,212,170,0.03)' }} onClick={()=>!n.is_read&&markRead(n.id)}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${TYPE_COLORS[n.type]||'#64748B'}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0, marginTop:'1px' }}>
                  {TYPE_ICONS[n.type]||'ℹ️'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'13px', fontWeight: n.is_read?'400':'600', color: n.is_read?'#94A3B8':'#fff', lineHeight:'1.4' }}>{n.title}</span>
                    {!n.is_read && <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#00D4AA', flexShrink:0, marginTop:'4px' }} />}
                  </div>
                  <p style={{ fontSize:'12px', color:'#64748B', marginTop:'3px', lineHeight:'1.5' }}>{n.message}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'6px' }}>
                    <span style={{ fontSize:'11px', color:'#475569' }}>{timeAgo(n.created_at)}</span>
                    <button onClick={e=>{e.stopPropagation();deleteNotif(n.id)}} style={{ fontSize:'11px', color:'#475569', background:'none', border:'none', cursor:'pointer', padding:'0' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}