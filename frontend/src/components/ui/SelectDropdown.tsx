import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectDropdownOption {
  label: string;
  value: string;
  count?: number;
}

interface SelectDropdownProps {
  options: SelectDropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  openOnHover?: boolean;
  disabled?: boolean;
}

export default function SelectDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  openOnHover = false,
  disabled = false,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const handleMouseEnter = () => {
    if (!openOnHover) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!openOnHover) return;
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleButtonClick = () => {
    if (openOnHover) return;
    setIsOpen(prev => !prev);
  };

  const handleOptionClick = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      <button
        type="button"
        className={`flex items-center w-full px-4 py-2 text-base rounded-lg transition-colors focus:outline-none ${buttonClassName} ${isOpen ? 'bg-primary text-white' : 'bg-secondary-light hover:bg-primary-light text-accent-dark'}`}
        onClick={handleButtonClick}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className="flex-1 text-left ">
          {selectedOption ? (
            <>
              {selectedOption.label}
              {typeof selectedOption.count === 'number' && (
                <span className="ml-1 text-xs ">({selectedOption.count})</span>
              )}
            </>
          ) : (
            <span className="">{placeholder}</span>
          )}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="ml-1 h-5 w-5 " />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute left-0 mt-2 w-full min-w-[10rem] max-h-96 overflow-y-auto rounded-xl shadow-lg border border-primary z-50 bg-white ${menuClassName}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            id="no-scrollbar"
          >
            <div className="p-2 space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors relative ${selectedValue === option.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-primary/10 text-text-main'}`}
                  disabled={disabled}
                >
                  {option.label}
                  {typeof option.count === 'number' && (
                    <span className="ml-2 text-xs text-white">({option.count})</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 