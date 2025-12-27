export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'moderator'
  createdAt: string
}

// Mock admin users
export const adminUsers: AdminUser[] = [
  {
    id: 'admin1',
    email: 'admin@simexmafia.de',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01',
  },
]

// Check if user is admin (simple check - in production, this would be more secure)
export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false
  
  const emailLower = email.toLowerCase()
  console.log('Checking admin access for:', emailLower)
  
  // For demo: Allow admin@simexmafia.de or any email containing 'admin' or 'test'
  const isAdminUser = adminUsers.some(admin => admin.email.toLowerCase() === emailLower) || 
         emailLower.includes('admin') ||
         emailLower === 'admin@simexmafia.de' ||
         emailLower === 'test@example.com' // Also allow the test user for demo
  
  console.log('Admin check result:', isAdminUser)
  return isAdminUser
}

// Get admin user by email
export const getAdminByEmail = (email: string): AdminUser | undefined => {
  return adminUsers.find(admin => admin.email === email)
}

