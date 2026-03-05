import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: ReactNode;
    isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-team-blue text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border border-team-blue text-team-blue hover:bg-blue-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
};

export function Button({
    variant = 'primary',
    children,
    isLoading,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || isLoading}
            className={`px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
}
