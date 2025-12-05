import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface Tour {
  id: string
  title: string
  date: string
  type: string
  difficulty: string
  guide: string
  location: string
  ascent: number
  descent: number
  duration: string
  description: string
  participants: {
    current: number
    max: number
  }
  status: "published" | "draft" | "cancelled"
}

interface TourCardProps {
  tour: Tour
}

export function TourCard({ tour }: TourCardProps) {
  return (
    <Link href={`/tours/${tour.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{tour.type}</Badge>
            <div className="flex gap-2">
              <Badge variant={tour.status === 'published' ? 'default' : tour.status === 'cancelled' ? 'destructive' : 'secondary'}>
                {tour.status === 'published' ? 'Veröffentlicht' : tour.status === 'cancelled' ? 'Abgesagt' : 'Entwurf'}
              </Badge>
              <Badge variant="outline">{tour.difficulty}</Badge>
            </div>
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-tight pt-2">
            {tour.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-3">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {tour.description}
            </p>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span>{tour.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{tour.location}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-2">
              <div className="flex items-center gap-2" title="Aufstieg">
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                <span>{tour.ascent} Hm</span>
              </div>
              <div className="flex items-center gap-2" title="Abstieg">
                <ArrowDownRight className="h-4 w-4 shrink-0" />
                <span>{tour.descent} Hm</span>
              </div>
              <div className="flex items-center gap-2" title="Dauer">
                <ClockIcon className="h-4 w-4 shrink-0" />
                <span>{tour.duration}</span>
              </div>
              <div className="flex items-center gap-2" title="Teilnehmer">
                <UsersIcon className="h-4 w-4 shrink-0" />
                <span>{tour.participants.current}/{tour.participants.max}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <UserIcon className="h-4 w-4 shrink-0" />
              <span>{tour.guide}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
