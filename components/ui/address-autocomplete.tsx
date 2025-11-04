'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AddressAutocompleteProps {
  value?: string
  onChange?: (value: string) => void
  onAddressSelect?: (address: {
    street: string
    zip: string
    city: string
  }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  useGooglePlaces?: boolean // Flag um zu bestimmen, ob Google Places verwendet werden soll
}

export function AddressAutocomplete({
  value = '',
  onChange,
  onAddressSelect,
  placeholder = 'Adresse eingeben...',
  className,
  disabled = false,
  useGooglePlaces = false, // Standardmäßig Nominatim verwenden
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Debounce für API-Aufrufe
  const debounceTimer = React.useRef<NodeJS.Timeout>()

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)

    try {
      // Verwende Nominatim (OpenStreetMap) als kostenlose Alternative
      // Oder Google Places API wenn useGooglePlaces=true (API-Key wird server-seitig verwendet)
      let googlePlacesSuccess = false
      
      if (useGooglePlaces) {
        try {
          // Google Places API über Next.js API Route (Proxy)
          const response = await fetch(
            `/api/places/autocomplete?input=${encodeURIComponent(query)}`
          )
          
          const data = await response.json()
          
          if (!response.ok) {
            console.error('Google Places API error:', data.error || data.status)
            // Fallback zu Nominatim bei Fehler
            throw new Error('Google Places API failed')
          }
          
          if (data.predictions && data.predictions.length > 0) {
            setSuggestions(data.predictions)
            setShowSuggestions(true)
            googlePlacesSuccess = true
          } else if (data.error_message || data.status !== 'OK') {
            console.error('Google Places API error:', data.error_message || data.status)
            // Fallback zu Nominatim
            throw new Error('Google Places API returned no results')
          }
        } catch (googleError) {
          // Fallback zu Nominatim wenn Google Places API fehlschlägt
          console.warn('Falling back to Nominatim:', googleError)
          googlePlacesSuccess = false
        }
      }
      
      if (!googlePlacesSuccess) {
        // Nominatim (OpenStreetMap) - kostenlos
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ch&limit=5&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'ASC-Skitouren-App (contact@asc-app.ch)'
              }
            }
          )
          const data = await response.json()
          
          if (Array.isArray(data)) {
            setSuggestions(data)
            setShowSuggestions(true)
          }
        } catch (error) {
          console.error('Error fetching Nominatim suggestions:', error)
          setSuggestions([])
        }
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const getAddressDetails = async (placeId: string, description?: string) => {
    if (useGooglePlaces) {
      // Google Places API - Details abrufen über Next.js API Route (Proxy)
      try {
        const response = await fetch(
          `/api/places/details?place_id=${encodeURIComponent(placeId)}`
        )
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.result?.address_components) {
          const components = data.result.address_components
          const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name || ''
          const streetName = components.find((c: any) => c.types.includes('route'))?.long_name || ''
          const zip = components.find((c: any) => c.types.includes('postal_code'))?.long_name || ''
          const city = components.find((c: any) => c.types.includes('locality'))?.long_name || ''

          // Straßenname vor Hausnummer (z.B. "Bahnstrasse 2" statt "2 Bahnstrasse")
          const street = streetName && streetNumber 
            ? `${streetName} ${streetNumber}`.trim()
            : streetName || streetNumber

          onAddressSelect?.({
            street: street,
            zip: zip,
            city: city,
          })
        } else if (data.error) {
          console.error('Google Places API error:', data.error)
        }
      } catch (error) {
        console.error('Error fetching place details:', error)
      }
    } else {
      // Nominatim - bereits alle Details vorhanden, keine weitere API-Anfrage nötig
      // Die Adressdetails werden direkt beim Click aus der suggestion extrahiert
      // Diese Funktion wird hier nicht für Nominatim verwendet
    }
  }

  const handleSuggestionClick = async (suggestion: any) => {
    const displayText = useGooglePlaces ? suggestion.description : suggestion.display_name
    setInputValue(displayText)
    onChange?.(displayText)
    setShowSuggestions(false)
    setSuggestions([])

    if (onAddressSelect) {
      if (useGooglePlaces) {
        // Google Places API - Details abrufen
        await getAddressDetails(suggestion.place_id, displayText)
      } else {
        // Nominatim - bereits alle Details vorhanden, direkt extrahieren
        const address = suggestion.address || {}
        const streetNumber = address.house_number || ''
        const road = address.road || ''
        const street = streetNumber && road ? `${streetNumber} ${road}` : road || streetNumber || ''
        
        onAddressSelect({
          street: street.trim(),
          zip: address.postcode || '',
          city: address.city || address.town || address.village || address.municipality || '',
        })
      }
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay um Click-Events auf Suggestions zu erlauben
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
      }
    }, 200)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        placeholder={placeholder}
        className={cn(className)}
        disabled={disabled}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => {
            const displayText = useGooglePlaces ? suggestion.description : suggestion.display_name
            const key = useGooglePlaces ? suggestion.place_id : (suggestion.place_id || suggestion.osm_id || index)
            return (
              <div
                key={key}
                className="px-3 py-2 cursor-pointer hover:bg-accent transition-colors text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
              >
                {displayText}
              </div>
            )
          })}
        </div>
      )}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
          Lädt...
        </div>
      )}
    </div>
  )
}

