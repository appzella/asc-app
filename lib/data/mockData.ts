import { User, Tour, Invitation, TourSettings, TourType, TourLength, Difficulty } from '../types'

// In-Memory Datenspeicher
class DataStore {
  private users: User[] = []
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
    return this.users.map(({ password, ...user }) => user) // Passwort entfernen
  }

  getUserById(id: string): User | undefined {
    const user = this.users.find((u) => u.id === id)
    if (!user) return undefined
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email)
  }

  createUser(user: Omit<User, 'id' | 'createdAt'> & { id?: string }): User {
    const newUser: User = {
      ...user,
      id: user.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      active: user.active !== undefined ? user.active : true,
      createdAt: new Date(),
    }
    this.users.push(newUser)
    return newUser
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    this.users[index] = { ...this.users[index], ...updates }
    const { password, ...userWithoutPassword } = this.users[index]
    return userWithoutPassword
  }

  // Auth
  login(email: string, password: string): User | null {
    const user = this.users.find((u) => u.email === email && u.password === password)
    if (user && user.registered && user.active) {
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
    const { password, ...userWithoutPassword } = this.currentUser
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
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedForPublishing: false,
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
      pendingChanges: undefined,
      updatedAt: new Date(),
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
      submittedForPublishing: false,
      updatedAt: new Date(),
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
      submittedForPublishing: false,
      updatedAt: new Date(),
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
      submittedForPublishing: false,
      updatedAt: new Date(),
    }

    return this.getTourById(id)!
  }

  registerForTour(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    // Only allow registration for published tours (not draft, cancelled, etc.)
    if (!tour || tour.status !== 'published') return false
    if (tour.participants.includes(userId) || tour.waitlist.includes(userId)) return false

    // Wenn Tour voll ist, zur Warteliste hinzufügen
    if (tour.participants.length >= tour.maxParticipants) {
      tour.waitlist.push(userId)
      return true
    }

    tour.participants.push(userId)
    return true
  }

  unregisterFromTour(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false

    const index = tour.participants.indexOf(userId)
    if (index === -1) return false

    tour.participants.splice(index, 1)

    // Automatisches Nachrücken: Wenn noch Platz unter maxParticipants und Warteliste vorhanden
    if (tour.participants.length < tour.maxParticipants && tour.waitlist.length > 0) {
      const firstWaitlistUserId = tour.waitlist.shift()!
      tour.participants.push(firstWaitlistUserId)
    }

    return true
  }

  addToWaitlist(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false
    if (tour.waitlist.includes(userId) || tour.participants.includes(userId)) return false

    tour.waitlist.push(userId)
    return true
  }

  removeFromWaitlist(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false

    const index = tour.waitlist.indexOf(userId)
    if (index === -1) return false

    tour.waitlist.splice(index, 1)
    return true
  }

  getWaitlistByTourId(tourId: string): User[] {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return []

    return tour.waitlist
      .map((userId) => this.getUserById(userId))
      .filter((user): user is User => user !== undefined)
  }

  promoteFromWaitlist(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour) return false

    const waitlistIndex = tour.waitlist.indexOf(userId)
    if (waitlistIndex === -1) return false

    // Entferne von Warteliste
    tour.waitlist.splice(waitlistIndex, 1)

    // Füge als Teilnehmer hinzu (auch wenn Tour bereits voll ist)
    tour.participants.push(userId)
    return true
  }

  addParticipantManually(tourId: string, userId: string): boolean {
    const tour = this.tours.find((t) => t.id === tourId)
    if (!tour || tour.status !== 'published') return false

    // Prüfe ob bereits Teilnehmer
    if (tour.participants.includes(userId)) return false

    // Prüfe ob auf Warteliste - wenn ja, entferne von dort
    const waitlistIndex = tour.waitlist.indexOf(userId)
    if (waitlistIndex !== -1) {
      tour.waitlist.splice(waitlistIndex, 1)
    }

    // Füge als Teilnehmer hinzu (auch wenn Tour bereits voll ist)
    tour.participants.push(userId)
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
      createdAt: new Date(),
      used: false,
    }
    this.invitations.push(invitation)

    // User-Account erstellen (noch nicht registriert)
    this.createUser({
      email,
      name: '', // Wird bei Registrierung ausgefüllt
      role: 'member',
      registered: false,
      active: true,
      registrationToken: token,
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
    invitation.usedAt = new Date()

    const updatedUser = this.updateUser(user.id, {
      name,
      password,
      registered: true,
      registrationToken: undefined,
    })

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
      if (tour.tourType === oldName) {
        tour.tourType = newName.trim() as TourType
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
      if (tour.tourLength === oldName) {
        tour.tourLength = newName.trim() as TourLength
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
    if (!this.settings.difficulties[tourType]) {
      this.settings.difficulties[tourType] = []
    }
    this.settings.difficulties[tourType] = orderedDifficulties
  }

  addDifficulty(tourType: string, difficulty: string): boolean {
    if (!this.settings.difficulties[tourType]) {
      this.settings.difficulties[tourType] = []
    }
    if (this.settings.difficulties[tourType].includes(difficulty)) return false
    this.settings.difficulties[tourType].push(difficulty)
    return true
  }

  removeDifficulty(tourType: string, difficulty: string): boolean {
    if (!this.settings.difficulties[tourType]) return false
    const index = this.settings.difficulties[tourType].indexOf(difficulty)
    if (index === -1) return false
    this.settings.difficulties[tourType].splice(index, 1)
    return true
  }

  renameDifficulty(tourType: string, oldName: string, newName: string): boolean {
    if (!newName.trim() || oldName === newName) return false
    if (!this.settings.difficulties[tourType]) return false
    const index = this.settings.difficulties[tourType].indexOf(oldName)
    if (index === -1) return false
    if (this.settings.difficulties[tourType].includes(newName.trim())) return false // Already exists

    this.settings.difficulties[tourType][index] = newName.trim()

    // Update all tours that use this difficulty for this tour type
    this.tours.forEach(tour => {
      if (tour.tourType === tourType && tour.difficulty === oldName) {
        tour.difficulty = newName.trim() as Difficulty
      }
    })

    return true
  }

  getDifficultiesForTourType(tourType: string): string[] {
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
    active: true,
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
    active: true,
  })

  const leader2 = dataStore.createUser({
    id: 'user_leader2',
    email: 'leader2@asc.ch',
    name: 'Anna Schmidt',
    role: 'leader',
    password: 'leader123',
    registered: true,
    active: true,
  })

  // Member Users
  const member1 = dataStore.createUser({
    id: 'user_member1',
    email: 'member@asc.ch',
    name: 'Peter Müller',
    role: 'member',
    password: 'member123',
    registered: true,
    active: true,
  })

  const member2 = dataStore.createUser({
    id: 'user_member2',
    email: 'member2@asc.ch',
    name: 'Lisa Weber',
    role: 'member',
    password: 'member123',
    registered: true,
    active: true,
  })

  // Pascal Staub (User Request)
  const pascal = dataStore.createUser({
    id: 'user_pascal',
    email: 'pascal@asc.ch',
    name: 'Pascal Staub',
    role: 'admin', // Giving admin role as he is the dev/owner
    password: 'password',
    registered: true,
    active: true,
  })

  // Sample Tours
  const tour1 = dataStore.createTour({
    id: 'tour_saentis',
    title: 'Skitour auf den Säntis',
    description: 'Schöne Skitour auf den Säntis mit herrlicher Aussicht.',
    date: new Date('2024-01-15'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Säntis',
    peakElevation: 2502,
    elevation: 1800,
    duration: 6,
    leaderId: leader1.id,
    maxParticipants: 8,
    createdBy: leader1.id,
    gpxFile: '/demo/sample-tour.gpx',
  })

  const tour2 = dataStore.createTour({
    id: 'tour_toggenburg',
    title: 'Wanderung Toggenburg',
    description: 'Gemütliche Wanderung durch das Toggenburg.',
    date: new Date('2024-02-20'),
    difficulty: 'T2',
    tourType: 'Wanderung',
    tourLength: 'Eintagestour',
    peak: 'Chäserrugg',
    peakElevation: 2262,
    elevation: 500,
    duration: 4,
    leaderId: leader2.id,
    maxParticipants: 12,
    createdBy: leader2.id,
  })

  // Weitere Skitouren in der Ostschweiz
  const tour3 = dataStore.createTour({
    id: 'tour_churfirsten',
    title: 'Skitour auf den Churfirsten',
    description: 'Klassische Skitour auf die Churfirsten mit spektakulärer Aussicht auf den Walensee. Route über die Südflanke.',
    date: new Date('2024-01-20'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Hinterrugg',
    peakElevation: 2306,
    elevation: 1200,
    duration: 5,
    leaderId: leader1.id,
    maxParticipants: 6,
    createdBy: leader1.id,
  })

  const tour4 = dataStore.createTour({
    id: 'tour_pizol',
    title: 'Pizol Skitour',
    description: 'Beliebte Skitour auf den Pizol. Schöne Aufstiegsroute mit anspruchsvollem Abstieg. Für geübte Skitourengeher.',
    date: new Date('2024-01-25'),
    difficulty: 'S',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Pizol',
    peakElevation: 2844,
    elevation: 1100,
    duration: 5.5,
    leaderId: leader2.id,
    maxParticipants: 8,
    createdBy: leader2.id,
  })

  const tour5 = dataStore.createTour({
    id: 'tour_kronberg',
    title: 'Kronberg Skitour',
    description: 'Genussvolle Skitour auf den Kronberg bei Appenzell. Ideal für Einsteiger und alle, die eine entspannte Tour suchen.',
    date: new Date('2024-01-30'),
    difficulty: 'L',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Kronberg',
    peakElevation: 1663,
    elevation: 800,
    duration: 3.5,
    leaderId: leader2.id,
    maxParticipants: 10,
    createdBy: leader2.id,
  })

  // Future Tour
  const tourFuture = dataStore.createTour({
    id: 'tour_future',
    title: 'Zukunftstour Piz Bernina',
    description: 'Hochtour auf den einzigen Viertausender der Ostalpen.',
    date: new Date('2026-07-15'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Mehrtagestour',
    peak: 'Piz Bernina',
    peakElevation: 4049,
    elevation: 1200,
    duration: 8,
    leaderId: leader1.id,
    maxParticipants: 6,
    createdBy: leader1.id,
  })

  const tour6 = dataStore.createTour({
    id: 'tour_mattstock',
    title: 'Mattstock Skitour',
    description: 'Abwechslungsreiche Skitour auf den Mattstock im Toggenburg. Schöne Route durch abwechslungsreiches Gelände.',
    date: new Date('2024-03-15'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Mattstock',
    peakElevation: 1936,
    elevation: 950,
    duration: 4.5,
    leaderId: leader2.id,
    maxParticipants: 8,
    createdBy: leader2.id,
  })

  const tour7 = dataStore.createTour({
    id: 'tour_speer',
    title: 'Speer Skitour',
    description: 'Anspruchsvolle Skitour auf den Speer mit teilweise steilen Passagen. Gute Kondition und Skitechnik erforderlich.',
    date: new Date('2024-03-20'),
    difficulty: 'S',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Speer',
    peakElevation: 1950,
    elevation: 1300,
    duration: 6,
    leaderId: leader1.id,
    maxParticipants: 6,
    createdBy: leader1.id,
  })

  const tour8 = dataStore.createTour({
    id: 'tour_chaeserrugg',
    title: 'Chäserugg Skitour',
    description: 'Klassische Skitour auf den Chäserugg mit herrlicher Aussicht auf die Linthebene und den Zürichsee.',
    date: new Date('2024-03-25'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Chäserrugg',
    peakElevation: 2262,
    elevation: 1050,
    duration: 5,
    leaderId: leader2.id,
    maxParticipants: 8,
    createdBy: leader2.id,
  })

  const tour9 = dataStore.createTour({
    id: 'tour_selun',
    title: 'Selun Skitour',
    description: 'Genussvolle Skitour auf den Selun im Flumserberg Gebiet. Perfekt für eine entspannte Skitour mit Freunden.',
    date: new Date('2024-04-01'),
    difficulty: 'WS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Selun',
    peakElevation: 2205,
    elevation: 700,
    duration: 3.5,
    leaderId: leader1.id,
    maxParticipants: 12,
    createdBy: leader1.id,
  })

  const tour10 = dataStore.createTour({
    id: 'tour_hochgrat',
    title: 'Hochgrat Skitour',
    description: 'Anspruchsvolle Skitour auf den Hochgrat. Lohnende Aussicht über die gesamte Ostschweiz. Für erfahrene Skitourengeher.',
    date: new Date('2024-04-05'),
    difficulty: 'SS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Hochgrat',
    peakElevation: 1834,
    elevation: 1400,
    duration: 6.5,
    leaderId: leader2.id,
    maxParticipants: 5,
    createdBy: leader2.id,
  })

  const tour11 = dataStore.createTour({
    id: 'tour_gamsberg',
    title: 'Gamsberg Skitour',
    description: 'Schöne Skitour auf den Gamsberg bei Wildhaus. Abwechslungsreiche Route durch Wald und freies Gelände.',
    date: new Date('2024-04-10'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Gamsberg',
    peakElevation: 2385,
    elevation: 880,
    duration: 4.5,
    leaderId: leader1.id,
    maxParticipants: 8,
    createdBy: leader1.id,
  })

  const tour12 = dataStore.createTour({
    id: 'tour_maegisalp',
    title: 'Mägisalp Skitour',
    description: 'Einfache und genussvolle Skitour zur Mägisalp. Ideal für Einsteiger oder eine entspannte Tagestour.',
    date: new Date('2024-04-15'),
    difficulty: 'L',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Mägisalp',
    peakElevation: 1705,
    elevation: 550,
    duration: 3,
    leaderId: leader2.id,
    maxParticipants: 15,
    createdBy: leader2.id,
  })

  // Skitouren Winter 2025/26
  const tour13 = dataStore.createTour({
    id: 'tour_saentis_2025',
    title: 'Skitour auf den Säntis (Winter 2025)',
    description: 'Klassische Winter-Skitour auf den Säntis. Perfekte Bedingungen für die erste große Tour der Saison.',
    date: new Date('2025-12-20'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Säntis',
    peakElevation: 2502,
    elevation: 1800,
    duration: 6,
    leaderId: leader1.id,
    maxParticipants: 8,
    createdBy: leader1.id,
    gpxFile: '/demo/sample-tour.gpx',
  })

  const tour14 = dataStore.createTour({
    id: 'tour_altmann',
    title: 'Altmann Skitour',
    description: 'Schöne Skitour auf den Altmann bei Alt St. Johann. Abwechslungsreiche Route mit herrlicher Aussicht.',
    date: new Date('2026-01-10'),
    difficulty: 'WS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Altmann',
    peakElevation: 2435,
    elevation: 750,
    duration: 4,
    leaderId: leader2.id,
    maxParticipants: 10,
    createdBy: leader2.id,
  })

  const tour15 = dataStore.createTour({
    id: 'tour_biberlichopf',
    title: 'Biberlichopf Skitour',
    description: 'Genussvolle Skitour auf den Biberlichopf im Toggenburg. Perfekt für eine entspannte Tagestour mit Freunden.',
    date: new Date('2026-01-25'),
    difficulty: 'L',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Biberlichopf',
    peakElevation: 1400,
    elevation: 600,
    duration: 3.5,
    leaderId: leader1.id,
    maxParticipants: 12,
    createdBy: leader1.id,
  })

  const tour16 = dataStore.createTour({
    id: 'tour_wildhauser',
    title: 'Wildhauser Schafberg Skitour',
    description: 'Beliebte Skitour auf den Wildhauser Schafberg. Schöne Aufstiegsroute mit langem Genussabstieg.',
    date: new Date('2026-02-08'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Wildhauser Schafberg',
    peakElevation: 2373,
    elevation: 900,
    duration: 4.5,
    leaderId: leader2.id,
    maxParticipants: 8,
    createdBy: leader2.id,
  })

  const tour17 = dataStore.createTour({
    id: 'tour_flumserberg',
    title: 'Flumserberg Überschreitung',
    description: 'Anspruchsvolle Überschreitung im Flumserberg Gebiet. Mehrere Gipfel, lohnende Tour für erfahrene Skitourengeher.',
    date: new Date('2026-02-22'),
    difficulty: 'S',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Leistchamm',
    peakElevation: 2101,
    elevation: 1350,
    duration: 6.5,
    leaderId: leader1.id,
    maxParticipants: 6,
    createdBy: leader1.id,
  })

  const tour18 = dataStore.createTour({
    id: 'tour_hoernli',
    title: 'Hörnli Skitour',
    description: 'Klassische Skitour auf das Hörnli bei Alt St. Johann. Beliebte Route mit guter Schneelage.',
    date: new Date('2026-03-07'),
    difficulty: 'WS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Hörnli',
    peakElevation: 1133,
    elevation: 850,
    duration: 4.5,
    leaderId: leader2.id,
    maxParticipants: 10,
    createdBy: leader2.id,
  })

  const tour19 = dataStore.createTour({
    id: 'tour_schwaegalp',
    title: 'Schwägalp Rundtour',
    description: 'Schöne Rundtour ab Schwägalp. Abwechslungsreiche Route durch verschiedene Geländeformen. Für geübte Skitourengeher.',
    date: new Date('2026-03-21'),
    difficulty: 'ZS',
    tourType: 'Skitour',
    tourLength: 'Eintagestour',
    peak: 'Lütispitz',
    peakElevation: 1987,
    elevation: 1000,
    duration: 5,
    leaderId: leader1.id,
    maxParticipants: 8,
    createdBy: leader1.id,
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

