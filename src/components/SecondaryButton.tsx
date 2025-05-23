
import React from 'react';

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  type = 'button',
  className = ""
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-white text-[#49BB5B] border-2 border-[#49BB5B] px-8 py-3 rounded-xl font-medium
        shadow-md hover:shadow-lg transform hover:scale-[1.02] hover:bg-[#49BB5B] hover:text-white
        transition-all duration-200 disabled:opacity-50 
        disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
