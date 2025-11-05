'use client'

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

// Fix für Leaflet-Icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface TourMapProps {
  gpxUrl: string
  height?: string
}

// Swisstopo WMTS Layer für die Karte
// Dokumentation: https://api.geo.admin.ch/
// WMTS URL Format: https://wmts.geo.admin.ch/1.0.0/{layer}/default/{time}/3857/{z}/{x}/{y}.{format}
const SWISSTOPO_WMTS_BASE = 'https://wmts.geo.admin.ch/1.0.0/{layer}/default/current/3857/{z}/{x}/{y}.{format}'

// Verschiedene Swisstopo Layer:
// - ch.swisstopo.pixelkarte-grau (Schwarz-Weiß Karte)
// - ch.swisstopo.pixelkarte-farbe (Farbige Karte)
// - ch.swisstopo.swissimage (Satellitenbilder)
const SWISSTOPO_LAYERS = {
  'karte-sw': {
    layer: 'ch.swisstopo.pixelkarte-grau',
    format: 'jpeg',
    attribution: '© <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>',
  },
  'karte-farbig': {
    layer: 'ch.swisstopo.pixelkarte-farbe',
    format: 'jpeg',
    attribution: '© <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>',
  },
  'satellit': {
    layer: 'ch.swisstopo.swissimage',
    format: 'jpeg',
    attribution: '© <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>',
  },
}

function GPXLayer({ gpxUrl }: { gpxUrl: string }) {
  const map = useMap()
  const gpxLayerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gpxUrl || !map || typeof window === 'undefined') return

    // Dynamischer Import von leaflet-gpx (client-side only)
    const loadGPX = async () => {
      try {
        // Importiere leaflet-gpx - es fügt L.GPX hinzu
        await import('leaflet-gpx')
        
        // Warte kurz, damit L.GPX verfügbar ist
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Greife auf L.GPX zu
        const GPX = (L as any).GPX
        if (!GPX || typeof GPX !== 'function') {
          throw new Error('GPX constructor not found on L object')
        }

        // Entferne vorherige GPX-Layer
        if (gpxLayerRef.current) {
          map.removeLayer(gpxLayerRef.current as unknown as L.Layer)
          gpxLayerRef.current = null
        }

        setError(null)

        // Lade GPX-Datei
        const gpxLayer = new GPX(gpxUrl, {
          async: true,
          marker_options: {
            startIconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            endIconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          },
          polyline_options: {
            color: '#ff0000',
            weight: 4,
            opacity: 0.8,
          },
        })

        gpxLayer.on('loaded', function (e: any) {
          try {
            map.fitBounds(e.target.getBounds(), { padding: [20, 20] })
          } catch (err) {
            console.error('Error fitting bounds:', err)
            setError('Fehler beim Anpassen der Kartenansicht')
          }
        })

        gpxLayer.on('error', function (e: any) {
          console.error('GPX loading error:', e)
          setError('Fehler beim Laden der GPX-Datei')
        })

        gpxLayer.addTo(map)
        gpxLayerRef.current = gpxLayer
      } catch (err) {
        console.error('Error loading GPX library:', err)
        setError('Fehler beim Laden der GPX-Bibliothek')
      }
    }

    loadGPX()

    return () => {
      if (gpxLayerRef.current) {
        map.removeLayer(gpxLayerRef.current as unknown as L.Layer)
        gpxLayerRef.current = null
      }
    }
  }, [gpxUrl, map])

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1000]">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return null
}

export default function TourMap({ gpxUrl, height = '400px' }: TourMapProps) {
  const [selectedLayer, setSelectedLayer] = useState<'karte-sw' | 'karte-farbig' | 'satellit'>('karte-sw')

  // Standard-Zentrum: Schweiz (Bern)
  const center: [number, number] = [46.9481, 7.4474]
  const zoom = 10

  if (!gpxUrl) {
    return (
      <div className="flex items-center justify-center border rounded-md bg-muted/50" style={{ height }}>
        <p className="text-muted-foreground">Keine GPX-Datei verfügbar</p>
      </div>
    )
  }

  const layerConfig = SWISSTOPO_LAYERS[selectedLayer]
  const tileUrl = SWISSTOPO_WMTS_BASE
    .replace('{layer}', layerConfig.layer)
    .replace('{format}', layerConfig.format)

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Layer-Auswahl */}
      <div className="absolute top-2 right-2 z-[1000] flex gap-1 bg-background/95 backdrop-blur-sm border rounded-md p-1 shadow-sm">
        <button
          onClick={() => setSelectedLayer('karte-sw')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedLayer === 'karte-sw'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Karte SW
        </button>
        <button
          onClick={() => setSelectedLayer('karte-farbig')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedLayer === 'karte-farbig'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Karte farbig
        </button>
        <button
          onClick={() => setSelectedLayer('satellit')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedLayer === 'satellit'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Satellit
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        className="rounded-md border"
      >
        <TileLayer
          url={tileUrl}
          attribution={layerConfig.attribution}
          maxZoom={19}
          minZoom={7}
          tileSize={256}
          zoomOffset={0}
        />
        <GPXLayer gpxUrl={gpxUrl} />
      </MapContainer>
    </div>
  )
}

