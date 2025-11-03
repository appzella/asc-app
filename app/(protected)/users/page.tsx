'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, UserRole } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { canManageUsers } from '@/lib/roles'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const loadUsers = async () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser && !canManageUsers(currentUser.role)) {
        router.push('/dashboard')
        return
      }

      if (currentUser) {
        const allUsers = await dataRepository.getUsers()
        setUsers(allUsers)
      }
    }

    loadUsers()

    const unsubscribe = authService.subscribe(async (updatedUser) => {
      setUser(updatedUser)
      if (!updatedUser || !canManageUsers(updatedUser.role)) {
        router.push('/dashboard')
      } else {
        const allUsers = await dataRepository.getUsers()
        setUsers(allUsers)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await dataRepository.updateUser(userId, { role: newRole })
    const allUsers = await dataRepository.getUsers()
    setUsers(allUsers)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Link 
            href="/settings" 
            className="hidden sm:inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            Zurück zur Übersicht
          </Link>
          <Link 
            href="/settings"
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md transition-colors touch-target bg-gray-50 hover:bg-gray-100"
            aria-label="Zurück zur Übersicht"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Benutzerverwaltung</h1>
        <p className="text-base text-gray-600">Verwalten Sie Benutzer und deren Rollen</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    E-Mail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Erstellt am
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.name || 'Unbekannt'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value as UserRole)}
                      >
                        <SelectTrigger className="w-40 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Mitglied</SelectItem>
                          <SelectItem value="leader">Tourenleiter</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.registered ? (
                        <Badge variant="default">
                          Registriert
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Ausstehend
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(u.createdAt).toLocaleDateString('de-CH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

