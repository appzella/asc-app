'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, Tour, TourType, TourLength, Difficulty, TourSettings } from '@/lib/types'
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
import { canEditTour } from '@/lib/roles'
import { getDifficultyOptions } from '@/lib/difficulty'
import Link from 'next/link'
import { ChevronLeft, HelpCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { WhatsAppGroupGuide } from '@/components/tours/WhatsAppGroupGuide'

const editTourSchema = z.object({
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
  whatsappGroupLink: z.string().optional().refine((val) => !val || val.trim() === '' || z.string().url().safeParse(val).success, {
    message: 'Bitte gib eine gültige URL ein',
  }),
}).refine((data) => {
  return true
}, {
  message: 'Tourenleiter ist erforderlich',
  path: ['leaderId'],
})

type EditTourFormValues = z.infer<typeof editTourSchema>

export default function EditTourPage() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tour, setTour] = useState<Tour | null>(null)
  const [settings, setSettings] = useState<TourSettings>({ tourTypes: [], tourLengths: [], difficulties: {} })
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const gpxFileInputRef = useRef<HTMLInputElement>(null)
  const [showWhatsAppGuide, setShowWhatsAppGuide] = useState(false)
  const [removeGpxFile, setRemoveGpxFile] = useState(false)

  const form = useForm<EditTourFormValues>({
    resolver: zodResolver(editTourSchema),
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
      whatsappGroupLink: '',
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

        const tourData = await dataRepository.getTourById(tourId)
        if (!tourData) {
          router.push('/tours')
          return
        }

        if (!canEditTour(currentUser.role, tourData.leaderId, currentUser.id, tourData.status)) {
          router.push(`/tours/${tourId}`)
          return
        }

        setTour(tourData)
        
        // Load users for leader selection (only for admins)
        if (currentUser.role === 'admin') {
          const allUsers = await dataRepository.getUsers()
          const leaders = allUsers.filter(u => u.role === 'leader' || u.role === 'admin')
          setUsers(leaders)
        }
        
        // Reset GPX file removal state
        setRemoveGpxFile(false)
        setGpxFile(null)
        
        // Formular mit aktuellen Tour-Daten füllen
        const displayTour = tourData.pendingChanges ? { ...tourData, ...tourData.pendingChanges } : tourData
        
        // Debug: Log difficulty and WhatsApp link values
        if (process.env.NODE_ENV === 'development') {
          console.log('Tour difficulty:', displayTour.difficulty, typeof displayTour.difficulty)
          console.log('Tour whatsappGroupLink:', displayTour.whatsappGroupLink, typeof displayTour.whatsappGroupLink)
        }
        
        // Ensure leaderId is set - for leaders, use their own ID; for admins, use tour's leaderId
        const formLeaderId = currentUser.role === 'admin' 
          ? displayTour.leaderId 
          : (displayTour.leaderId || currentUser.id)
        
        // Warte kurz, damit Settings geladen sind, bevor Formular zurückgesetzt wird
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Stelle sicher, dass difficulty einen gültigen Wert hat
        // difficulty kann ein Difficulty-Enum sein, also prüfe direkt auf String
        const difficultyValue = displayTour.difficulty && typeof displayTour.difficulty === 'string' && displayTour.difficulty.trim() !== ''
          ? displayTour.difficulty.trim()
          : (displayTour.difficulty || '')
        
        // Debug: Log final difficulty value
        if (process.env.NODE_ENV === 'development') {
          console.log('Difficulty value for form:', difficultyValue)
        }
        
        form.reset({
          title: displayTour.title,
          description: displayTour.description,
          date: new Date(displayTour.date).toISOString().split('T')[0],
          difficulty: difficultyValue,
          tourType: displayTour.tourType || '',
          tourLength: displayTour.tourLength || '',
          elevation: displayTour.elevation.toString(),
          duration: displayTour.duration.toString(),
          maxParticipants: displayTour.maxParticipants.toString(),
          leaderId: formLeaderId || '',
          whatsappGroupLink: displayTour.whatsappGroupLink || '',
        })
        
        // Stelle sicher, dass difficulty explizit gesetzt wird, nachdem tourType gesetzt ist
        // Warte nochmal kurz, damit die Select-Options verfügbar sind
        if (difficultyValue) {
          setTimeout(() => {
            form.setValue('difficulty', difficultyValue, { shouldValidate: false, shouldDirty: false })
          }, 200)
        }
      }
    }

    loadData()

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [tourId, router, form])

  const onSubmit = async (values: EditTourFormValues) => {
    setError('')

    if (!user || !tour) return

    // Additional validation for leaderId (only for admins)
    if (user.role === 'admin' && !values.leaderId) {
      form.setError('leaderId', { message: 'Tourenleiter ist erforderlich' })
      return
    }

    setIsLoading(true)

    try {
      // For leaders, always use their own ID as leaderId (cannot be changed)
      // If leaderId is not set for admin, use the current tour's leaderId
      const finalLeaderId = user.role === 'admin' 
        ? (values.leaderId || tour.leaderId) 
        : user.id
      
      // Ensure difficulty is set (should not be empty)
      if (!values.difficulty || values.difficulty === '') {
        form.setError('difficulty', { message: 'Schwierigkeit ist erforderlich' })
        setIsLoading(false)
        return
      }
      
      // Normalisiere WhatsApp-Link: leerer String oder nur Whitespace wird zu null
      const whatsappLinkValue = values.whatsappGroupLink && typeof values.whatsappGroupLink === 'string' && values.whatsappGroupLink.trim() !== ''
        ? values.whatsappGroupLink.trim()
        : null
      
      // Debug: Log WhatsApp link value
      if (process.env.NODE_ENV === 'development') {
        console.log('WhatsApp link value:', whatsappLinkValue, 'from:', values.whatsappGroupLink)
      }
      
      const updates = {
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
        whatsappGroupLink: whatsappLinkValue,
      }

      // Wenn Tour bereits approved ist, werden Änderungen als pendingChanges gespeichert
      const submitForApproval = false // Nicht mehr benötigt mit neuer Status-Logik
      const updatedTour = await dataRepository.updateTour(tourId, updates, submitForApproval)
      
      if (!updatedTour) {
        throw new Error('Tour konnte nicht aktualisiert werden')
      }

      // Handle GPX file: remove if requested, or upload new one
      if (removeGpxFile && tour.gpxFile) {
        try {
          await dataRepository.deleteGpxFile(tour.gpxFile)
          await dataRepository.updateTour(tourId, { gpxFile: null })
        } catch (gpxError) {
          console.error('Error deleting GPX file:', gpxError)
          toast.error('Tour wurde aktualisiert, aber GPX-Datei konnte nicht entfernt werden')
        }
      } else if (gpxFile) {
        try {
          // Delete old GPX file if exists
          if (tour.gpxFile) {
            await dataRepository.deleteGpxFile(tour.gpxFile)
          }
          const gpxUrl = await dataRepository.uploadGpxFile(tourId, gpxFile)
          await dataRepository.updateTour(tourId, { gpxFile: gpxUrl })
        } catch (gpxError) {
          console.error('Error uploading GPX file:', gpxError)
          toast.error('Tour wurde aktualisiert, aber GPX-Datei konnte nicht hochgeladen werden')
        }
      }

      toast.success('Tour erfolgreich aktualisiert!')
      router.push(`/tours/${tourId}`)
    } catch (err: any) {
      console.error('Error updating tour:', err)
      const errorMessage = err?.message || 'Fehler beim Aktualisieren der Tour'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !tour) {
    return <div>Lädt...</div>
  }

  const hasPendingChanges = tour.pendingChanges !== undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            <Link href={`/tours/${tourId}`}>
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Zurück zur Tour
            </Link>
          </Button>
        </div>
        <h1>Tour bearbeiten</h1>
      </div>

      {hasPendingChanges && (
        <p className="text-primary-600 opacity-90 text-sm mb-4">
          Diese Tour hat bereits ausstehende Änderungen, die auf Freigabe warten.
        </p>
      )}

      {tour.status === 'published' && (
        <p className="text-primary-600 opacity-90 text-sm mb-4">
          Diese Tour ist bereits veröffentlicht. Ihre Änderungen sind sofort sichtbar.
        </p>
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
                      <Input {...field} />
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
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={field.value || ''}
                      onValueChange={(value) => {
                        const previousValue = field.value
                        field.onChange(value)
                        // Nur difficulty zurücksetzen, wenn tourType wirklich geändert wurde
                        // und der neue Wert sich vom aktuellen Formularwert unterscheidet
                        if (previousValue && value !== previousValue) {
                          // Prüfe, ob die aktuelle difficulty für den neuen tourType noch gültig ist
                          const currentDifficulty = form.getValues('difficulty')
                          if (currentDifficulty) {
                            const newOptions = getDifficultyOptions(value as TourType, settings)
                            const isValidForNewType = newOptions.some(opt => opt.value === currentDifficulty)
                            if (!isValidForNewType) {
                              form.setValue('difficulty', '')
                            }
                          }
                        }
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
                render={({ field }) => {
                  const difficultyOptions = tourType ? getDifficultyOptions(tourType as TourType, settings) : []
                  const currentValue = field.value || ''
                  
                  return (
                    <FormItem className="md:col-start-2 md:row-start-2">
                      <FormLabel>Schwierigkeit (SAC-Skala)</FormLabel>
                      <Select
                        value={currentValue}
                        onValueChange={field.onChange}
                        disabled={!tourType}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={tourType ? "Bitte wählen" : "Bitte zuerst Tourenart wählen"}>
                              {currentValue && difficultyOptions.find(opt => opt.value === currentValue)?.label || currentValue}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tourType ? (
                            difficultyOptions.length > 0 ? (
                              difficultyOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Lade Optionen...
                              </div>
                            )
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Bitte zuerst Tourenart wählen
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
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

              <FormField
                control={form.control}
                name="whatsappGroupLink"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>WhatsApp-Gruppen-Link (optional)</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setShowWhatsAppGuide(true)}
                        aria-label="Anleitung anzeigen"
                      >
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="https://chat.whatsapp.com/..."
                        {...field}
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
                        value={field.value || ''}
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

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="gpx-file-edit">GPX-Datei (optional)</Label>
              <div className="space-y-2">
                {tour.gpxFile && !removeGpxFile && (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <p className="text-xs text-muted-foreground">
                      Aktuelle GPX-Datei vorhanden
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRemoveGpxFile(true)
                        setGpxFile(null)
                        if (gpxFileInputRef.current) {
                          gpxFileInputRef.current.value = ''
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Entfernen
                    </Button>
                  </div>
                )}
                {removeGpxFile && (
                  <p className="text-xs text-muted-foreground">
                    GPX-Datei wird beim Speichern entfernt.
                  </p>
                )}
                <input
                  ref={gpxFileInputRef}
                  id="gpx-file-edit"
                  type="file"
                  accept=".gpx,.xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Validate file type
                      const validExtensions = ['gpx', 'xml']
                      const fileExt = file.name.split('.').pop()?.toLowerCase()
                      if (!fileExt || !validExtensions.includes(fileExt)) {
                        toast.error('Ungültiger Dateityp. Nur GPX-Dateien sind erlaubt.')
                        return
                      }
                      // Validate file size (max 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('Die Datei ist zu groß. Bitte wähle eine Datei unter 10MB.')
                        return
                      }
                      setGpxFile(file)
                      setRemoveGpxFile(false) // Wenn neue Datei ausgewählt wird, nicht mehr entfernen
                    }
                  }}
                  className="w-full px-4 py-2.5 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 border-border hover:border-border file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {gpxFile && (
                  <p className="text-xs text-muted-foreground">
                    Ausgewählt: {gpxFile.name} ({(gpxFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Lade eine GPX-Datei hoch, um die Tour auf einer Karte zu visualisieren.
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="default" disabled={isLoading} className="flex-1">
                {isLoading ? 'Wird gespeichert...' : 'Tour aktualisieren'}
              </Button>
              <Link href={`/tours/${tourId}`}>
                <Button type="button" variant="outline">
                  Abbrechen
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    <WhatsAppGroupGuide
      open={showWhatsAppGuide}
      onOpenChange={setShowWhatsAppGuide}
      tourName={form.watch('title') || tour?.title || 'Tour'}
    />
    </div>
  )
}

