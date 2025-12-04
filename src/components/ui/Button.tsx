interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: ButtonProps): JSX.Element {
  const baseStyles = "font-sans font-medium rounded transition-colors duration-200 border";

  const variants = {
    primary: "bg-basilisk-gray-800 hover:bg-basilisk-gray-700 text-basilisk-white border-basilisk-gray-700",
    secondary: "bg-transparent hover:bg-basilisk-gray-800/50 text-basilisk-gray-100 border-basilisk-gray-700",
    ghost: "bg-transparent hover:bg-basilisk-white/10 text-basilisk-white border-basilisk-gray-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? disabledStyles : ''}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
}
