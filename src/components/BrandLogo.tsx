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
      <sup style={{ fontSize: '0.55em', color: '#ffffff', verticalAlign: 'super', marginLeft: '1px' }}>™</sup>
    </span>
  )
}
