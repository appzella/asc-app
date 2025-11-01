import React from 'react'
import Link from 'next/link'
import { Tour } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDifficulty } from '@/lib/difficulty'
import { Calendar, Clock, Mountain, Users } from 'lucide-react'
import Image from 'next/image'

interface TourCardProps {
  tour: Tour
}

export const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-CH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = () => {
    if (tour.status === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Entwurf
        </span>
      )
    }
    if (tour.status === 'published') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Veröffentlicht
        </span>
      )
    }
    return null
  }

  const getTypeBadge = () => {
    const colors = {
      Wanderung: 'bg-blue-100 text-blue-800',
      Skitour: 'bg-purple-100 text-purple-800',
      Bike: 'bg-orange-100 text-orange-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tour.tourType] || 'bg-gray-100 text-gray-800'}`}>
        {tour.tourType}
      </span>
    )
  }

  return (
    <Link href={`/tours/${tour.id}`} className="touch-manipulation">
      <Card className="hover:shadow-modern-xl active:shadow-modern-lg cursor-pointer h-full group animate-slide-up transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{tour.title}</h3>
            {getStatusBadge()}
          </div>
          
          <p className="text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {getTypeBadge()}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {tour.tourLength}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {formatDifficulty(tour.difficulty, tour.tourType)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span>{formatDate(tour.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span>{tour.duration} h</span>
            </div>
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span>{tour.elevation} Hm</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600 flex-shrink-0" strokeWidth={2} />
              <span>{tour.participants.length}/{tour.maxParticipants}</span>
            </div>
          </div>

          {tour.leader && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {tour.leader.profilePhoto ? (
                <Image
                  src={tour.leader.profilePhoto}
                  alt={tour.leader.name}
                  width={20}
                  height={20}
                  unoptimized
                  className="w-5 h-5 rounded-full object-cover border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-primary-600">
                    {tour.leader.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span>{tour.leader.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

