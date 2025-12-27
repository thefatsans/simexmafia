'use client'

import { useState, FormEvent } from 'react'
import { Mail, Phone, MapPin, Send, MessageSquare, HelpCircle, ShoppingBag, CreditCard, User } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { companyInfo, getFullAddress, getOpeningHoursFormatted } from '@/lib/company-info'

type ContactCategory = 'general' | 'order' | 'payment' | 'account' | 'product' | 'technical' | 'refund'

interface ContactFormData {
  name: string
  email: string
  category: ContactCategory
  subject: string
  message: string
}

const categoryOptions: { value: ContactCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'general', label: 'Allgemeine Anfrage', icon: <HelpCircle className="w-5 h-5" /> },
  { value: 'order', label: 'Bestellung', icon: <ShoppingBag className="w-5 h-5" /> },
  { value: 'payment', label: 'Zahlung', icon: <CreditCard className="w-5 h-5" /> },
  { value: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
  { value: 'product', label: 'Produkt', icon: <MessageSquare className="w-5 h-5" /> },
  { value: 'technical', label: 'Technisches Problem', icon: <HelpCircle className="w-5 h-5" /> },
  { value: 'refund', label: 'Rückerstattung', icon: <CreditCard className="w-5 h-5" /> },
]

export default function ContactPage() {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail-Adresse ist erforderlich'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-Mail-Adresse ist ungültig'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Betreff ist erforderlich'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Nachricht ist erforderlich'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Nachricht muss mindestens 10 Zeichen lang sein'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showError('Bitte füllen Sie alle Felder korrekt aus')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Save contact request to localStorage (for demo purposes)
    try {
      const requests = JSON.parse(localStorage.getItem('simexmafia-contact-requests') || '[]')
      requests.push({
        ...formData,
        id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      })
      localStorage.setItem('simexmafia-contact-requests', JSON.stringify(requests))
    } catch (error) {
      console.error('Error saving contact request:', error)
    }

    setIsSubmitting(false)

    // Show success message
    showSuccess('Ihre Nachricht wurde erfolgreich gesendet! Wir werden uns schnellstmöglich bei Ihnen melden.')

    // Reset form
    setFormData({
      name: '',
      email: '',
      category: 'general',
      subject: '',
      message: '',
    })
    setErrors({})
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="min-h-screen py-12 bg-fortnite-darker">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <Mail className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Kontaktieren Sie uns</h1>
          <p className="text-xl text-gray-400">
            Wir helfen Ihnen gerne weiter. Senden Sie uns eine Nachricht und wir melden uns schnellstmöglich.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Kontaktinformationen</h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">E-Mail</h3>
                    <a
                      href={`mailto:${companyInfo.contact.email}`}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {companyInfo.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Telefon</h3>
                    <a
                      href={`tel:${companyInfo.contact.phone.replace(/\s/g, '')}`}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {companyInfo.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Adresse</h3>
                    <p className="text-gray-400">
                      {companyInfo.address.street}<br />
                      {companyInfo.address.zipCode} {companyInfo.address.city}<br />
                      {companyInfo.address.country}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-purple-500/20">
                <h3 className="text-white font-semibold mb-3">Öffnungszeiten</h3>
                <div className="text-gray-400 space-y-1 text-sm">
                  {getOpeningHoursFormatted().map((hours, index) => (
                    <p key={index}>{hours}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Nachricht senden</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.name ? 'border-red-500' : 'border-purple-500/30'
                    }`}
                    placeholder="Ihr Name"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.email ? 'border-red-500' : 'border-purple-500/30'
                    }`}
                    placeholder="ihre.email@beispiel.de"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorie *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Betreff *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.subject ? 'border-red-500' : 'border-purple-500/30'
                    }`}
                    placeholder="Betreff Ihrer Nachricht"
                  />
                  {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Nachricht *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 bg-fortnite-darker border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      errors.message ? 'border-red-500' : 'border-purple-500/30'
                    }`}
                    placeholder="Ihre Nachricht..."
                  />
                  {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Wird gesendet...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Nachricht senden</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
