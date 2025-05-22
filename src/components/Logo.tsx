
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`text-[#01013C] font-bold text-2xl ${className}`}>
      Synvya
    </div>
  );
};

export default Logo;
