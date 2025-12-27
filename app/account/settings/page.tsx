'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, Shield, Globe } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    orderUpdates: true,
    language: 'en',
    currency: 'EUR',
  })

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-400 text-sm">Receive email updates about your account</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-12 h-6 bg-fortnite-darker rounded-full appearance-none checked:bg-purple-500 relative cursor-pointer transition-colors"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Marketing Emails</p>
                <p className="text-gray-400 text-sm">Receive emails about deals and promotions</p>
              </div>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(e) => setSettings({ ...settings, marketingEmails: e.target.checked })}
                className="w-12 h-6 bg-fortnite-darker rounded-full appearance-none checked:bg-purple-500 relative cursor-pointer transition-colors"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Order Updates</p>
                <p className="text-gray-400 text-sm">Get notified when your order status changes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={(e) => setSettings({ ...settings, orderUpdates: e.target.checked })}
                className="w-12 h-6 bg-fortnite-darker rounded-full appearance-none checked:bg-purple-500 relative cursor-pointer transition-colors"
              />
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Preferences</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Security</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full bg-fortnite-darker border border-purple-500/30 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-left">
              <span>Change Password</span>
            </button>
            <button className="w-full bg-fortnite-darker border border-purple-500/30 hover:border-purple-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-left">
              <span>Two-Factor Authentication</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}








