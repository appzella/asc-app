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
  apiKey?: string
}

export function AddressAutocomplete({
  value = '',
  onChange,
  onAddressSelect,
  placeholder = 'Adresse eingeben...',
  className,
  disabled = false,
  apiKey,
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
      // Oder Google Places API wenn apiKey vorhanden
      if (apiKey) {
        // Google Places API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&components=country:ch&language=de`
        )
        const data = await response.json()
        
        if (data.predictions) {
          setSuggestions(data.predictions)
          setShowSuggestions(true)
        }
      } else {
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
    if (apiKey) {
      // Google Places API - Details abrufen
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=address_components&language=de`
        )
        const data = await response.json()
        
        if (data.result?.address_components) {
          const components = data.result.address_components
          const street = components.find((c: any) => c.types.includes('street_number'))?.long_name || ''
          const streetName = components.find((c: any) => c.types.includes('route'))?.long_name || ''
          const zip = components.find((c: any) => c.types.includes('postal_code'))?.long_name || ''
          const city = components.find((c: any) => c.types.includes('locality'))?.long_name || ''

          onAddressSelect?.({
            street: `${street} ${streetName}`.trim(),
            zip: zip,
            city: city,
          })
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
    const displayText = apiKey ? suggestion.description : suggestion.display_name
    setInputValue(displayText)
    onChange?.(displayText)
    setShowSuggestions(false)
    setSuggestions([])

    if (onAddressSelect) {
      if (apiKey) {
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
            const displayText = apiKey ? suggestion.description : suggestion.display_name
            const key = apiKey ? suggestion.place_id : (suggestion.place_id || suggestion.osm_id || index)
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

