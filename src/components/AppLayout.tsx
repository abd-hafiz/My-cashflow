'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { icon: '▦', label: 'Accueil', path: '/dashboard' },
  { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
  { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
  { icon: '◈', label: 'Patrimoine', path: '/dashboard/patrimoine' },
  { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
  { icon: '⊞', label: 'Budget', path: '/dashboard/budget' },
  { icon: '📖', label: 'Éducation', path: '/dashboard/education' },
  { icon: '👤', label: 'Profil', path: '/dashboard/profil' },
]

const BOTTOM_NAV = [
  { icon: '▦', label: 'Accueil', path: '/dashboard' },
  { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
  { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
  { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
  { icon: '👤', label: 'Profil', path: '/dashboard/profil' },
]

interface Props {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  showHeader?: boolean
}

export default function AppLayout({ children, title, subtitle, actions, showHeader = true }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [showDrawer, setShowDrawer] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (data?.full_name) {
        setUserName(data.full_name)
        setUserInitial(data.full_name[0].toUpperCase())
      }
    }
    loadUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', fontFamily: "'Sora',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        .app-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 220px; background: #0D1923;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          padding: 20px 12px; z-index: 50;
        }
        .app-main { margin-left: 220px; min-height: 100vh; padding: 28px; }
        .app-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .mobile-topbar { display: none; }
        .bottom-nav { display: none; }
        .mobile-page-header { display: none; }
        .drawer-overlay { display: none; }
        .drawer { display: none; }

        @media (max-width: 767px) {
          .app-sidebar { display: none !important; }
          .app-main { margin-left: 0; padding: 16px 16px 90px; }
          .app-topbar { display: none; }
          .mobile-page-header { display: block; margin-bottom: 16px; padding-top: 4px; }
          .mobile-topbar {
            display: flex; position: sticky; top: 0; z-index: 50;
            background: #0D1923; border-bottom: 1px solid rgba(255,255,255,0.07);
            padding: 13px 16px; justify-content: space-between; align-items: center;
          }
          .bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: #0D1923; border-top: 1px solid rgba(255,255,255,0.07);
            z-index: 50; padding: 8px 0 env(safe-area-inset-bottom, 8px);
          }
          .nav-item-mobile {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; gap: 3px; padding: 6px 4px;
            background: none; border: none; cursor: pointer;
            font-family: 'Sora',sans-serif; color: #64748B;
            font-size: 10px; text-decoration: none; transition: color .15s;
          }
          .nav-item-mobile.active { color: #00D4AA; }
          .drawer-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; }
          .drawer {
            display: flex; flex-direction: column;
            position: fixed; top: 0; right: 0; bottom: 0;
            width: 280px; background: #0D1923;
            border-left: 1px solid rgba(255,255,255,0.07);
            z-index: 101; padding: 24px 16px;
            animation: slideIn .2s ease;
          }
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13px; color: #64748B;
          text-decoration: none; margin-bottom: 2px;
          transition: all .15s; font-weight: 400;
        }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
        .nav-item.active { background: rgba(0,212,170,0.1); color: #00D4AA; font-weight: 600; }

        .btn-teal { background: linear-gradient(135deg,#00D4AA,#00B4D8); border: none; border-radius: 8px; padding: 9px 16px; color: #000; font-size: 13px; font-weight: 700; font-family: 'Sora',sans-serif; cursor: pointer; }
        .btn-teal:hover { opacity: 0.88; }
        .btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 16px; color: #fff; font-size: 13px; font-weight: 600; font-family: 'Sora',sans-serif; cursor: pointer; }
        .input-field:focus { outline: none; border-color: #00D4AA !important; box-shadow: 0 0 0 3px rgba(0,212,170,0.12); }
        select option { background: #0D1923; }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="app-sidebar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 4px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'12px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#000' }}>M</div>
          <span style={{ fontSize:'14px', fontWeight:'700', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MyCashflow</span>
        </div>
        {NAV_ITEMS.map(item => (
          <a key={item.path} href={item.path} className={`nav-item${pathname===item.path?' active':''}`}>
            <span style={{ fontSize:'16px', width:'20px', textAlign:'center' }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 4px 12px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#000', flexShrink:0 }}>{userInitial}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName}</div>
              <div style={{ fontSize:'11px', color:'#64748B' }}>Niger · XOF</div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ width:'100%', background:'none', border:'none', color:'#EF4444', cursor:'pointer', textAlign:'left' }}>
            <span style={{ fontSize:'16px', width:'20px', textAlign:'center' }}>⏻</span>Déconnexion
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="mobile-topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'30px', height:'30px', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#000' }}>M</div>
          <span style={{ fontSize:'14px', fontWeight:'700', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MyCashflow</span>
        </div>
        <button onClick={() => setShowDrawer(true)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'16px', color:'#fff' }}>☰</button>
      </div>

      {/* MAIN */}
      <main className="app-main">
        {/* Header desktop — masqué si showHeader=false */}
        {showHeader && title && (
          <div className="app-topbar">
            <div>
              <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>{title}</h1>
              {subtitle && <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>{actions}</div>}
          </div>
        )}

        {/* Header mobile — masqué si showHeader=false */}
        {showHeader && title && (
          <div className="mobile-page-header">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <h1 style={{ fontSize:'18px', fontWeight:'700', color:'#fff' }}>{title}</h1>
                {subtitle && <p style={{ fontSize:'12px', color:'#64748B', marginTop:'2px' }}>{subtitle}</p>}
              </div>
              {actions && <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>{actions}</div>}
            </div>
          </div>
        )}

        {children}
      </main>

      {/* BOTTOM NAV MOBILE */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => (
          <a key={item.path} href={item.path} className={`nav-item-mobile${pathname===item.path?' active':''}`}>
            <span style={{ fontSize:'20px', lineHeight:1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* DRAWER MOBILE */}
      {showDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setShowDrawer(false)} />
          <div className="drawer">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <span style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Menu</span>
              <button onClick={() => setShowDrawer(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'24px', cursor:'pointer' }}>×</button>
            </div>
            {NAV_ITEMS.map(item => (
              <a key={item.path} href={item.path} onClick={() => setShowDrawer(false)}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 12px', borderRadius:'10px', fontSize:'15px', color:pathname===item.path?'#00D4AA':'#fff', background:pathname===item.path?'rgba(0,212,170,0.1)':'transparent', textDecoration:'none', marginBottom:'4px' }}>
                <span style={{ fontSize:'20px', width:'24px', textAlign:'center' }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
            <div style={{ marginTop:'auto', paddingTop:'20px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', padding:'0 12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#000' }}>{userInitial}</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:'600', color:'#fff' }}>{userName}</div>
                  <div style={{ fontSize:'12px', color:'#64748B' }}>Niger · XOF</div>
                </div>
              </div>
              <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'13px 12px', width:'100%', background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'15px', fontFamily:"'Sora',sans-serif" }}>
                <span>⏻</span>Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}