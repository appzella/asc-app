'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, TourType, TourLength, Difficulty, TourSettings, Tour } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DatePicker } from '@/components/ui/date-picker'
import { canCreateTour } from '@/lib/roles'
import { getDifficultyOptions } from '@/lib/difficulty'
import { getTourIcon } from '@/lib/tourIcons'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

const createTourSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  date: z.string().min(1, 'Datum ist erforderlich'),
  tourType: z.string().min(1, 'Tourenart ist erforderlich'),
  difficulty: z.string().min(1, 'Schwierigkeit ist erforderlich'),
  tourLength: z.string().min(1, 'Tourlänge ist erforderlich'),
  elevation: z.string().min(1, 'Höhenmeter ist erforderlich').refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Höhenmeter muss eine positive Zahl sein',
  }),
  duration: z.string().min(1, 'Dauer ist erforderlich').refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'Dauer muss mindestens 1 Stunde sein',
  }),
  maxParticipants: z.string().min(1, 'Max. Teilnehmer ist erforderlich').refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
    message: 'Max. Teilnehmer muss mindestens 1 sein',
  }),
  leaderId: z.string().optional(),
}).refine((data) => {
  // leaderId ist nur für Admins erforderlich
  return true // Diese Validierung wird in onSubmit gemacht
}, {
  message: 'Tourenleiter ist erforderlich',
  path: ['leaderId'],
})

type CreateTourFormValues = z.infer<typeof createTourSchema>

export default function CreateTourPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<TourSettings>({ tourTypes: [], tourLengths: [], difficulties: {} })
  const [users, setUsers] = useState<User[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [creationMode, setCreationMode] = useState<'new' | 'duplicate'>('new')
  const [selectedTourId, setSelectedTourId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showResults, setShowResults] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [resultsPosition, setResultsPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  
  // Update position when showing results
  useEffect(() => {
    if (showResults && searchQuery && searchInputRef.current) {
      const updatePosition = () => {
        if (searchInputRef.current) {
          const rect = searchInputRef.current.getBoundingClientRect()
          setResultsPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          })
        }
      }
      
      updatePosition()
      
      // Only update on scroll/resize, not continuously
      const handleUpdate = () => updatePosition()
      
      window.addEventListener('scroll', handleUpdate, { passive: true, capture: true })
      window.addEventListener('resize', handleUpdate)
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, { capture: true } as any)
        window.removeEventListener('resize', handleUpdate)
      }
    } else {
      setResultsPosition(null)
    }
  }, [showResults, searchQuery])

  const form = useForm<CreateTourFormValues>({
    resolver: zodResolver(createTourSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      tourType: '',
      difficulty: '',
      tourLength: '',
      elevation: '',
      duration: '',
      maxParticipants: '',
      leaderId: '',
    },
  })

  const tourType = form.watch('tourType')

  useEffect(() => {
    const loadData = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const tourSettings = await dataRepository.getSettings()
        setSettings(tourSettings)
        
        // Load tours for duplication
        const allTours = await dataRepository.getTours()
        // Sort by date descending (newest first)
        allTours.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setTours(allTours)
        
        // Load users for leader selection (only for admins)
        if (currentUser.role === 'admin') {
          const allUsers = await dataRepository.getUsers()
          // Filter to only show leaders and admins as potential tour leaders
          const leaders = allUsers.filter(u => u.role === 'leader' || u.role === 'admin')
          setUsers(leaders)
          // Set default leader to current user
          form.setValue('leaderId', currentUser.id)
        } else {
          // For non-admins, set leaderId to current user
          form.setValue('leaderId', currentUser.id)
        }
        
        if (!canCreateTour(currentUser.role)) {
          router.push('/tours')
        }
      }
    }

    loadData()

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canCreateTour(updatedUser.role)) {
        router.push('/tours')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  // Handle tour duplication
  const handleDuplicateTour = (tourId: string) => {
    const tourToDuplicate = tours.find(t => t.id === tourId)
    if (!tourToDuplicate) return

    // Set minimum date to today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tourDate = new Date(tourToDuplicate.date)
    tourDate.setHours(0, 0, 0, 0)
    const minDate = tourDate < today ? today : tourDate

    form.reset({
      title: `${tourToDuplicate.title} (Kopie)`,
      description: tourToDuplicate.description,
      date: minDate.toISOString().split('T')[0],
      difficulty: tourToDuplicate.difficulty,
      tourType: tourToDuplicate.tourType,
      tourLength: tourToDuplicate.tourLength,
      elevation: tourToDuplicate.elevation.toString(),
      duration: tourToDuplicate.duration.toString(),
      maxParticipants: tourToDuplicate.maxParticipants.toString(),
      leaderId: user?.role === 'admin' ? tourToDuplicate.leaderId : (user?.id || ''),
    })
  }

  const onSubmit = async (values: CreateTourFormValues) => {
    setError('')

    if (!user) return

    // Additional validation for leaderId (only for admins)
    if (user.role === 'admin' && !values.leaderId) {
      form.setError('leaderId', { message: 'Tourenleiter ist erforderlich' })
      return
    }

    setIsLoading(true)

    try {
      // For leaders, always use their own ID as leaderId
      const finalLeaderId = user.role === 'admin' ? values.leaderId! : user.id
      
      const tour = await dataRepository.createTour({
        title: values.title,
        description: values.description,
        date: new Date(values.date),
        difficulty: values.difficulty as Difficulty,
        tourType: values.tourType as TourType,
        tourLength: values.tourLength as TourLength,
        elevation: parseInt(values.elevation),
        duration: parseInt(values.duration),
        maxParticipants: parseInt(values.maxParticipants),
        leaderId: finalLeaderId,
        createdBy: user.id,
      })

      toast.success('Tour erfolgreich erstellt!')
      router.push(`/tours/${tour.id}`)
    } catch (err) {
      console.error('Error creating tour:', err)
      toast.error('Fehler beim Erstellen der Tour')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            <Link href="/tours">
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
        <h1>Neue Tour erstellen</h1>
      </div>

      <Card className="relative" style={{ overflow: 'visible', zIndex: 200 }}>
        <CardHeader>
          <CardTitle>Erstellungsmodus</CardTitle>
        </CardHeader>
        <CardContent style={{ overflow: 'visible' }}>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={creationMode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCreationMode('new')
                setSelectedTourId('')
                setSearchQuery('')
                setShowResults(false)
                // Reset form
                form.reset({
                  title: '',
                  description: '',
                  date: '',
                  difficulty: '',
                  tourType: '',
                  tourLength: '',
                  elevation: '',
                  duration: '',
                  maxParticipants: '',
                  leaderId: user?.role === 'admin' ? (form.getValues('leaderId') || user?.id || '') : (user?.id || ''),
                })
              }}
              className="flex-1"
            >
              Neue Tour erstellen
            </Button>
            <Button
              type="button"
              variant={creationMode === 'duplicate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreationMode('duplicate')}
              className="flex-1"
            >
              Tour duplizieren
            </Button>
          </div>

          {creationMode === 'duplicate' && (
            <div className="space-y-3">
              <div className="w-full flex flex-col relative" style={{ zIndex: 300 }}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tour suchen
                </label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowResults(true)
                  }}
                  onFocus={() => setShowResults(true)}
                  onBlur={() => {
                    // Delay to allow click on result
                    setTimeout(() => setShowResults(false), 200)
                  }}
                  placeholder="Titel der Tour eingeben..."
                  className="w-full px-4 py-2.5 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 border-border hover:border-border min-h-[44px]"
                />
              </div>
              {selectedTourId && (
                <p className="text-xs text-primary-600">
                  ✓ Tour ausgewählt. Felder wurden automatisch ausgefüllt.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trefferliste außerhalb der Cards mit fixed positioning */}
      {showResults && searchQuery && resultsPosition && (
        <div
          className="fixed bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-[9999]"
          style={{
            top: `${resultsPosition.top}px`,
            left: `${resultsPosition.left}px`,
            width: `${resultsPosition.width}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {tours
            .filter((tour) => {
              if (!searchQuery.trim()) return false
              return tour.title.toLowerCase().includes(searchQuery.toLowerCase())
            })
            .slice(0, 10)
            .map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => {
                  setSelectedTourId(tour.id)
                  setSearchQuery(tour.title)
                  setShowResults(false)
                  handleDuplicateTour(tour.id)
                }}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-primary-50 flex items-center gap-3 touch-target"
              >
                {(() => {
                  const IconComponent = getTourIcon(tour.tourType, settings.tourTypeIcons)
                  return <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={2} />
                })()}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{tour.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tour.date).toLocaleDateString('de-CH')} · {tour.tourType}
                  </div>
                </div>
              </button>
            ))}
          {tours.filter((tour) => 
            tour.title.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Keine Touren gefunden, die "{searchQuery}" enthalten.
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tour-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Skitour auf den Säntis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Beschreibe die Tour..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="md:col-start-1 md:row-start-1">
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Datum auswählen"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tourType"
                render={({ field }) => (
                  <FormItem className="md:col-start-2 md:row-start-1">
                    <FormLabel>Tourenart</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('difficulty', '')
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Bitte wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settings.tourTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem className="md:col-start-2 md:row-start-2">
                    <FormLabel>Schwierigkeit (SAC-Skala)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!tourType}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={tourType ? "Bitte wählen" : "Bitte zuerst Tourenart wählen"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDifficultyOptions(tourType as TourType).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tourLength"
                render={({ field }) => (
                  <FormItem className="md:col-start-1 md:row-start-2">
                    <FormLabel>Tourlänge</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Bitte wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settings.tourLengths.map((length) => (
                          <SelectItem key={length} value={length}>
                            {length}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="elevation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Höhenmeter</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={0}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value.toString())}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dauer (Stunden)</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={1}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value.toString())}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max. Teilnehmer</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={1}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value.toString())}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {user?.role === 'admin' && (
                <FormField
                  control={form.control}
                  name="leaderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tourenleiter</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Bitte wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" variant="default" disabled={isLoading} className="flex-1">
                {isLoading ? 'Wird erstellt...' : 'Tour erstellen'}
              </Button>
              <Link href="/tours" className="flex-1 sm:flex-initial">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Abbrechen
                </Button>
              </Link>
            </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
