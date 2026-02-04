interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    loading?: boolean;
}

export function Button({
                           children,
                           variant = 'secondary',
                           loading,
                           className = '',
                           disabled,
                           ...props
                       }: ButtonProps) {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    };

    return (
        <button
            className={`px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
}
