'use client'

import Link from 'next/link'
import { Youtube, Twitter, Instagram } from 'lucide-react'
import Logo from './Logo'
import NewsletterForm from './NewsletterForm'
import { companyInfo } from '@/lib/company-info'

const footerLinkClass =
  'text-gray-400 dark:text-gray-400 text-gray-600 dark:hover:text-summer-sky-light hover:text-summer-ocean-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer'

const legalLinkClass =
  'text-gray-400 hover:text-summer-sky-light transition-colors text-sm pointer-events-auto relative z-[10002] cursor-pointer'

export default function Footer() {

  return (
    <footer className="bg-fortnite-darker dark:bg-fortnite-darker bg-gray-50 dark:border-summer-sky-light/20 border-gray-200 border-t mt-20 relative z-[9999] pointer-events-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pointer-events-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pointer-events-auto">
          {/* Brand */}
          <div className="col-span-1 pointer-events-auto relative z-[10001]">
            <div className="mb-4 hidden md:block">
              <Logo width={200} height={200} showText={true} />
            </div>
            <div className="mb-4 md:hidden">
              <Logo width={120} height={120} showText={true} />
            </div>
            <p className="text-gray-400 text-sm">
              Ihr vertrauenswürdiger Marktplatz für digitale Gaming-Produkte. Powered by Simex.
            </p>
          </div>

          {/* Quick Links */}
          <div className="pointer-events-auto relative z-[10001]">
            <h4 className="text-white dark:text-white text-gray-900 font-semibold mb-4">Schnelllinks</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className={footerLinkClass}>Alle Produkte</Link></li>
              <li><Link href="/categories" className={footerLinkClass}>Kategorien</Link></li>
              <li><Link href="/sellers" className={footerLinkClass}>Top Verkäufer</Link></li>
              <li><Link href="/about" className={footerLinkClass}>Über uns</Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Kontakt</Link></li>
              <li><Link href="/faq" className={footerLinkClass}>FAQ</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="pointer-events-auto relative z-[10001]">
            <h4 className="text-white dark:text-white text-gray-900 font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/help" className={footerLinkClass}>Hilfe-Center</Link></li>
              <li><Link href="/refunds" className={footerLinkClass}>Rückerstattungsrichtlinie</Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Kontaktieren Sie uns</Link></li>
              <li><Link href="/faq" className={footerLinkClass}>FAQ</Link></li>
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

        <div className="mt-8 pt-8 border-t border-summer-sky-light/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} SimexMafia. Alle Rechte vorbehalten.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link href="/legal/imprint" className={legalLinkClass}>Impressum</Link>
              <Link href="/legal/privacy" className={legalLinkClass}>Datenschutz</Link>
              <Link href="/legal/terms" className={legalLinkClass}>AGB</Link>
              <Link href="/legal/cancellation" className={legalLinkClass}>Widerruf</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

