interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent-cool' | 'accent-warm';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: ButtonProps) => {
  const baseStyles = "font-sans font-medium rounded transition-colors duration-200 border";

  const variants = {
    primary: "bg-basilisk-gray-800 hover:bg-basilisk-gray-700 text-basilisk-white border-basilisk-gray-700",
    secondary: "bg-transparent hover:bg-basilisk-gray-800/50 text-basilisk-gray-100 border-basilisk-gray-700",
    'accent-cool': "bg-basilisk-accent-cool-muted hover:bg-basilisk-accent-cool text-basilisk-white border-basilisk-accent-cool",
    'accent-warm': "bg-basilisk-accent-warm-muted hover:bg-basilisk-accent-warm text-basilisk-white border-basilisk-accent-warm",
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
};

export default Button;
