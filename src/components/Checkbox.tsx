
import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, checked, onChange, className = "" }) => {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 text-[#9F7AEA] border-gray-300 rounded focus:ring-[#9F7AEA] focus:ring-2"
      />
      <label htmlFor={id} className="text-sm text-[#01013C] leading-5 cursor-pointer">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
