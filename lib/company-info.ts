// Company information configuration

export const companyInfo = {
  // Company Name
  name: 'SimexMafia',
  legalName: 'SimexMafia Cooperations',
  
  // Address
  address: {
    street: 'Lindenstraße 12',
    city: 'Köln',
    zipCode: '50674',
    country: 'Deutschland',
  },
  
  // Contact Information
  contact: {
    email: 'info@simexmafia.de',
    phone: '+49 (0) 123 456789',
    website: 'www.simexmafia.de',
  },
  
  // Responsible Person (for legal imprint)
  responsiblePerson: {
    name: 'Tim Sand',
    address: {
      street: 'Lindenstraße 12',
      city: 'Köln',
      zipCode: '50674',
      country: 'Deutschland',
    },
  },
  
  // Social Media Links
  socialMedia: {
    youtube: 'https://www.youtube.com/@SimexOG',
    twitter: 'https://x.com/simexyt',
    instagram: 'https://www.instagram.com/_simex_yt/',
  },
  
  // Business Information
  business: {
    taxId: '', // Optional: Add tax ID if required
    vatId: '', // Optional: Add VAT ID if required
    registrationNumber: '', // Optional: Add registration number if required
    registrationCourt: '', // Optional: Add registration court if required
  },
  
  // Legal Information
  legal: {
    // EU Dispute Resolution
    disputeResolution: {
      enabled: true,
      url: 'https://ec.europa.eu/consumers/odr/',
    },
    // Consumer Dispute Resolution
    consumerDisputeResolution: {
      participate: false, // Set to true if you participate
      organization: '', // Name of the organization if participating
    },
  },
  
  // Opening Hours / Öffnungszeiten
  openingHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '', close: '', closed: true },
    // Alternative: You can also use a simple string format
    // simple: 'Montag - Freitag: 9:00 - 18:00 Uhr\nSamstag: 10:00 - 16:00 Uhr\nSonntag: Geschlossen'
  },
}

// Helper function to get full address as string
export function getFullAddress(): string {
  return `${companyInfo.address.street}, ${companyInfo.address.zipCode} ${companyInfo.address.city}, ${companyInfo.address.country}`
}

// Helper function to get responsible person's full address
export function getResponsiblePersonAddress(): string {
  return `${companyInfo.responsiblePerson.address.street}, ${companyInfo.responsiblePerson.address.zipCode} ${companyInfo.responsiblePerson.address.city}, ${companyInfo.responsiblePerson.address.country}`
}

// Helper function to format opening hours
export function getOpeningHoursFormatted(): string[] {
  const days = [
    { key: 'monday', label: 'Montag' },
    { key: 'tuesday', label: 'Dienstag' },
    { key: 'wednesday', label: 'Mittwoch' },
    { key: 'thursday', label: 'Donnerstag' },
    { key: 'friday', label: 'Freitag' },
    { key: 'saturday', label: 'Samstag' },
    { key: 'sunday', label: 'Sonntag' },
  ]
  
  return days.map(day => {
    const hours = companyInfo.openingHours[day.key as keyof typeof companyInfo.openingHours]
    if (hours.closed) {
      return `${day.label}: Geschlossen`
    }
    return `${day.label}: ${hours.open} - ${hours.close} Uhr`
  })
}

