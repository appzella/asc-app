'use client'

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import GPX from 'leaflet-gpx'

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
// - ch.swisstopo.pixelkarte-farbe (Standard Karte)
// - ch.swisstopo.swissimage (Satellitenbilder)
// - ch.swisstopo.landeskarte (Topografische Karte)
const SWISSTOPO_LAYERS = {
  pixelkarte: {
    layer: 'ch.swisstopo.pixelkarte-farbe',
    format: 'jpeg',
    attribution: '© <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>',
  },
  swissimage: {
    layer: 'ch.swisstopo.swissimage',
    format: 'jpeg',
    attribution: '© <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>',
  },
  landeskarte: {
    layer: 'ch.swisstopo.landeskarte',
    format: 'png',
    attribution: '© <a href="https://www.swisstopo.admin.ch/" target="_blank">swisstopo</a>',
  },
}

function GPXLayer({ gpxUrl }: { gpxUrl: string }) {
  const map = useMap()
  const gpxLayerRef = useRef<GPX | null>(null)

  useEffect(() => {
    if (!gpxUrl || !map) return

    // Entferne vorherige GPX-Layer
    if (gpxLayerRef.current) {
      map.removeLayer(gpxLayerRef.current)
      gpxLayerRef.current = null
    }

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
      map.fitBounds(e.target.getBounds(), { padding: [20, 20] })
    })

    gpxLayer.addTo(map)
    gpxLayerRef.current = gpxLayer

    return () => {
      if (gpxLayerRef.current) {
        map.removeLayer(gpxLayerRef.current)
        gpxLayerRef.current = null
      }
    }
  }, [gpxUrl, map])

  return null
}

export default function TourMap({ gpxUrl, height = '400px' }: TourMapProps) {
  const [selectedLayer, setSelectedLayer] = useState<'pixelkarte' | 'swissimage' | 'landeskarte'>('pixelkarte')

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
          onClick={() => setSelectedLayer('pixelkarte')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedLayer === 'pixelkarte'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Karte
        </button>
        <button
          onClick={() => setSelectedLayer('swissimage')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedLayer === 'swissimage'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Satellit
        </button>
        <button
          onClick={() => setSelectedLayer('landeskarte')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedLayer === 'landeskarte'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Topo
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

