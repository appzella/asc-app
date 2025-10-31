import React from 'react'
import Link from 'next/link'
import { Tour } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDifficulty } from '@/lib/difficulty'

interface TourCardProps {
  tour: Tour
}

export const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = () => {
    if (tour.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Ausstehend
        </span>
      )
    }
    if (tour.status === 'approved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Freigegeben
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Abgelehnt
      </span>
    )
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
            <div>
              <span className="font-medium">Datum:</span> {formatDate(tour.date)}
            </div>
            <div>
              <span className="font-medium">Dauer:</span> {tour.duration} h
            </div>
            <div>
              <span className="font-medium">Höhenmeter:</span> {tour.elevation} m
            </div>
            <div>
              <span className="font-medium">Teilnehmer:</span> {tour.participants.length}/{tour.maxParticipants}
            </div>
          </div>

          {tour.leader && (
            <div className="text-sm text-gray-500">
              Tourenleiter: {tour.leader.name}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

