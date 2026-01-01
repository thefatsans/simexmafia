/**
 * Liste von Mitarbeiter-Namen für den Chat
 * Diese werden zufällig ausgewählt, um den Eindruck echter Mitarbeiter zu erwecken
 */
export const staffNames = [
  'Max',
  'Sarah',
  'Tom',
  'Lisa',
  'David',
  'Anna',
  'Felix',
  'Julia',
  'Niklas',
  'Sophie',
  'Lukas',
  'Emma',
  'Ben',
  'Mia',
  'Jonas',
  'Hannah',
  'Noah',
  'Lea',
  'Finn',
  'Laura',
]

/**
 * Wählt einen zufälligen Mitarbeiter-Namen aus
 */
export function getRandomStaffName(): string {
  return staffNames[Math.floor(Math.random() * staffNames.length)]
}

/**
 * Speichert den aktuellen Mitarbeiter-Namen für die Session
 */
export function getCurrentStaffName(): string {
  if (typeof window === 'undefined') return 'Max'
  
  const stored = sessionStorage.getItem('simexmafia-current-staff')
  if (stored) return stored
  
  const newName = getRandomStaffName()
  sessionStorage.setItem('simexmafia-current-staff', newName)
  return newName
}













