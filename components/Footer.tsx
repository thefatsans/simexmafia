'use client'

import { Youtube, Twitter, Instagram } from 'lucide-react'
import Logo from './Logo'
import NewsletterForm from './NewsletterForm'
import { companyInfo } from '@/lib/company-info'

export default function Footer() {

  return (
    <footer className="bg-fortnite-darker dark:bg-fortnite-darker bg-gray-50 dark:border-winter-ice/20 border-gray-200 border-t mt-20 relative z-[9999] pointer-events-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pointer-events-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pointer-events-auto">
          {/* Brand */}
          <div className="col-span-1 pointer-events-auto relative z-[10001]">
            <div className="mb-4">
              <Logo width={200} height={200} showText={true} />
            </div>
            <p className="text-gray-400 text-sm">
              Ihr vertrauenswürdiger Marktplatz für digitale Gaming-Produkte. Powered by Simex.
            </p>
          </div>

          {/* Quick Links */}
          <div className="pointer-events-auto relative z-[10001]">
            <h4 className="text-white dark:text-white text-gray-900 font-semibold mb-4">Schnelllinks</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/products" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/products'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Alle Produkte
                </a>
              </li>
              <li>
                <a 
                  href="/categories" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/categories'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Kategorien
                </a>
              </li>
              <li>
                <a 
                  href="/sellers" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/sellers'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Top Verkäufer
                </a>
              </li>
              <li>
                <a 
                  href="/about" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/about'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Über uns
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/contact'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Kontakt
                </a>
              </li>
              <li>
                <a 
                  href="/faq" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/faq'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="pointer-events-auto relative z-[10001]">
            <h4 className="text-white dark:text-white text-gray-900 font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/help" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/help'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Hilfe-Center
                </a>
              </li>
              <li>
                <a 
                  href="/refunds" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/refunds'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Rückerstattungsrichtlinie
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/contact'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  Kontaktieren Sie uns
                </a>
              </li>
              <li>
                <a 
                  href="/faq" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = '/faq'
                  }}
                  className="text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-winter-ice hover:text-winter-blue-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white dark:text-white text-gray-900 font-semibold mb-4">Newsletter</h4>
            <NewsletterForm variant="compact" showTitle={false} />
            <div className="mt-4">
              <h5 className="text-white font-semibold mb-3 text-sm">Simex folgen</h5>
              <div className="flex space-x-4">
                {companyInfo.socialMedia.youtube && (
                  <a
                    href={companyInfo.socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Youtube className="w-6 h-6" />
                  </a>
                )}
                {companyInfo.socialMedia.twitter && (
                  <a
                    href={companyInfo.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Twitter className="w-6 h-6" />
                  </a>
                )}
                {companyInfo.socialMedia.instagram && (
                  <a
                    href={companyInfo.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-winter-ice/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} SimexMafia. Alle Rechte vorbehalten.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <a
                href="/legal/imprint"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/legal/imprint'
                }}
                className="text-gray-400 hover:text-winter-ice transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
              >
                Impressum
              </a>
              <a
                href="/legal/privacy"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/legal/privacy'
                }}
                className="text-gray-400 hover:text-winter-ice transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
              >
                Datenschutz
              </a>
              <a
                href="/legal/terms"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/legal/terms'
                }}
                className="text-gray-400 hover:text-winter-ice transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
              >
                AGB
              </a>
              <a
                href="/legal/cancellation"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = '/legal/cancellation'
                }}
                className="text-gray-400 hover:text-winter-ice transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer"
              >
                Widerruf
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

