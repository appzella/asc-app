import { getServerRepository } from "@/lib/data/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, MountainIcon, UsersIcon } from "lucide-react"
import Link from "next/link"

export default async function Page() {
  const repository = await getServerRepository()
  const tours = await repository.getPublishedTours()
  const users = await repository.getUsers()

  const upcomingTours = tours.filter(t => new Date(t.date) >= new Date())
  const pastTours = tours.filter(t => new Date(t.date) < new Date())

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-2 px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen beim ASC Skiclub
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kommende Touren</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingTours.length}</div>
              <p className="text-xs text-muted-foreground">
                geplante Touren
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchgeführte Touren</CardTitle>
              <MountainIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastTours.length}</div>
              <p className="text-xs text-muted-foreground">
                abgeschlossene Touren
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mitglieder</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                aktive Mitglieder
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tours */}
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Nächste Touren</CardTitle>
              <CardDescription>Die kommenden geplanten Touren</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTours.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTours.slice(0, 5).map(tour => (
                    <Link
                      key={tour.id}
                      href={`/tours/${tour.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{tour.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tour.date).toLocaleDateString('de-CH', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })} • {tour.type} • {tour.difficulty}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tour.participants.length}/{tour.maxParticipants || '∞'}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Keine kommenden Touren geplant
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
