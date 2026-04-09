import React from 'react'

interface BrandLogoProps {
  className?: string
  style?: React.CSSProperties
}

export default function BrandLogo({ className, style }: BrandLogoProps) {
  return (
    <span className={className} style={style}>
      <span style={{ color: 'var(--teal)' }}>Vid</span>
      <span style={{ color: '#ffffff' }}> Converts</span>
      <span style={{
        fontSize: '0.5em',
        color: '#ffffff',
        verticalAlign: 'super',
        lineHeight: 0,
        marginLeft: '2px',
        fontWeight: 400,
      }}>™</span>
    </span>
  )
}
