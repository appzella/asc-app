import { User, Tour, Invitation, TourSettings, TourType, TourLength, Difficulty } from '../types'

// Mock User extending User to include password for simulation
type MockUser = User & { password?: string; registered?: boolean }

// In-Memory Datenspeicher
class DataStore {
  private users: MockUser[] = []
  private tours: Tour[] = []
  private invitations: Invitation[] = []
  private currentUser: User | null = null
  private settings: TourSettings = {
    tourTypes: ['Wanderung', 'Skitour', 'Bike'],
    tourLengths: ['Eintagestour', 'Mehrtagestour'],
    difficulties: {
      'Wanderung': ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
      'Skitour': ['L', 'WS', 'ZS', 'S', 'SS', 'AS', 'EX'],
      'Bike': ['B1', 'B2', 'B3', 'B4', 'B5'],
    },
  }

  // User Management
  getUsers(): User[] {
    return this.users.map((user) => {
      const { password, ...cleanUser } = user
      return cleanUser
    })
  }

  getUserById(id: string): User | undefined {
    const user = this.users.find((u) => u.id === id)
    if (!user) return undefined
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  getUserByEmail(email: string): User | undefined {
    const user = this.users.find((u) => u.email === email)
    if (!user) return undefined
    const { password, ...cleanUser } = user
    return cleanUser
  }

  createUser(user: Omit<MockUser, 'id' | 'createdAt'> & { id?: string }): User {
    const newUser: MockUser = {
      ...user,
      id: user.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: user.isActive !== undefined ? user.isActive : true,
      createdAt: new Date().toISOString(),
    }
    this.users.push(newUser)
    const { password, ...cleanUser } = newUser
    return cleanUser
  }

  updateUser(id: string, updates: Partial<MockUser>): User | null {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    this.users[index] = { ...this.users[index], ...updates }
    const { password, ...userWithoutPassword } = this.users[index]
    return userWithoutPassword
  }

  // Auth
  login(email: string, password: string): User | null {
    const user = this.users.find((u) => u.email === email && u.password === password)
    if (user && user.registered && user.isActive) {
      this.currentUser = user
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    }
    return null
  }

  logout(): void {
    this.currentUser = null
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) return null
    // Make sure we strip password if it somehow persisted
    const { password, ...userWithoutPassword } = this.currentUser as MockUser
    return userWithoutPassword
  }

  // Tours
  getTours(): Tour[] {
    return this.tours.map((tour) => ({
      ...tour,
      leader: this.getUserById(tour.leaderId),
    }))
  }

  getTourById(id: string): Tour | undefined {
    const tour = this.tours.find((t) => t.id === id)
    if (!tour) return undefined
    return {
      ...tour,
      leader: this.getUserById(tour.leaderId),
    }
  }

  createTour(tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'status' | 'waitlist'> & { id?: string }): Tour {
    const newTour: Tour = {
      ...tour,
      id: tour.id || `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'draft',
      participants: [],
      waitlist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.tours.push(newTour)
    return this.getTourById(newTour.id)!
  }

  updateTour(id: string, updates: Partial<Tour>, submitForApproval = false): Tour | null {
    const index = this.tours.findIndex((t) => t.id === id)
    if (index === -1) return null

    const tour = this.tours[index]

    // Normale Aktualisierung
    this.tours[index] = {
      ...tour,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return this.getTourById(id)!
  }

  publishTour(id: string): Tour | null {
    const tour = this.getTourById(id)
    if (!tour) return null

    const index = this.tours.findIndex((t) => t.id === id)
    this.tours[index] = {
      ...tour,
      status: 'published',
      updatedAt: new Date().toISOString(),
    }

    return this.getTourById(id)!
  }

  unpublishTour(id: string): Tour | null {
    const tour = this.getTourById(id)
    if (!tour) return null

    const index = this.tours.findIndex((t) => t.id === id)
    this.tours[index] = {
      ...tour,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }

    return this.getTourById(id)!
  }

  cancelTour(id: string): Tour | null {
    const tour = this.getTourById(id)
    if (!tour) return null

    const index = this.tours.findIndex((t) => t.id === id)
    this.tours[index] = {
      ...tour,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    }

    return this.getTourById(id)!
  }

  registerForTour(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    // Only allow registration for published tours (not draft, cancelled, etc.)
    if (!tour || tour.status !== 'published') return false

    // Check if user is already participating or on waitlist by ID
    if (tour.participants.some(p => p.id === userId) || tour.waitlist.some(p => p.id === userId)) return false

    const user = this.getUserById(userId)
    if (!user) return false

    // Wenn Tour voll ist, zur Warteliste hinzufügen
    const maxParticipants = tour.maxParticipants || 10
    if (tour.participants.length >= maxParticipants) {
      tour.waitlist.push(user)
      return true
    }

    tour.participants.push(user)
    return true
  }

  unregisterFromTour(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false

    const index = tour.participants.findIndex(p => p.id === userId)
    if (index === -1) return false

    tour.participants.splice(index, 1)

    // Automatisches Nachrücken: Wenn noch Platz unter maxParticipants und Warteliste vorhanden
    const maxParticipants = tour.maxParticipants || 10
    if (tour.participants.length < maxParticipants && tour.waitlist.length > 0) {
      const firstWaitlistUser = tour.waitlist.shift()!
      tour.participants.push(firstWaitlistUser)
    }

    return true
  }

  addToWaitlist(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false
    if (tour.waitlist.some(p => p.id === userId) || tour.participants.some(p => p.id === userId)) return false

    const user = this.getUserById(userId)
    if (!user) return false

    tour.waitlist.push(user)
    return true
  }

  removeFromWaitlist(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false

    const index = tour.waitlist.findIndex(p => p.id === userId)
    if (index === -1) return false

    tour.waitlist.splice(index, 1)
    return true
  }

  getWaitlistByTourId(tourId: string): User[] {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return []
    return tour.waitlist
  }

  promoteFromWaitlist(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false

    const waitlistIndex = tour.waitlist.findIndex(p => p.id === userId)
    if (waitlistIndex === -1) return false

    const user = tour.waitlist[waitlistIndex]

    // Entferne von Warteliste
    tour.waitlist.splice(waitlistIndex, 1)

    // Füge als Teilnehmer hinzu (auch wenn Tour bereits voll ist)
    tour.participants.push(user)
    return true
  }

  addParticipantManually(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour || tour.status !== 'published') return false

    // Prüfe ob bereits Teilnehmer
    if (tour.participants.some(p => p.id === userId)) return false

    const user = this.getUserById(userId)
    if (!user) return false

    // Prüfe ob auf Warteliste - wenn ja, entferne von dort
    const waitlistIndex = tour.waitlist.findIndex(p => p.id === userId)
    if (waitlistIndex !== -1) {
      tour.waitlist.splice(waitlistIndex, 1)
    }

    // Füge als Teilnehmer hinzu (auch wenn Tour bereits voll ist)
    tour.participants.push(user)
    return true
  }

  // Invitations
  createInvitation(email: string, createdBy: string): Invitation {
    const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const invitation: Invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      token,
      createdBy,
      createdAt: new Date().toISOString(),
      used: false,
    }
    this.invitations.push(invitation)

    // User-Account erstellen (noch nicht registriert)
    this.createUser({
      email,
      name: '', // Wird bei Registrierung ausgefüllt
      role: 'member',
      registered: false,
      isActive: true, // Renamed from active
      // registrationToken: token, // This might not be in User interface anymore, assuming removed
    })

    return invitation
  }

  getInvitationByToken(token: string): Invitation | undefined {
    return this.invitations.find((inv) => inv.token === token && !inv.used)
  }

  useInvitation(token: string, name: string, password: string): User | null {
    const invitation = this.getInvitationByToken(token)
    if (!invitation) return null

    const user = this.getUserByEmail(invitation.email)
    if (!user) return null

    invitation.used = true
    // invitation.usedAt = new Date() // Field removed from type

    const updatedUser = this.updateUser(user.id, {
      name,
      password,
      registered: true,
      // registrationToken: undefined,
    } as any) // Casting as any to allow mock properties like password/registered

    return updatedUser
  }

  getInvitations(): Invitation[] {
    return this.invitations
  }

  // Settings
  getSettings(): TourSettings {
    return { ...this.settings }
  }

  updateSettings(updates: Partial<TourSettings>): TourSettings {
    this.settings = { ...this.settings, ...updates }
    return this.getSettings()
  }

  addTourType(type: string): boolean {
    if (this.settings.tourTypes.includes(type)) return false
    this.settings.tourTypes.push(type)
    return true
  }

  removeTourType(type: string): boolean {
    const index = this.settings.tourTypes.indexOf(type)
    if (index === -1) return false
    this.settings.tourTypes.splice(index, 1)
    return true
  }

  renameTourType(oldName: string, newName: string): boolean {
    if (!newName.trim() || oldName === newName) return false
    const index = this.settings.tourTypes.indexOf(oldName)
    if (index === -1) return false
    if (this.settings.tourTypes.includes(newName.trim())) return false // Already exists

    this.settings.tourTypes[index] = newName.trim()

    // Update all tours that use this tour type
    this.tours.forEach(tour => {
      if (tour.type === oldName) {
        tour.type = newName.trim()
      }
    })

    // Update icon mapping if it exists
    if (this.settings.tourTypeIcons && this.settings.tourTypeIcons[oldName]) {
      this.settings.tourTypeIcons[newName.trim()] = this.settings.tourTypeIcons[oldName]
      delete this.settings.tourTypeIcons[oldName]
    }

    return true
  }

  addTourLength(length: string): boolean {
    if (this.settings.tourLengths.includes(length)) return false
    this.settings.tourLengths.push(length)
    return true
  }

  removeTourLength(length: string): boolean {
    const index = this.settings.tourLengths.indexOf(length)
    if (index === -1) return false
    this.settings.tourLengths.splice(index, 1)
    return true
  }

  renameTourLength(oldName: string, newName: string): boolean {
    if (!newName.trim() || oldName === newName) return false
    const index = this.settings.tourLengths.indexOf(oldName)
    if (index === -1) return false
    if (this.settings.tourLengths.includes(newName.trim())) return false // Already exists

    this.settings.tourLengths[index] = newName.trim()

    // Update all tours that use this tour length
    this.tours.forEach(tour => {
      if (tour.length === oldName) {
        tour.length = newName.trim()
      }
    })

    return true
  }

  updateTourTypesOrder(orderedTypes: string[]): void {
    this.settings.tourTypes = orderedTypes
  }

  updateTourLengthsOrder(orderedLengths: string[]): void {
    this.settings.tourLengths = orderedLengths
  }

  updateDifficultiesOrder(tourType: string, orderedDifficulties: string[]): void {
    if (!this.settings.difficulties) this.settings.difficulties = {}
    if (!this.settings.difficulties[tourType]) {
      this.settings.difficulties[tourType] = []
    }
    this.settings.difficulties[tourType] = orderedDifficulties
  }

  addDifficulty(tourType: string, difficulty: string): boolean {
    if (!this.settings.difficulties) this.settings.difficulties = {}
    if (!this.settings.difficulties[tourType]) {
      this.settings.difficulties[tourType] = []
    }
    if (this.settings.difficulties[tourType].includes(difficulty)) return false
    this.settings.difficulties[tourType].push(difficulty)
    return true
  }

  removeDifficulty(tourType: string, difficulty: string): boolean {
    if (!this.settings.difficulties || !this.settings.difficulties[tourType]) return false
    const index = this.settings.difficulties[tourType].indexOf(difficulty)
    if (index === -1) return false
    this.settings.difficulties[tourType].splice(index, 1)
    return true
  }

  renameDifficulty(tourType: string, oldName: string, newName: string): boolean {
    if (!newName.trim() || oldName === newName) return false
    if (!this.settings.difficulties || !this.settings.difficulties[tourType]) return false
    const index = this.settings.difficulties[tourType].indexOf(oldName)
    if (index === -1) return false
    if (this.settings.difficulties[tourType].includes(newName.trim())) return false // Already exists

    this.settings.difficulties[tourType][index] = newName.trim()

    // Update all tours that use this difficulty for this tour type
    this.tours.forEach(tour => {
      if (tour.type === tourType && tour.difficulty === oldName) {
        tour.difficulty = newName.trim()
      }
    })

    return true
  }

  getDifficultiesForTourType(tourType: string): string[] {
    if (!this.settings.difficulties) return []
    return this.settings.difficulties[tourType] || []
  }
}

// Singleton Instance
export const dataStore = new DataStore()

if (typeof window !== 'undefined') {
  (window as any).dataStore = dataStore
}

// Seed Data
export function seedData() {
  // Admin User
  const admin = dataStore.createUser({
    id: 'user_admin',
    email: 'admin@asc.ch',
    name: 'Admin User',
    role: 'admin',
    password: 'admin123',
    registered: true,
    isActive: true,
    profilePhoto: '/avatars/pascal-staub.png',
  })

  // Leader User
  const leader1 = dataStore.createUser({
    id: 'user_leader1',
    email: 'leader@asc.ch',
    name: 'Max Mustermann',
    role: 'leader',
    password: 'leader123',
    registered: true,
    isActive: true,
  })

  const leader2 = dataStore.createUser({
    id: 'user_leader2',
    email: 'leader2@asc.ch',
    name: 'Anna Schmidt',
    role: 'leader',
    password: 'leader123',
    registered: true,
    isActive: true,
  })

  // Member Users
  const member1 = dataStore.createUser({
    id: 'user_member1',
    email: 'member@asc.ch',
    name: 'Peter Müller',
    role: 'member',
    password: 'member123',
    registered: true,
    isActive: true,
  })

  const member2 = dataStore.createUser({
    id: 'user_member2',
    email: 'member2@asc.ch',
    name: 'Lisa Weber',
    role: 'member',
    password: 'member123',
    registered: true,
    isActive: true,
  })

  // Pascal Staub (User Request)
  const pascal = dataStore.createUser({
    id: 'user_pascal',
    email: 'pascal@asc.ch',
    name: 'Pascal Staub',
    role: 'admin', // Giving admin role as he is the dev/owner
    password: 'password',
    registered: true,
    isActive: true,
  })

  // Sample Tours
  const tour1 = dataStore.createTour({
    id: 'tour_saentis',
    title: 'Skitour auf den Säntis',
    description: 'Schöne Skitour auf den Säntis mit herrlicher Aussicht.',
    date: '2024-01-15',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Säntis',
    peakElevation: 2502,
    ascent: 1800,
    duration: '6 h',
    leaderId: leader1.id,
    maxParticipants: 8,
    gpxFile: '/demo/sample-tour.gpx',
  })

  const tour2 = dataStore.createTour({
    id: 'tour_toggenburg',
    title: 'Wanderung Toggenburg',
    description: 'Gemütliche Wanderung durch das Toggenburg.',
    date: '2024-02-20',
    difficulty: 'T2',
    type: 'Wanderung',
    length: 'Eintagestour',
    peak: 'Chäserrugg',
    peakElevation: 2262,
    ascent: 500,
    duration: '4 h',
    leaderId: leader2.id,
    maxParticipants: 12,
  })

  // Weitere Skitouren in der Ostschweiz
  const tour3 = dataStore.createTour({
    id: 'tour_churfirsten',
    title: 'Skitour auf den Churfirsten',
    description: 'Klassische Skitour auf die Churfirsten mit spektakulärer Aussicht auf den Walensee. Route über die Südflanke.',
    date: '2024-01-20',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Hinterrugg',
    peakElevation: 2306,
    ascent: 1200,
    duration: '5 h',
    leaderId: leader1.id,
    maxParticipants: 6,
  })

  const tour4 = dataStore.createTour({
    id: 'tour_pizol',
    title: 'Pizol Skitour',
    description: 'Beliebte Skitour auf den Pizol. Schöne Aufstiegsroute mit anspruchsvollem Abstieg. Für geübte Skitourengeher.',
    date: '2024-01-25',
    difficulty: 'S',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Pizol',
    peakElevation: 2844,
    ascent: 1100,
    duration: '5.5 h',
    leaderId: leader2.id,
    maxParticipants: 8,
  })

  const tour5 = dataStore.createTour({
    id: 'tour_kronberg',
    title: 'Kronberg Skitour',
    description: 'Genussvolle Skitour auf den Kronberg bei Appenzell. Ideal für Einsteiger und alle, die eine entspannte Tour suchen.',
    date: '2024-01-30',
    difficulty: 'L',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Kronberg',
    peakElevation: 1663,
    ascent: 800,
    duration: '3.5 h',
    leaderId: leader2.id,
    maxParticipants: 10,
  })

  // Future Tour
  const tourFuture = dataStore.createTour({
    id: 'tour_future',
    title: 'Zukunftstour Piz Bernina',
    description: 'Hochtour auf den einzigen Viertausender der Ostalpen.',
    date: '2026-07-15',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Mehrtagestour',
    peak: 'Piz Bernina',
    peakElevation: 4049,
    ascent: 1200,
    duration: '8 h',
    leaderId: leader1.id,
    maxParticipants: 6,
  })

  const tour6 = dataStore.createTour({
    id: 'tour_mattstock',
    title: 'Mattstock Skitour',
    description: 'Abwechslungsreiche Skitour auf den Mattstock im Toggenburg. Schöne Route durch abwechslungsreiches Gelände.',
    date: '2024-03-15',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Mattstock',
    peakElevation: 1936,
    ascent: 950,
    duration: '4.5 h',
    leaderId: leader2.id,
    maxParticipants: 8,
  })

  const tour7 = dataStore.createTour({
    id: 'tour_speer',
    title: 'Speer Skitour',
    description: 'Anspruchsvolle Skitour auf den Speer mit teilweise steilen Passagen. Gute Kondition und Skitechnik erforderlich.',
    date: '2024-03-20',
    difficulty: 'S',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Speer',
    peakElevation: 1950,
    ascent: 1300,
    duration: '6 h',
    leaderId: leader1.id,
    maxParticipants: 6,
  })

  const tour8 = dataStore.createTour({
    id: 'tour_chaeserrugg',
    title: 'Chäserugg Skitour',
    description: 'Klassische Skitour auf den Chäserugg mit herrlicher Aussicht auf die Linthebene und den Zürichsee.',
    date: '2024-03-25',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Chäserrugg',
    peakElevation: 2262,
    ascent: 1050,
    duration: '5 h',
    leaderId: leader2.id,
    maxParticipants: 8,
  })

  const tour9 = dataStore.createTour({
    id: 'tour_selun',
    title: 'Selun Skitour',
    description: 'Genussvolle Skitour auf den Selun im Flumserberg Gebiet. Perfekt für eine entspannte Skitour mit Freunden.',
    date: '2024-04-01',
    difficulty: 'WS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Selun',
    peakElevation: 2205,
    ascent: 700,
    duration: '3.5 h',
    leaderId: leader1.id,
    maxParticipants: 12,
  })

  const tour10 = dataStore.createTour({
    id: 'tour_hochgrat',
    title: 'Hochgrat Skitour',
    description: 'Anspruchsvolle Skitour auf den Hochgrat. Lohnende Aussicht über die gesamte Ostschweiz. Für erfahrene Skitourengeher.',
    date: '2024-04-05',
    difficulty: 'SS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Hochgrat',
    peakElevation: 1834,
    ascent: 1400,
    duration: '6.5 h',
    leaderId: leader2.id,
    maxParticipants: 5,
  })

  const tour11 = dataStore.createTour({
    id: 'tour_gamsberg',
    title: 'Gamsberg Skitour',
    description: 'Schöne Skitour auf den Gamsberg bei Wildhaus. Abwechslungsreiche Route durch Wald und freies Gelände.',
    date: '2024-04-10',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Gamsberg',
    peakElevation: 2385,
    ascent: 880,
    duration: '4.5 h',
    leaderId: leader1.id,
    maxParticipants: 8,
  })

  const tour12 = dataStore.createTour({
    id: 'tour_maegisalp',
    title: 'Mägisalp Skitour',
    description: 'Einfache und genussvolle Skitour zur Mägisalp. Ideal für Einsteiger oder eine entspannte Tagestour.',
    date: '2024-04-15',
    difficulty: 'L',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Mägisalp',
    peakElevation: 1705,
    ascent: 550,
    duration: '3 h',
    leaderId: leader2.id,
    maxParticipants: 15,
  })

  // Skitouren Winter 2025/26
  const tour13 = dataStore.createTour({
    id: 'tour_saentis_2025',
    title: 'Skitour auf den Säntis (Winter 2025)',
    description: 'Klassische Winter-Skitour auf den Säntis. Perfekte Bedingungen für die erste große Tour der Saison.',
    date: '2025-12-20',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Säntis',
    peakElevation: 2502,
    ascent: 1800,
    duration: '6 h',
    leaderId: leader1.id,
    maxParticipants: 8,
    gpxFile: '/demo/sample-tour.gpx',
  })

  const tour14 = dataStore.createTour({
    id: 'tour_altmann',
    title: 'Altmann Skitour',
    description: 'Schöne Skitour auf den Altmann bei Alt St. Johann. Abwechslungsreiche Route mit herrlicher Aussicht.',
    date: '2026-01-10',
    difficulty: 'WS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Altmann',
    peakElevation: 2435,
    ascent: 750,
    duration: '4 h',
    leaderId: leader2.id,
    maxParticipants: 10,
  })

  const tour15 = dataStore.createTour({
    id: 'tour_biberlichopf',
    title: 'Biberlichopf Skitour',
    description: 'Genussvolle Skitour auf den Biberlichopf im Toggenburg. Perfekt für eine entspannte Tagestour mit Freunden.',
    date: '2026-01-25',
    difficulty: 'L',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Biberlichopf',
    peakElevation: 1400,
    ascent: 600,
    duration: '3.5 h',
    leaderId: leader1.id,
    maxParticipants: 12,
  })

  const tour16 = dataStore.createTour({
    id: 'tour_wildhauser',
    title: 'Wildhauser Schafberg Skitour',
    description: 'Beliebte Skitour auf den Wildhauser Schafberg. Schöne Aufstiegsroute mit langem Genussabstieg.',
    date: '2026-02-08',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Wildhauser Schafberg',
    peakElevation: 2373,
    ascent: 900,
    duration: '4.5 h',
    leaderId: leader2.id,
    maxParticipants: 8,
  })

  const tour17 = dataStore.createTour({
    id: 'tour_flumserberg',
    title: 'Flumserberg Überschreitung',
    description: 'Anspruchsvolle Überschreitung im Flumserberg Gebiet. Mehrere Gipfel, lohnende Tour für erfahrene Skitourengeher.',
    date: '2026-02-22',
    difficulty: 'S',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Leistchamm',
    peakElevation: 2101,
    ascent: 1350,
    duration: '6.5 h',
    leaderId: leader1.id,
    maxParticipants: 6,
  })

  const tour18 = dataStore.createTour({
    id: 'tour_hoernli',
    title: 'Hörnli Skitour',
    description: 'Klassische Skitour auf das Hörnli bei Alt St. Johann. Beliebte Route mit guter Schneelage.',
    date: '2026-03-07',
    difficulty: 'WS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Hörnli',
    peakElevation: 1133,
    ascent: 850,
    duration: '4.5 h',
    leaderId: leader2.id,
    maxParticipants: 10,
  })

  const tour19 = dataStore.createTour({
    id: 'tour_schwaegalp',
    title: 'Schwägalp Rundtour',
    description: 'Schöne Rundtour ab Schwägalp. Abwechslungsreiche Route durch verschiedene Geländeformen. Für geübte Skitourengeher.',
    date: '2026-03-21',
    difficulty: 'ZS',
    type: 'Skitour',
    length: 'Eintagestour',
    peak: 'Lütispitz',
    peakElevation: 1987,
    ascent: 1000,
    duration: '5 h',
    leaderId: leader1.id,
    maxParticipants: 8,
  })

  // Touren veröffentlichen
  dataStore.publishTour(tour1.id)
  dataStore.publishTour(tour3.id)
  dataStore.publishTour(tour4.id)
  dataStore.publishTour(tour5.id)
  dataStore.publishTour(tour6.id)
  dataStore.publishTour(tour8.id)
  dataStore.publishTour(tour9.id)
  dataStore.publishTour(tour11.id)
  dataStore.publishTour(tour12.id)
  dataStore.publishTour(tour13.id)
  dataStore.publishTour(tour14.id)
  dataStore.publishTour(tour15.id)
  dataStore.publishTour(tour16.id)
  dataStore.publishTour(tour17.id)
  dataStore.publishTour(tour18.id)
  dataStore.publishTour(tour19.id)

  // Mitglieder für verschiedene Touren anmelden
  dataStore.registerForTour(tour1.id, member1.id)
  dataStore.registerForTour(tour1.id, member2.id)
  dataStore.registerForTour(tour3.id, member1.id)
  dataStore.registerForTour(tour4.id, member2.id)
  dataStore.registerForTour(tour5.id, member1.id)
  dataStore.registerForTour(tour6.id, member2.id)
  dataStore.registerForTour(tour8.id, member1.id)
  dataStore.registerForTour(tour9.id, member2.id)

  return {
    admin,
    leader1,
    leader2,
    member1,
    member2,
    tour1,
    tour2,
    tour3,
    tour4,
    tour5,
    tour6,
    tour7,
    tour8,
    tour9,
    tour10,
    tour11,
    tour12,
    tour13,
    tour14,
    tour15,
    tour16,
    tour17,
    tour18,
    tour19
  }
}

// Seed beim ersten Import (einmalig)
let seeded = false
if (!seeded) {
  seedData()
  seeded = true
}
