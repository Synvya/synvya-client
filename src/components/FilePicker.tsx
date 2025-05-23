
import React from 'react';
import { FileUp } from 'lucide-react';

interface FilePickerProps {
  label: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  placeholder?: string;
  className?: string;
}

const FilePicker: React.FC<FilePickerProps> = ({ 
  label, 
  accept = "*/*", 
  onChange,
  placeholder = "Choose file",
  className = ""
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onChange?.(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-[#49BB5B]">
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center space-x-3 px-4 py-3 border-2 border-gray-300 rounded-xl bg-white hover:border-[#49BB5B] transition-colors duration-200">
          <FileUp className="w-5 h-5 text-gray-500" />
          <span className="text-gray-600">{placeholder}</span>
        </div>
      </div>
    </div>
  );
};

export default FilePicker;
