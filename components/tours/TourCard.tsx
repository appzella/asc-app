import React from 'react'
import Link from 'next/link'
import { Tour, UserRole } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDifficulty } from '@/lib/difficulty'
import { Calendar, Clock, ArrowUpRight, Users, ChartNoAxesColumnIncreasing } from 'lucide-react'
import { getTourIcon } from '@/lib/tourIcons'

interface TourCardProps {
  tour: Tour
  tourTypeIcons?: { [key: string]: string }
  userRole?: UserRole
}

export const TourCard: React.FC<TourCardProps> = ({ tour, tourTypeIcons, userRole }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-CH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = () => {
    // Für normale Mitglieder (member) keine Status-Badges anzeigen
    // Nur Entwurf und Abgesagt sind auch für Members relevant
    if (userRole === 'member' && tour.status === 'published') {
      return null
    }

    if (tour.status === 'draft') {
      return (
        <Badge variant="outline-warning">
          Entwurf
        </Badge>
      )
    }
    if (tour.status === 'published') {
      return (
        <Badge variant="outline-success">
          Veröffentlicht
        </Badge>
      )
    }
    if (tour.status === 'cancelled') {
      return (
        <Badge variant="outline-destructive">
          Abgesagt
        </Badge>
      )
    }
    return null
  }

  return (
    <Link href={`/tours/${tour.id}`} className="touch-target">
      <Card className="cursor-pointer h-full group transition-all flex flex-col">
        <CardContent className="p-4 md:p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {(() => {
                const IconComponent = getTourIcon(tour.tourType, tourTypeIcons)
                return <IconComponent className="w-4 h-4 text-foreground flex-shrink-0" strokeWidth={2} />
              })()}
              <h3 className="text-xl font-semibold text-foreground truncate m-0">{tour.title}</h3>
            </div>
            {getStatusBadge()}
          </div>
          
          <p className="text-muted-foreground mb-3 line-clamp-2 text-sm !mt-2">{tour.description}</p>
          
          <Separator className="mb-3" />
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline">{tour.tourType}</Badge>
            <Badge variant="outline">{tour.tourLength}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{formatDate(tour.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.duration} h</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.elevation} Hm</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.participants.length}/{tour.maxParticipants}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChartNoAxesColumnIncreasing className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{formatDifficulty(tour.difficulty, tour.tourType)}</span>
            </div>
          </div>

          <div className="flex-1"></div>

          {tour.leader && (
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <Avatar className="w-5 h-5 flex-shrink-0">
                <AvatarImage
                  src={tour.leader.profilePhoto || undefined}
                  alt={tour.leader.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-[10px]">
                  {tour.leader.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{tour.leader.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

