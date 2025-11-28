interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Card = ({ children, title, className = '' }: CardProps) => {
  return (
    <div className={`
      bg-basilisk-gray-900/85
      backdrop-blur
      border border-basilisk-gray-700
      rounded-lg
      overflow-hidden
      ${className}
    `.trim()}>
      {title && (
        <div className="
          px-4 py-3
          bg-basilisk-gray-800/50
          border-b border-basilisk-gray-700
        ">
          <h3 className="text-sm font-sans font-semibold text-basilisk-white">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
