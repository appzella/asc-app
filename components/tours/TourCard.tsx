import React from 'react'
import Link from 'next/link'
import { Tour, UserRole } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { formatDifficulty } from '@/lib/difficulty'
import { Calendar, Clock, Mountain, Users } from 'lucide-react'
import Image from 'next/image'
import { getTourIcon, getTourIconColor } from '@/lib/tourIcons'

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
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          Entwurf
        </span>
      )
    }
    if (tour.status === 'published') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          Veröffentlicht
        </span>
      )
    }
    if (tour.status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          Abgesagt
        </span>
      )
    }
    return null
  }

  const getTypeBadge = () => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        {tour.tourType}
      </span>
    )
  }

  return (
    <Link href={`/tours/${tour.id}`} className="touch-target">
      <Card className="cursor-pointer h-full group transition-all">
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {(() => {
                const IconComponent = getTourIcon(tour.tourType, tourTypeIcons)
                const iconColor = getTourIconColor(tour.tourType)
                return <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0`} strokeWidth={2} />
              })()}
              <h3 className="text-lg font-semibold text-gray-900 truncate">{tour.title}</h3>
            </div>
            {getStatusBadge()}
          </div>
          
          <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{tour.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {getTypeBadge()}
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {tour.tourLength}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {formatDifficulty(tour.difficulty, tour.tourType)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{formatDate(tour.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.duration} h</span>
            </div>
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.elevation} Hm</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{tour.participants.length}/{tour.maxParticipants}</span>
            </div>
          </div>

          {tour.leader && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {tour.leader.profilePhoto ? (
                <Image
                  src={tour.leader.profilePhoto}
                  alt={tour.leader.name}
                  width={20}
                  height={20}
                  unoptimized
                  className="w-5 h-5 rounded-full object-cover border border-gray-300 flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center border border-gray-300 flex-shrink-0">
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

