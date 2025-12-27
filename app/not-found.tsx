'use client'

import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fortnite-darker px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-500/20 rounded-full mb-6">
            <FileQuestion className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-6xl sm:text-9xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Seite nicht gefunden</h2>
          <p className="text-gray-400 mb-8">
            Die gesuchte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/'
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            <span>Zur Startseite</span>
          </a>
          <a
            href="/products"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/products'
            }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-fortnite-dark border-2 border-purple-500/50 hover:border-purple-500 text-white font-semibold rounded-lg transition-all"
          >
            <Search className="w-5 h-5" />
            <span>Produkte durchsuchen</span>
          </a>
        </div>

        <div className="p-6 bg-fortnite-dark border border-purple-500/20 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Mögliche Ursachen:</h3>
          <ul className="text-gray-400 text-sm text-left space-y-1">
            <li>• Die URL wurde falsch eingegeben</li>
            <li>• Die Seite wurde verschoben oder gelöscht</li>
            <li>• Der Link ist veraltet</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


