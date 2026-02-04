interface MilitoPlaceholderProps {
  onClick?: () => void
  highlighted?: boolean
}

export function MilitoPlaceholder({ onClick, highlighted }: MilitoPlaceholderProps) {
  return (
    <div
      onClick={onClick}
      className={`
        inline-block w-20 h-28 border-2 border-dashed
        ${highlighted ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-400'}
        ${onClick ? 'cursor-pointer hover:border-yellow-400 hover:bg-yellow-400/10' : ''}
        transition-all
      `}
    />
  )
}
