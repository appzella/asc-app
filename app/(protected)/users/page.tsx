'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { dataRepository } from '@/lib/data'
import { User, UserRole } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { canManageUsers } from '@/lib/roles'

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
    return <div>Lädt...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
        <p className="mt-2 text-gray-600">Verwalten Sie Benutzer und deren Rollen</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-Mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.name || 'Unbekannt'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        options={[
                          { value: 'member', label: 'Mitglied' },
                          { value: 'leader', label: 'Tourenleiter' },
                          { value: 'admin', label: 'Admin' },
                        ]}
                        className="w-40"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.registered ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Registriert
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Ausstehend
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

