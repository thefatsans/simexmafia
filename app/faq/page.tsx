'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { faqData, getFAQsByCategory, searchFAQs, getCategories, getCategoryLabel, FAQ } from '@/data/faq'
import StructuredData from '@/components/StructuredData'

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const filteredFAQs = useMemo(() => {
    if (searchQuery.trim()) {
      return searchFAQs(searchQuery)
    }
    return getFAQsByCategory(selectedCategory)
  }, [selectedCategory, searchQuery])

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const categories = getCategories()

  // Prepare FAQ data for structured data
  const faqStructuredData = useMemo(() => {
    return filteredFAQs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
    }))
  }, [filteredFAQs])

  return (
    <div className="min-h-screen py-12 bg-fortnite-darker">
      <StructuredData type="faq" data={faqStructuredData} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-6">
            <HelpCircle className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Häufig gestellte Fragen</h1>
          <p className="text-xl text-gray-400">
            Finden Sie schnell Antworten auf Ihre Fragen
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Suchen Sie nach einer Frage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setSearchQuery('')
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-fortnite-dark border border-purple-500/30 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-6">
            <p className="text-gray-400">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
            </p>
          </div>
        )}

        {/* FAQ Items */}
        {filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQs.map((faq) => {
              const isOpen = openItems.has(faq.id)
              return (
                <div
                  key={faq.id}
                  className="bg-fortnite-dark border border-purple-500/20 rounded-lg overflow-hidden transition-all hover:border-purple-500/50"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-purple-500/10 transition-colors"
                  >
                    <span className="text-white font-semibold text-lg pr-4">{faq.question}</span>
                    <div className="flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 py-4 border-t border-purple-500/20">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      {faq.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {faq.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-gray-400">
              Versuchen Sie es mit einer anderen Suche oder wählen Sie eine andere Kategorie.
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Haben Sie noch Fragen?</h2>
          <p className="text-gray-400 mb-6">
            Wenn Sie keine Antwort auf Ihre Frage gefunden haben, kontaktieren Sie uns gerne.
          </p>
          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/contact'
            }}
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
          >
            Kontakt aufnehmen
          </a>
        </div>
      </div>
    </div>
  )
}
