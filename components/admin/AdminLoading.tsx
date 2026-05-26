import { LoadingPage } from '@/components/LoadingSpinner'

export default function AdminLoading({ label = 'Lädt...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-fortnite-darker">
      <LoadingPage label={label} />
    </div>
  )
}
