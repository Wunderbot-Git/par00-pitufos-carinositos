import { ReactNode } from 'react';

type BadgeVariant = 'draft' | 'live' | 'completed' | 'closed' | 'default';

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    draft: 'bg-gray-200 text-gray-700',
    live: 'bg-green-500 text-white animate-pulse',
    completed: 'bg-blue-500 text-white',
    closed: 'bg-gray-400 text-gray-100',
    default: 'bg-gray-200 text-gray-700',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    );
}
