declare module 'leaflet-gpx' {
  import * as L from 'leaflet'

  interface GPXOptions {
    async?: boolean
    marker_options?: {
      startIconUrl?: string
      endIconUrl?: string
      shadowUrl?: string
      iconSize?: [number, number]
      iconAnchor?: [number, number]
      popupAnchor?: [number, number]
    }
    polyline_options?: {
      color?: string
      weight?: number
      opacity?: number
    }
  }

  class GPX implements L.Layer {
    constructor(gpxUrl: string, options?: GPXOptions)
    getBounds(): L.LatLngBounds
    on(type: string, fn: L.LeafletEventHandlerFn, context?: any): this
    on(type: 'loaded', fn: (e: { target: GPX }) => void, context?: any): this
    off(type?: string, fn?: L.LeafletEventHandlerFn, context?: any): this
    fire(type: string, data?: any, propagate?: boolean): this
    addTo(map: L.Map | L.LayerGroup): this
    removeFrom(map: L.Map | L.LayerGroup): this
    remove(): this
    bindPopup(content: L.Content, options?: L.PopupOptions): this
    unbindPopup(): this
    openPopup(latlng?: L.LatLng): this
    closePopup(): this
    bindTooltip(content: L.Content, options?: L.TooltipOptions): this
    unbindTooltip(): this
    openTooltip(latlng?: L.LatLng): this
    closeTooltip(): this
  }

  export default GPX
}

