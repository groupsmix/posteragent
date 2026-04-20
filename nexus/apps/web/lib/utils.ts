import type { ProductStatus } from '@nexus/types'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getStatusColor(status: ProductStatus): string {
  const colors: Record<ProductStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    in_revision: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    published: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-600',
    graveyard: 'bg-gray-200 text-gray-500',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
