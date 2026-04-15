'use client'

import { useState, useEffect } from 'react'

export default function FloatingFounderVideo() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isHoveringPill, setIsHoveringPill] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  const VIDEO_ID = 'CuIW-DHR2Rs'

  // Minimized — small persistent rewatch tab on right edge
  if (isMinimized) {
    return (
      <button
        onClick={() => { setIsMinimized(false); setIsExpanded(true) }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '0px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0d1f1a 0%, #0a1a16 100%)',
          border: '1px solid rgba(0,255,178,0.3)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '-4px 4px 16px rgba(0,0,0,0.4)',
        }}
        title="Rewatch — Why I Built Vid Converts"
      >
        <span style={{ fontSize: '14px', color: '#00FFB2' }}>▶</span>
        <span style={{
          color: '#00FFB2',
          fontFamily: "'Encode Sans Expanded', sans-serif",
          fontSize: '9px',
          fontWeight: 900,
          letterSpacing: '0.06em',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
        }}>
          REWATCH
        </span>
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        fontFamily: "'Mulish', sans-serif",
        transform: hasLoaded ? 'translateY(0)' : 'translateY(96px)',
        opacity: hasLoaded ? 1 : 0,
        transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
      }}
    >
      {/* Collapsed pill */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          onMouseEnter={() => setIsHoveringPill(true)}
          onMouseLeave={() => setIsHoveringPill(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '999px',
            paddingLeft: '8px',
            paddingRight: '20px',
            paddingTop: '8px',
            paddingBottom: '8px',
            cursor: 'pointer',
            border: isHoveringPill ? '1px solid rgba(0,255,178,0.4)' : '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(135deg, #0d1f1a 0%, #0a1a16 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,178,0.08)',
            transition: 'border 0.3s ease',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0, width: '44px', height: '44px' }}>
            <div style={{
              position: 'absolute', inset: '-4px', borderRadius: '50%',
              background: '#00FFB2', opacity: 0.2,
              animation: 'vcPing1 2s ease-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '-2px', borderRadius: '50%',
              background: '#00FFB2', opacity: 0.15,
              animation: 'vcPing2 3s ease-out infinite', animationDelay: '0.5s',
            }} />
            {logoError ? (
              <div style={{
                position: 'relative', width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #00FFB2 0%, #00cc8f 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>▶</div>
            ) : (
              <img
                src="/VC_logo.png"
                alt="Vid Converts"
                onError={() => setLogoError(true)}
                style={{
                  position: 'relative', width: '44px', height: '44px',
                  borderRadius: '50%', objectFit: 'cover', display: 'block',
                }}
              />
            )}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{
              margin: 0, color: '#00FFB2',
              fontFamily: "'Encode Sans Expanded', sans-serif",
              fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1.2,
            }}>WHY I BUILT VID CONVERTS</p>
            <p style={{
              margin: 0, color: 'rgba(255,255,255,0.6)',
              fontSize: '11px', fontWeight: 700, marginTop: '3px', lineHeight: 1.2,
            }}>Watch — short video →</p>
          </div>
        </button>
      )}

      {/* Expanded card */}
      {isExpanded && (
        <div style={{
          width: '300px', borderRadius: '16px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(145deg, #0d1f1a 0%, #091510 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,178,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <p style={{
                margin: 0, color: '#00FFB2',
                fontFamily: "'Encode Sans Expanded', sans-serif",
                fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em',
              }}>WHY I BUILT VID CONVERTS</p>
              <p style={{
                margin: 0, color: 'rgba(255,255,255,0.4)',
                fontSize: '11px', fontWeight: 700, marginTop: '3px',
              }}>for you — from Jason</p>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {/* ↓ collapse to pill */}
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse"
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
              >↓</button>
              {/* ✕ minimize to edge tab */}
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize"
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
              >✕</button>
            </div>
          </div>

          {/* Video */}
          <div style={{ position: 'relative', width: '100%', paddingBottom: '177.78%' }}>
            <iframe
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`}
              title="Why I Built Vid Converts"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px' }}>
            <p style={{
              margin: 0, color: 'rgba(255,255,255,0.35)',
              fontSize: '11px', fontWeight: 700, lineHeight: 1.4,
            }}>Ready to see what&apos;s killing your conversions?</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes vcPing1 {
          0% { transform: scale(1); opacity: 0.2; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes vcPing2 {
          0% { transform: scale(1); opacity: 0.15; }
          70% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
