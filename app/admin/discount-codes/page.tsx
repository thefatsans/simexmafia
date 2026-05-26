'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/data/admin'
import { Plus, Trash2, Tag, Edit, X, RefreshCw, Search } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import AdminLoading from '@/components/admin/AdminLoading'

interface AdminDiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  description: string | null
  minAmount: number | null
  maxDiscount: number | null
  validFrom: string
  validUntil: string | null
  usageLimit: number | null
  usageCount: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface FormState {
  code: string
  type: 'percentage' | 'fixed'
  value: string
  description: string
  minAmount: string
  maxDiscount: string
  validFrom: string
  validUntil: string
  usageLimit: string
  active: boolean
}

const emptyForm: FormState = {
  code: '',
  type: 'percentage',
  value: '',
  description: '',
  minAmount: '',
  maxDiscount: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  usageLimit: '',
  active: true,
}

export default function AdminDiscountCodesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()
  const [codes, setCodes] = useState<AdminDiscountCode[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminDiscountCode | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (!isAdmin(user.email)) {
      router.push('/account')
      return
    }
    setIsLoading(false)
  }, [user, router, authLoading])

  const loadCodes = useCallback(async () => {
    if (!user || !isAdmin(user.email)) return
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('q', debouncedSearch)
      const res = await fetch(`/api/admin/discount-codes?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      const data = await res.json()
      setCodes(data.codes || [])
    } catch (err) {
      console.error('[Admin DiscountCodes]', err)
      showError(err instanceof Error ? err.message : 'Codes konnten nicht geladen werden')
      setCodes([])
    } finally {
      setIsRefreshing(false)
    }
  }, [user, debouncedSearch, showError])

  useEffect(() => {
    if (!authLoading && user && isAdmin(user.email)) {
      loadCodes()
    }
  }, [authLoading, user, loadCodes])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (code: AdminDiscountCode) => {
    setEditing(code)
    setForm({
      code: code.code,
      type: code.type,
      value: code.value.toString(),
      description: code.description || '',
      minAmount: code.minAmount != null ? code.minAmount.toString() : '',
      maxDiscount: code.maxDiscount != null ? code.maxDiscount.toString() : '',
      validFrom: code.validFrom.slice(0, 10),
      validUntil: code.validUntil ? code.validUntil.slice(0, 10) : '',
      usageLimit: code.usageLimit != null ? code.usageLimit.toString() : '',
      active: code.active,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.value.trim()) {
      showError('Code und Wert sind erforderlich')
      return
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      description: form.description.trim() || null,
      minAmount: form.minAmount.trim() ? Number(form.minAmount) : null,
      maxDiscount: form.maxDiscount.trim() ? Number(form.maxDiscount) : null,
      validFrom: form.validFrom || new Date().toISOString().slice(0, 10),
      validUntil: form.validUntil || null,
      usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
      active: form.active,
    }

    setIsSaving(true)
    try {
      const url = editing
        ? `/api/admin/discount-codes/${editing.id}`
        : '/api/admin/discount-codes'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showError(data.error || `Fehler ${res.status}`)
        return
      }

      showSuccess(editing ? 'Code aktualisiert' : 'Code angelegt')
      closeForm()
      await loadCodes()
    } catch (err) {
      console.error(err)
      showError('Speichern fehlgeschlagen')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (code: AdminDiscountCode) => {
    if (!confirm(`Code "${code.code}" wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/admin/discount-codes/${code.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      showSuccess('Code gelöscht')
      await loadCodes()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  const toggleActive = async (code: AdminDiscountCode) => {
    try {
      const res = await fetch(`/api/admin/discount-codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !code.active }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fehler ${res.status}`)
      }
      await loadCodes()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
    }
  }

  if (isLoading || authLoading) {
    return <AdminLoading label="Rabattcodes werden geladen..." />
  }

  if (!user || !isAdmin(user.email)) {
    return null
  }

  return (
    <div className="min-h-screen bg-fortnite-darker py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Rabattcode-Verwaltung</h1>
            <p className="text-gray-400 mt-1">{codes.length} Codes</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadCodes()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fortnite-dark border border-purple-500/30 text-white rounded-lg hover:border-purple-500/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Neuer Code
            </button>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Nach Code oder Beschreibung suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-fortnite-dark border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {codes.length === 0 && !isRefreshing ? (
          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-8 text-center">
            <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {debouncedSearch ? 'Keine Codes für diese Suche.' : 'Noch keine Rabattcodes angelegt.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {codes.map((code) => (
              <div
                key={code.id}
                className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-bold text-lg">{code.code}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(code)}
                      className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(code)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Typ:</span>{' '}
                    {code.type === 'percentage' ? 'Prozent' : 'Fester Betrag'}
                  </p>
                  <p className="text-white font-semibold text-lg">
                    {code.type === 'percentage' ? `${code.value}%` : `€${code.value.toFixed(2)}`}
                  </p>
                  {code.description && <p className="text-gray-400">{code.description}</p>}
                  {code.minAmount != null && (
                    <p className="text-gray-400">
                      Mindestbestellwert: €{code.minAmount.toFixed(2)}
                    </p>
                  )}
                  {code.maxDiscount != null && (
                    <p className="text-gray-400">Max. Rabatt: €{code.maxDiscount.toFixed(2)}</p>
                  )}
                  <p className="text-gray-400">
                    Gültig: {new Date(code.validFrom).toLocaleDateString('de-DE')}
                    {code.validUntil
                      ? ` – ${new Date(code.validUntil).toLocaleDateString('de-DE')}`
                      : ' – unbefristet'}
                  </p>
                  <p className="text-gray-400">
                    Verwendet: {code.usageCount} / {code.usageLimit ?? '∞'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                  <button
                    type="button"
                    onClick={() => toggleActive(code)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      code.active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {code.active ? 'Aktiv' : 'Inaktiv'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-fortnite-dark border border-purple-500/30 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <h2 className="text-xl font-bold text-white">
                {editing ? `Code bearbeiten: ${editing.code}` : 'Neuer Rabattcode'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="WELCOME10"
                  required
                  disabled={!!editing}
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Typ</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })
                    }
                    className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="percentage">Prozent</option>
                    <option value="fixed">Fester Betrag (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Wert {form.type === 'percentage' ? '(%)' : '(€)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Beschreibung</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Mindestbestellwert (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Max. Rabatt (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Gültig ab</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Gültig bis (optional)</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Max. Verwendungen (leer = unbegrenzt)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Aktiv
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 bg-fortnite-darker border border-purple-500/30 text-white rounded hover:border-purple-500/60"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Speichert...' : editing ? 'Aktualisieren' : 'Anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
