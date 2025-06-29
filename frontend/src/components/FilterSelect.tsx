import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import type { SelectOption, FilterProps } from "../types/ui";

// The component now uses the imported DropdownProps type.
const FilterSelect = ({
  placeholder,
  options,
  value,
  onChange,
  isLoading,
}: FilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue: string | null) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="singleselect-dropdown" ref={dropdownRef}>
      <button
        className="singleselect-button"
        onClick={handleToggle}
        disabled={isLoading}
      >
        <span>{isLoading ? "Loading..." : selectedLabel}</span>
        <FiChevronDown
          className={`singleselect-chevron ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="singleselect-menu">
          <button
            onClick={() => handleSelect(null)}
            className="singleselect-item"
          >
            Clear Selection
          </button>
          {options.map(
            (
              option: SelectOption // Use the imported SelectOption type
            ) => (
              <button
                key={option.value}
                className={`singleselect-item ${
                  value === option.value ? "selected" : ""
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSelect;
