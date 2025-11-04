'use client'

import { useState, useEffect } from 'react'
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
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

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
        
        // Formular mit aktuellen Tour-Daten füllen
        const displayTour = tourData.pendingChanges ? { ...tourData, ...tourData.pendingChanges } : tourData
        form.reset({
          title: displayTour.title,
          description: displayTour.description,
          date: new Date(displayTour.date).toISOString().split('T')[0],
          difficulty: displayTour.difficulty,
          tourType: displayTour.tourType,
          tourLength: displayTour.tourLength,
          elevation: displayTour.elevation.toString(),
          duration: displayTour.duration.toString(),
          maxParticipants: displayTour.maxParticipants.toString(),
          leaderId: displayTour.leaderId,
        })
      }
    }

    loadData()

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser)
    })

    return () => {
      unsubscribe()
    }
  }, [tourId, router])

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
      const finalLeaderId = user.role === 'admin' ? values.leaderId! : user.id
      
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
      }

      // Wenn Tour bereits approved ist, werden Änderungen als pendingChanges gespeichert
      const submitForApproval = false // Nicht mehr benötigt mit neuer Status-Logik
      await dataRepository.updateTour(tourId, updates, submitForApproval)

      toast.success('Tour erfolgreich aktualisiert!')
      router.push(`/tours/${tourId}`)
    } catch (err) {
      console.error('Error updating tour:', err)
      toast.error('Fehler beim Aktualisieren der Tour')
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
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Bitte wählen" />
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
    </div>
  )
}

