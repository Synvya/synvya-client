
import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, checked, onChange, className = "", disabled = false }) => {
  return (
    <div className={`flex items-start space-x-3 ${className} ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 w-4 h-4 text-[#49BB5B] border-gray-300 rounded focus:ring-[#49BB5B] focus:ring-2 disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className={`text-sm text-[#01013C] leading-5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
