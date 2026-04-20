import { cn } from '@/lib/utils'

type Status = 'draft' | 'running' | 'completed' | 'failed' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived'

const statusStyles: Record<Status, string> = {
  draft: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<Status, string> = {
  draft: 'Draft',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  pending_review: 'Pending Review',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status as Status] || 'bg-gray-100 text-gray-700'
  const label = statusLabels[status as Status] || status

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', style, className)}>
      {label}
    </span>
  )
}
