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
    <Link href={`/tours/${tour.id}`} className="block h-full group">
      <Card className="flex h-full flex-col overflow-hidden border-muted-foreground/20 transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="space-y-3 pb-3">
          {/* Top Row: Date & Status */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>{tour.date}</span>
            </div>
            {tour.status !== 'published' && (
              <Badge variant={tour.status === 'cancelled' ? 'destructive' : 'secondary'} className="h-6">
                {tour.status === 'cancelled' ? 'Abgesagt' : 'Entwurf'}
              </Badge>
            )}
          </div>

          {/* Title & Location */}
          <div className="space-y-1">
            <CardTitle className="line-clamp-2 text-xl leading-tight group-hover:text-primary transition-colors">
              {tour.title}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{tour.location}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md px-2.5 py-0.5 font-normal">
              {tour.type}
            </Badge>
            <Badge variant="outline" className="rounded-md px-2.5 py-0.5 font-normal border-primary/20 text-primary">
              {tour.difficulty}
            </Badge>
          </div>

          {/* Description */}
          <p className="line-clamp-2 text-sm text-muted-foreground min-h-[2.5rem]">
            {tour.description}
          </p>

          <div className="mt-auto space-y-4">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-background p-1.5 shadow-sm">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Aufstieg</span>
                  <span className="text-sm font-medium">{tour.ascent} hm</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-background p-1.5 shadow-sm">
                  <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Abstieg</span>
                  <span className="text-sm font-medium">{tour.descent} hm</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-background p-1.5 shadow-sm">
                  <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Dauer</span>
                  <span className="text-sm font-medium">{tour.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-background p-1.5 shadow-sm">
                  <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Teilnehmer</span>
                  <span className="text-sm font-medium">{tour.participants.current}/{tour.participants.max}</span>
                </div>
              </div>
            </div>

            {/* Guide */}
            <div className="flex items-center gap-2.5 border-t pt-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Guide: <span className="text-foreground">{tour.guide}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
