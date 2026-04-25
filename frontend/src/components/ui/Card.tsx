import { ReactNode, MouseEvent } from 'react';

interface CardProps {
  interactive?: boolean;
  selected?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
  className?: string;
}

export function Card({
  interactive = false,
  selected = false,
  onClick,
  children,
  className = '',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border transition-all duration-150
        ${selected
          ? 'border-gray-900 ring-2 ring-gray-900 shadow-md'
          : 'border-gray-200 shadow-sm'
        }
        ${interactive && !selected ? 'hover:shadow-md hover:border-gray-300 cursor-pointer' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
