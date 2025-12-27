import { Metadata } from 'next'
import { generateCategoryMetadata } from '@/app/metadata'

export async function generateMetadata({ 
  params 
}: { 
  params: { category: string } 
}): Promise<Metadata> {
  return generateCategoryMetadata(params.category)
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

