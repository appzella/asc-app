import { UserRole } from './types'

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  LEADER: 'leader' as UserRole,
  MEMBER: 'member' as UserRole,
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    leader: 2,
    member: 1,
  }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canCreateTour(role: UserRole): boolean {
  return role === ROLES.ADMIN || role === ROLES.LEADER
}

export function canApproveTour(role: UserRole): boolean {
  return role === ROLES.ADMIN
}

export function canManageUsers(role: UserRole): boolean {
  return role === ROLES.ADMIN
}

export function canEditTour(role: UserRole, tourLeaderId: string, userId: string): boolean {
  if (role === ROLES.ADMIN) return true
  if (role === ROLES.LEADER && tourLeaderId === userId) return true
  return false
}

