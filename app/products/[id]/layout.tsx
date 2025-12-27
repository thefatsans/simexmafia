import { Metadata } from 'next'
import { generateProductMetadata } from '@/app/metadata'

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  return generateProductMetadata(params.id)
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

