'use client'

import { useState, useEffect } from 'react'

export default function FloatingFounderVideo() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isHoveringPill, setIsHoveringPill] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (isDismissed) return null

  const VIDEO_ID = 'CuIW-DHR2Rs'

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
          {/* Logo with pulse */}
          <div style={{ position: 'relative', flexShrink: 0, width: '44px', height: '44px' }}>
            {/* Pulse ring 1 */}
            <div style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: '#00FFB2',
              opacity: 0.2,
              animation: 'vcPing1 2s ease-out infinite',
            }} />
            {/* Pulse ring 2 */}
            <div style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '50%',
              background: '#00FFB2',
              opacity: 0.15,
              animation: 'vcPing2 3s ease-out infinite',
              animationDelay: '0.5s',
            }} />
            <img
              src="/VC_logo.png"
              alt="Vid Converts"
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ textAlign: 'left' }}>
            <p style={{
              margin: 0,
              color: '#00FFB2',
              fontFamily: "'Encode Sans Expanded', sans-serif",
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              lineHeight: 1.2,
            }}>
              WHY I BUILT VID CONVERTS
            </p>
            <p style={{
              margin: 0,
              color: 'rgba(255,255,255,0.6)',
              fontSize: '11px',
              fontWeight: 700,
              marginTop: '3px',
              lineHeight: 1.2,
            }}>
              Watch — short video →
            </p>
          </div>
        </button>
      )}

      {/* Expanded card */}
      {isExpanded && (
        <div style={{
          width: '300px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(145deg, #0d1f1a 0%, #091510 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,178,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          {/* Card header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <p style={{
                margin: 0,
                color: '#00FFB2',
                fontFamily: "'Encode Sans Expanded', sans-serif",
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.1em',
              }}>
                WHY I BUILT VID CONVERTS
              </p>
              <p style={{
                margin: 0,
                color: 'rgba(255,255,255,0.4)',
                fontSize: '11px',
                fontWeight: 700,
                marginTop: '3px',
              }}>
                for you — from Jason
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'
              }}
              aria-label="Collapse"
            >
              ↓
            </button>
          </div>

          {/* YouTube Short — 9:16 */}
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
          }}>
            <p style={{
              margin: 0,
              color: 'rgba(255,255,255,0.35)',
              fontSize: '11px',
              fontWeight: 700,
              lineHeight: 1.4,
            }}>
              Ready to see what&apos;s killing your conversions?
            </p>
            <button
              onClick={() => setIsDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
                fontSize: '10px',
                marginLeft: '12px',
                flexShrink: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)'}
              aria-label="Dismiss"
            >
              ✕ close
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animations injected as a style tag */}
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
