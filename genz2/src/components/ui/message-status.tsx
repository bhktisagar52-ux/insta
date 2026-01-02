import { Check, CheckCheck } from 'lucide-react'

interface MessageStatusProps {
  delivered: boolean
  read: boolean
  className?: string
}

export function MessageStatus({ delivered, read, className = '' }: MessageStatusProps) {
  if (read) {
    // Double green checkmark for read messages
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        <CheckCheck size={14} className="text-green-500" />
      </div>
    )
  } else if (delivered) {
    // Double gray checkmark for delivered but unread messages
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        <CheckCheck size={14} className="text-muted-foreground" />
      </div>
    )
  } else {
    // Single gray checkmark for sent but not delivered
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        <Check size={14} className="text-muted-foreground" />
      </div>
    )
  }
}
