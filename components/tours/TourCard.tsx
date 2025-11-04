import React from 'react'
import Link from 'next/link'
import { Tour, UserRole } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDifficulty } from '@/lib/difficulty'
import { Calendar, Clock, ArrowUpRight, Users, ChartNoAxesColumnIncreasing } from 'lucide-react'
import Image from 'next/image'
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
        <Badge variant="outline">
          Entwurf
        </Badge>
      )
    }
    if (tour.status === 'published') {
      return (
        <Badge variant="default">
          Veröffentlicht
        </Badge>
      )
    }
    if (tour.status === 'cancelled') {
      return (
        <Badge variant="destructive">
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
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {(() => {
                const IconComponent = getTourIcon(tour.tourType, tourTypeIcons)
                return <IconComponent className="w-4 h-4 text-foreground flex-shrink-0" strokeWidth={2} />
              })()}
              <h3 className="text-lg font-semibold text-foreground truncate">{tour.title}</h3>
            </div>
            {getStatusBadge()}
          </div>
          
          <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{tour.description}</p>
          
          <Separator className="mb-3" />
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline">{tour.tourType}</Badge>
            <Badge variant="outline">{tour.tourLength}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{formatDate(tour.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.duration} h</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.elevation} Hm</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.participants.length}/{tour.maxParticipants}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChartNoAxesColumnIncreasing className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{formatDifficulty(tour.difficulty, tour.tourType)}</span>
            </div>
          </div>

          <div className="flex-1"></div>

          {tour.leader && (
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              {tour.leader.profilePhoto ? (
                <Image
                  src={tour.leader.profilePhoto}
                  alt={tour.leader.name}
                  width={20}
                  height={20}
                  unoptimized
                  className="w-5 h-5 rounded-full object-cover border border-border flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center border border-border flex-shrink-0">
                  <span className="text-[10px] font-semibold text-primary-600">
                    {tour.leader.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs">{tour.leader.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

