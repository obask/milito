interface MilitoPlaceholderProps {
  onClick?: () => void
  highlighted?: boolean
}

export function MilitoPlaceholder(props: MilitoPlaceholderProps) {
  return (
    <div
      onClick={props.onClick}
      class={`
        inline-block w-20 h-28 border-2 border-dashed
        ${props.highlighted ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-400'}
        ${props.onClick ? 'cursor-pointer hover:border-yellow-400 hover:bg-yellow-400/10' : ''}
        transition-all
      `}
    />
  )
}
