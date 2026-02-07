import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  maxWidth?: string;
  animationOrigin?: { x: number; y: number } | null;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md lg:max-w-md xl:max-w-lg',
  animationOrigin = null
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll do body de forma mais robusta no iOS
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      setShouldRender(true);
      setIsClosing(false);
      // Pequeno delay para garantir que o elemento está no DOM antes da animação
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else if (shouldRender) {
      setIsClosing(true);
      setIsAnimating(false);
      // Aguardar animação de saída mais suave antes de remover do DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        // Restaurar scroll do body
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }, 400); // Aumentado para 400ms para animação mais suave
      return () => clearTimeout(timer);
    }
    
    return () => {
      // Restaurar scroll do body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen, shouldRender]);
  
  if (!shouldRender) return null;

  // Calcular a origem da animação baseada na posição do botão
  const getTransformOrigin = () => {
    if (!animationOrigin) return 'center';
    return `${animationOrigin.x}px ${animationOrigin.y}px`;
  };

  // Calcular a posição inicial/final da animação
  const getAnimationStyle = () => {
    if (!animationOrigin) return {};
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = animationOrigin.x - centerX;
    const deltaY = animationOrigin.y - centerY;
    
    return {
      '--origin-x': `${deltaX}px`,
      '--origin-y': `${deltaY}px`,
    } as React.CSSProperties;
  };
  
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black transition-all duration-400 ease-out ${
            isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={onClose}
        />
        
        {/* Modal - otimizado para iPhone */}
        <div 
          className={`relative bg-white rounded-2xl shadow-xl w-full sm:w-auto ${maxWidth} max-h-[85vh] overflow-y-auto transition-all duration-400 ease-out mx-4 sm:mx-0 ${
            animationOrigin 
              ? (isAnimating ? 'animate-modal-macos-enter' : isClosing ? 'animate-modal-macos-exit' : 'animate-modal-macos-exit')
              : (isAnimating ? 'animate-modal-enter' : isClosing ? 'animate-modal-exit' : 'animate-modal-exit')
          }`}
          style={{
            ...getAnimationStyle(),
            transformOrigin: getTransformOrigin(),
            // Melhorar scroll no iOS
            WebkitOverflowScrolling: 'touch'
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="text-lg font-semibold text-gray-900">
              {typeof title === 'string' ? <span>{title}</span> : title}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
