export interface NewsletterSubscriber {
  id: string
  email: string
  subscribedAt: string
  status: 'active' | 'unsubscribed'
  source?: string // 'website', 'admin', 'import'
  tags?: string[] // Für Segmentierung
}

export interface NewsletterCampaign {
  id: string
  subject: string
  content: string
  sentAt?: string
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduledFor?: string
  recipientCount: number
  sentCount?: number
  openedCount?: number
  clickedCount?: number
  createdAt: string
  createdBy: string
}

const STORAGE_KEY_SUBSCRIBERS = 'simexmafia-newsletter-subscribers'
const STORAGE_KEY_CAMPAIGNS = 'simexmafia-newsletter-campaigns'

// Mock-Daten für Demo
const mockSubscribers: NewsletterSubscriber[] = [
  {
    id: '1',
    email: 'user1@example.com',
    subscribedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    source: 'website',
    tags: ['gaming', 'deals'],
  },
  {
    id: '2',
    email: 'user2@example.com',
    subscribedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    source: 'website',
    tags: ['gaming'],
  },
  {
    id: '3',
    email: 'user3@example.com',
    subscribedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    source: 'admin',
    tags: ['vip'],
  },
]

// Subscribers Management
export function getSubscribers(): NewsletterSubscriber[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Error loading subscribers:', error)
  }

  // Initialize with mock data if empty
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(mockSubscribers))
    } catch (error) {
      console.error('Error saving mock subscribers:', error)
    }
  }

  return mockSubscribers
}

export function addSubscriber(email: string, source: string = 'website', tags: string[] = []): NewsletterSubscriber {
  const subscribers = getSubscribers()
  
  // Check if already exists
  const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    if (existing.status === 'unsubscribed') {
      // Re-subscribe
      existing.status = 'active'
      existing.subscribedAt = new Date().toISOString()
      saveSubscribers(subscribers)
      return existing
    }
    throw new Error('Email ist bereits abonniert')
  }

  const newSubscriber: NewsletterSubscriber = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase(),
    subscribedAt: new Date().toISOString(),
    status: 'active',
    source,
    tags,
  }

  subscribers.push(newSubscriber)
  saveSubscribers(subscribers)
  return newSubscriber
}

export function removeSubscriber(email: string): boolean {
  const subscribers = getSubscribers()
  const subscriber = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase())
  
  if (!subscriber) return false
  
  subscriber.status = 'unsubscribed'
  saveSubscribers(subscribers)
  return true
}

export function deleteSubscriber(id: string): boolean {
  const subscribers = getSubscribers()
  const filtered = subscribers.filter(s => s.id !== id)
  
  if (filtered.length === subscribers.length) return false
  
  saveSubscribers(filtered)
  return true
}

export function getActiveSubscribers(): NewsletterSubscriber[] {
  return getSubscribers().filter(s => s.status === 'active')
}

export function getSubscriberStats() {
  const subscribers = getSubscribers()
  const active = subscribers.filter(s => s.status === 'active')
  const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed')
  
  // Group by source
  const bySource = subscribers.reduce((acc, sub) => {
    const source = sub.source || 'unknown'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by month
  const byMonth = subscribers.reduce((acc, sub) => {
    const month = new Date(sub.subscribedAt).toISOString().substring(0, 7) // YYYY-MM
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    total: subscribers.length,
    active: active.length,
    unsubscribed: unsubscribed.length,
    bySource,
    byMonth,
  }
}

function saveSubscribers(subscribers: NewsletterSubscriber[]) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(subscribers))
  } catch (error) {
    console.error('Error saving subscribers:', error)
  }
}

// Campaigns Management
export function getCampaigns(): NewsletterCampaign[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CAMPAIGNS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading campaigns:', error)
  }
  
  return []
}

export function createCampaign(campaign: Omit<NewsletterCampaign, 'id' | 'createdAt'>): NewsletterCampaign {
  const newCampaign: NewsletterCampaign = {
    ...campaign,
    id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }

  const campaigns = getCampaigns()
  campaigns.push(newCampaign)
  saveCampaigns(campaigns)
  return newCampaign
}

export function updateCampaign(id: string, updates: Partial<NewsletterCampaign>): boolean {
  const campaigns = getCampaigns()
  const campaign = campaigns.find(c => c.id === id)
  
  if (!campaign) return false
  
  Object.assign(campaign, updates)
  saveCampaigns(campaigns)
  return true
}

export function deleteCampaign(id: string): boolean {
  const campaigns = getCampaigns()
  const filtered = campaigns.filter(c => c.id !== id)
  
  if (filtered.length === campaigns.length) return false
  
  saveCampaigns(filtered)
  return true
}

export async function sendCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
  const campaigns = getCampaigns()
  const campaign = campaigns.find(c => c.id === campaignId)
  
  if (!campaign) {
    return { success: false, message: 'Kampagne nicht gefunden' }
  }

  if (campaign.status === 'sent') {
    return { success: false, message: 'Kampagne wurde bereits versendet' }
  }

  const activeSubscribers = getActiveSubscribers()
  
  // Simuliere Versand
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  campaign.status = 'sent'
  campaign.sentAt = new Date().toISOString()
  campaign.sentCount = activeSubscribers.length
  campaign.openedCount = Math.floor(activeSubscribers.length * 0.35) // 35% Öffnungsrate
  campaign.clickedCount = Math.floor(activeSubscribers.length * 0.12) // 12% Klickrate
  
  saveCampaigns(campaigns)
  
  return {
    success: true,
    message: `Newsletter erfolgreich an ${activeSubscribers.length} Abonnenten versendet`,
  }
}

function saveCampaigns(campaigns: NewsletterCampaign[]) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns))
  } catch (error) {
    console.error('Error saving campaigns:', error)
  }
}













