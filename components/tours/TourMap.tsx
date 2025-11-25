'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, useMap, WMSTileLayer } from 'react-leaflet'
import { Maximize2, Minimize2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'

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
  initialFullscreen?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
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
            setError('Fehler beim Anpassen der Kartenansicht')
          }
        })

        gpxLayer.on('error', function (e: any) {
          setError('Fehler beim Laden der GPX-Datei')
        })

        gpxLayer.addTo(map)
        gpxLayerRef.current = gpxLayer
      } catch (err) {
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

// Hook für CSS-basiertes Fullscreen (innerhalb des Browsers)
function useFullscreenControl(initialFullscreen = false, onFullscreenChange?: (isFullscreen: boolean) => void) {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen)
  const mapRef = useRef<L.Map | null>(null)

  const setMap = useCallback((map: L.Map) => {
    mapRef.current = map
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const newState = !prev
      // Map-Größe aktualisieren, wenn sich Fullscreen-Status ändert
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize()
        }, 100)
      }
      // Callback aufrufen
      if (onFullscreenChange) {
        onFullscreenChange(newState)
      }
      return newState
    })
  }, [onFullscreenChange])

  // ESC-Taste zum Schließen des Vollbilds
  useEffect(() => {
    if (!isFullscreen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false)
        if (mapRef.current) {
          setTimeout(() => {
            mapRef.current?.invalidateSize()
          }, 100)
        }
        // Callback aufrufen
        if (onFullscreenChange) {
          onFullscreenChange(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isFullscreen, onFullscreenChange])

  return { isFullscreen, toggleFullscreen, setMap }
}

function MapInitializer({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap()

  useEffect(() => {
    if (map) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  return null
}

export default function TourMap({ gpxUrl, height = '400px', initialFullscreen = false, onFullscreenChange }: TourMapProps) {
  const [selectedLayer, setSelectedLayer] = useState<'karte-sw' | 'karte-farbig' | 'satellit'>('karte-sw')
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false)
  const [showHangneigung, setShowHangneigung] = useState(true)
  const [showWanderwege, setShowWanderwege] = useState(false)
  const [showJagdbanngebiete, setShowJagdbanngebiete] = useState(false)
  const [showWildruhezonen, setShowWildruhezonen] = useState(false)
  const { isFullscreen, toggleFullscreen, setMap } = useFullscreenControl(initialFullscreen, onFullscreenChange)

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

  // Render-Funktion für die Karte (wird sowohl normal als auch im Fullscreen verwendet)
  const renderMap = (mapHeight: string) => (
    <div
      className="relative w-full"
      style={{ height: mapHeight }}
      data-map-wrapper
    >
      {/* Kartensteuerung - rechtsbündig ausgerichtet */}
      <div
        className="absolute top-2 right-2 flex flex-col gap-2 items-end"
        style={{
          zIndex: 40
        }}
      >
        {/* Karten-Layer Auswahl */}
        <div className="flex gap-1 bg-background/95 backdrop-blur-sm border rounded-md p-1 shadow-sm">
          <Button
            variant={selectedLayer === 'karte-sw' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLayer('karte-sw')}
            className="text-xs"
          >
            SW
          </Button>
          <Button
            variant={selectedLayer === 'karte-farbig' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLayer('karte-farbig')}
            className="text-xs"
          >
            Farbig
          </Button>
          <Button
            variant={selectedLayer === 'satellit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLayer('satellit')}
            className="text-xs"
          >
            Satellit
          </Button>
        </div>

        {/* Layer-Button mit Popover und Tooltip - quadratisch */}
        <TooltipProvider>
          <Popover open={isLayerPanelOpen} onOpenChange={setIsLayerPanelOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/95 backdrop-blur-sm border shadow-sm"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Kartenebenen</p>
                <TooltipArrow />
              </TooltipContent>
            </Tooltip>
            <PopoverContent side="left" align="start" className="w-80 z-[10000]">
              <div className="space-y-4">
                <h4 className="font-medium text-sm mb-4">Zusätzliche Kartenebenen</h4>
                {/* Hangneigung */}
                <div className="flex items-center justify-between">
                  <label htmlFor="hangneigung" className="text-xs font-medium cursor-pointer">
                    Hangneigung ≥30°
                  </label>
                  <Switch
                    id="hangneigung"
                    checked={showHangneigung}
                    onCheckedChange={setShowHangneigung}
                  />
                </div>

                {/* Wanderwege */}
                <div className="flex items-center justify-between">
                  <label htmlFor="wanderwege" className="text-xs font-medium cursor-pointer">
                    Wanderwege
                  </label>
                  <Switch
                    id="wanderwege"
                    checked={showWanderwege}
                    onCheckedChange={setShowWanderwege}
                  />
                </div>

                {/* Jagdbanngebiete */}
                <div className="flex items-center justify-between">
                  <label htmlFor="jagdbanngebiete" className="text-xs font-medium cursor-pointer">
                    Jagdbanngebiete
                  </label>
                  <Switch
                    id="jagdbanngebiete"
                    checked={showJagdbanngebiete}
                    onCheckedChange={setShowJagdbanngebiete}
                  />
                </div>

                {/* Wildruhezonen */}
                <div className="flex items-center justify-between">
                  <label htmlFor="wildruhezonen" className="text-xs font-medium cursor-pointer">
                    Wildruhezonen
                  </label>
                  <Switch
                    id="wildruhezonen"
                    checked={showWildruhezonen}
                    onCheckedChange={setShowWildruhezonen}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Vollbild-Button mit Tooltip - quadratisch */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFullscreen()
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="bg-background/95 backdrop-blur-sm border shadow-sm"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isFullscreen ? 'Vollbild beenden' : 'Vollbild'}</p>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
        {showHangneigung && (
          <WMSTileLayer
            url="https://wms.geo.admin.ch/"
            params={{
              layers: 'ch.swisstopo.hangneigung-ueber_30',
              format: 'image/png',
              transparent: true,
              version: '1.3.0',
            }}
            opacity={0.6}
          />
        )}
        {showWanderwege && (
          <WMSTileLayer
            url="https://wms.geo.admin.ch/"
            params={{
              layers: 'ch.swisstopo.swisstlm3d-wanderwege',
              format: 'image/png',
              transparent: true,
              version: '1.3.0',
            }}
            opacity={0.7}
          />
        )}
        {showJagdbanngebiete && (
          <WMSTileLayer
            url="https://wms.geo.admin.ch/"
            params={{
              layers: 'ch.bafu.bundesinventare-jagdbanngebiete',
              format: 'image/png',
              transparent: true,
              version: '1.3.0',
            }}
            opacity={0.7}
          />
        )}
        {showWildruhezonen && (
          <WMSTileLayer
            url="https://wms.geo.admin.ch/"
            params={{
              layers: 'ch.bafu.wrz-wildruhezonen_portal',
              format: 'image/png',
              transparent: true,
              version: '1.3.0',
            }}
            opacity={0.7}
          />
        )}
        <GPXLayer gpxUrl={gpxUrl} />
        <MapInitializer onMapReady={setMap} />
      </MapContainer>
    </div>
  )

  return (
    <>
      {/* Fullscreen Overlay - ähnlich wie auf SAC-Website */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-background"
          onClick={() => toggleFullscreen()}
        >
          <div
            className="relative w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {renderMap('100vh')}
          </div>
        </div>
      )}

      {/* Normale Kartenansicht */}
      {!isFullscreen && renderMap(height)}
    </>
  )
}
