'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ASCLogoProps {
  className?: string
  size?: number
}

export function ASCLogo({ className, size = 32 }: ASCLogoProps) {
  return (
    <svg
      id="asc-logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 239 263.6"
      className={cn('w-auto', className)}
      style={{ height: `${size}px` }}
      aria-label="ASC Logo"
    >
      <defs>
        <style>
          {`
            .asc-logo-stroke {
              fill: none;
              stroke: hsl(var(--primary));
              stroke-miterlimit: 10;
              stroke-width: 20px;
            }
            .asc-logo-fill {
              fill: hsl(var(--primary));
            }
          `}
        </style>
      </defs>
      <g id="Ebene_1-2" data-name="Ebene 1">
        <g>
          <g>
            <polygon className="asc-logo-fill" points="209.5 206.28 209.5 206.31 209.56 206.28 209.5 206.28"/>
            <polygon className="asc-logo-fill" points="30.5 206.52 30.5 206.28 30.08 206.28 30.5 206.52"/>
            <path className="asc-logo-fill" d="M214.32,59.77L134.82,13.87c-9.28-5.36-20.72-5.36-30,0L25.32,59.77c-9.28,5.36-15,15.26-15,25.98v91.8c0,8.79,3.85,17.03,10.36,22.67l61.15-105.91,8.9,15.41-20.64,49.37,50.02-86.65,21.43,37.13-21.09,50.45,37.94-65.71,60.95,105.57c6.27-5.63,9.97-13.71,9.97-22.33v-91.8c0-10.72-5.72-20.62-15-25.98Z"/>
          </g>
          <path className="asc-logo-stroke" d="M10,85.9v91.8c0,10.72,5.72,20.62,15,25.98l79.5,45.9c9.28,5.36,20.72,5.36,30,0l79.5-45.9c9.28-5.36,15-15.26,15-25.98v-91.8c0-10.72-5.72-20.62-15-25.98L134.5,14.02c-9.28-5.36-20.72-5.36-30,0L25,59.92c-9.28,5.36-15,15.26-15,25.98Z"/>
        </g>
      </g>
    </svg>
  )
}

