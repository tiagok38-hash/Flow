import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, className = '', style, onClick }: CardProps) {
  const baseStyles = 'bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-400/30 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-500/40 hover:scale-[1.01] transform';
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${className} cursor-pointer text-left w-full active:scale-95 active:shadow-lg`}
        style={style}
      >
        {children}
      </button>
    );
  }
  
  return (
    <div 
      className={`${baseStyles} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
