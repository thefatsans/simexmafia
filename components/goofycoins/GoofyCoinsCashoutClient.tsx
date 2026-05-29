'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Banknote,
  Building2,
  Coins,
  Loader2,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  CASHOUT_VARIANTS,
  GOOFYCOINS_PER_EUR,
  MAX_CASHOUT_EUR,
  MIN_CASHOUT_EUR,
  eurToCoins,
  type CashoutVariant,
} from '@/lib/goofycoins/cashout'
import {
  getCashoutRequestsFromAPI,
  submitCashoutRequest,
  type GoofyCoinCashoutRequest,
} from '@/lib/api/goofycoins'
import { User } from '@/types/user'

function readLocalUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const storedUser = localStorage.getItem('simexmafia-user')
    if (!storedUser) return null
    const parsed = JSON.parse(storedUser) as User & { password?: string }
    const { password: _, ...userData } = parsed
    return userData
  } catch {
    return null
  }
}

export default function GoofyCoinsCashoutClient({
  initialRequests = null,
}: {
  initialRequests?: GoofyCoinCashoutRequest[] | null
}) {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading, updateUser, syncUserFromDatabase } = useAuth()
  const localUser = useMemo(() => readLocalUser(), [])
  const user = authUser ?? localUser
  const authPending = authLoading && !user
  const { showSuccess, showError } = useToast()

  const [variant, setVariant] = useState<CashoutVariant>('bank')
  const [euroAmount, setEuroAmount] = useState(MIN_CASHOUT_EUR)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [iban, setIban] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<GoofyCoinCashoutRequest[]>(() => initialRequests ?? [])
  const [loadingRequests, setLoadingRequests] = useState(!initialRequests)

  useEffect(() => {
    if (!authPending && !user) {
      router.push('/auth/login?redirect=/goofycoins/cashout')
    }
  }, [authPending, user, router])

  useEffect(() => {
    if (!user) return
    setFullName(`${user.firstName} ${user.lastName}`.trim())
    setEmail(user.email)
  }, [user])

  useEffect(() => {
    if (!user?.id || initialRequests) {
      setLoadingRequests(false)
      return
    }
    const load = async () => {
      setLoadingRequests(true)
      try {
        setRequests(await getCashoutRequestsFromAPI())
      } finally {
        setLoadingRequests(false)
      }
    }
    void load()
  }, [user?.id, initialRequests])

  const coinsNeeded = useMemo(() => eurToCoins(euroAmount), [euroAmount])
  const maxEurByBalance = useMemo(() => {
    const balanceEur = Math.floor((user?.goofyCoins ?? 0) / GOOFYCOINS_PER_EUR)
    return Math.min(MAX_CASHOUT_EUR, balanceEur)
  }, [user?.goofyCoins])

  const canSubmit =
    euroAmount >= MIN_CASHOUT_EUR &&
    euroAmount <= MAX_CASHOUT_EUR &&
    euroAmount <= maxEurByBalance &&
    (user?.goofyCoins ?? 0) >= coinsNeeded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)
    try {
      const result = await submitCashoutRequest({
        variant,
        euroAmount,
        fullName,
        email,
        phone: phone || undefined,
        iban: variant === 'bank' ? iban : undefined,
        address: variant === 'cash' ? address : undefined,
        notes: notes || undefined,
      })

      if (!result.success) {
        showError(result.error || 'Anfrage fehlgeschlagen')
        return
      }

      if (typeof result.newBalance === 'number') {
        updateUser({ goofyCoins: result.newBalance })
      } else {
        await syncUserFromDatabase()
      }

      showSuccess(
        `Umtausch-Anfrage über ${euroAmount.toFixed(2)}€ (${coinsNeeded.toLocaleString()} Coins) eingereicht`
      )
      setRequests(await getCashoutRequestsFromAPI())
    } catch {
      showError('Anfrage fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  if (authPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account/goofycoins"
          className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu GoofyCoins
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">GoofyCoins umtauschen</h1>
            <p className="text-gray-400">
              Tausche deine GoofyCoins in Bargeld oder Echtgeld um.{' '}
              <span className="text-yellow-400">
                {GOOFYCOINS_PER_EUR} Coins = 1€
              </span>{' '}
              · Mindestens {MIN_CASHOUT_EUR}€ · Maximal {MAX_CASHOUT_EUR}€
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-green-900/30 border border-purple-500/30 rounded-lg p-6 mb-8">
          <p className="text-gray-400 text-sm mb-1">Dein Guthaben</p>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            <Coins className="w-8 h-8 text-yellow-400" />
            {(user.goofyCoins ?? 0).toLocaleString()} Coins
            <span className="text-lg text-gray-400 font-normal">
              (≈ {((user.goofyCoins ?? 0) / GOOFYCOINS_PER_EUR).toFixed(2)}€)
            </span>
          </p>
          {maxEurByBalance < MIN_CASHOUT_EUR && (
            <p className="text-orange-400 text-sm mt-2">
              Du brauchst mindestens {eurToCoins(MIN_CASHOUT_EUR).toLocaleString()} Coins ({MIN_CASHOUT_EUR}€) zum Umtauschen.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Auszahlungsart</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.values(CASHOUT_VARIANTS) as Array<(typeof CASHOUT_VARIANTS)[CashoutVariant]>).map(
                (v) => {
                  const Icon = v.id === 'cash' ? Banknote : Building2
                  const selected = variant === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariant(v.id)}
                      className={`text-left p-5 rounded-lg border transition-all ${
                        selected
                          ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/50'
                          : 'border-purple-500/20 bg-fortnite-dark hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-6 h-6 ${selected ? 'text-green-400' : 'text-purple-400'}`} />
                        <span className="text-white font-semibold text-lg">{v.label}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{v.description}</p>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6">
            <label className="block text-white font-semibold mb-4">
              Betrag ({MIN_CASHOUT_EUR}€ – {MAX_CASHOUT_EUR}€)
            </label>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                min={MIN_CASHOUT_EUR}
                max={Math.max(MIN_CASHOUT_EUR, maxEurByBalance)}
                step={1}
                value={Math.min(euroAmount, Math.max(MIN_CASHOUT_EUR, maxEurByBalance))}
                onChange={(e) => setEuroAmount(Number(e.target.value))}
                className="flex-1 accent-green-500"
                disabled={maxEurByBalance < MIN_CASHOUT_EUR}
              />
              <div className="flex items-center gap-1 min-w-[100px]">
                <input
                  type="number"
                  min={MIN_CASHOUT_EUR}
                  max={MAX_CASHOUT_EUR}
                  step={1}
                  value={euroAmount}
                  onChange={(e) => setEuroAmount(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-fortnite-darker border border-purple-500/30 rounded text-white text-center"
                  disabled={maxEurByBalance < MIN_CASHOUT_EUR}
                />
                <span className="text-white font-bold">€</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Entspricht{' '}
              <span className="text-yellow-400 font-semibold">{coinsNeeded.toLocaleString()} GoofyCoins</span>
            </p>
          </div>

          <div className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Kontaktdaten</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Vollständiger Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">E-Mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Telefon (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white"
                />
              </div>
            </div>

            {variant === 'bank' ? (
              <div>
                <label className="text-gray-400 text-sm block mb-1">IBAN</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  required
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Adresse (für Bargeld-Auszahlung)
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Straße, PLZ, Ort – oder Telefonnummer oben angeben"
                  className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white"
                />
              </div>
            )}

            <div>
              <label className="text-gray-400 text-sm block mb-1">Anmerkungen (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-fortnite-darker border border-purple-500/30 rounded-lg text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Wird eingereicht…
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                {euroAmount.toFixed(2)}€ umtauschen ({coinsNeeded.toLocaleString()} Coins)
              </>
            )}
          </button>
        </form>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">Deine Umtausch-Anfragen</h2>
          {loadingRequests ? (
            <p className="text-gray-400">Wird geladen…</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-400">Noch keine Anfragen eingereicht.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-fortnite-dark border border-purple-500/20 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {req.euroAmount.toFixed(2)}€ · {req.variantLabel}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {req.coinsAmount.toLocaleString()} Coins ·{' '}
                      {new Date(req.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      req.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : req.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {req.status === 'completed'
                      ? 'Abgeschlossen'
                      : req.status === 'rejected'
                      ? 'Abgelehnt'
                      : 'In Bearbeitung'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
