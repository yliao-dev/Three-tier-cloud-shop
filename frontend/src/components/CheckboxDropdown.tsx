import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";

type Option = {
  value: string;
  label: string;
};

type CheckboxDropdownProps = {
  placeholder: string;
  options: Option[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  isLoading?: boolean;
};

const CheckboxDropdown = ({
  placeholder,
  options,
  selected,
  onChange,
  isLoading,
}: CheckboxDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleItemClick = (value: string) => {
    const newSelection = new Set(selected);
    if (newSelection.has(value)) {
      newSelection.delete(value);
    } else {
      newSelection.add(value);
    }
    onChange(newSelection);
  };

  // Close dropdown if clicking outside
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

  return (
    <div className="checkbox-dropdown" ref={dropdownRef}>
      <button
        className="dropdown-button"
        onClick={handleToggle}
        disabled={isLoading}
      >
        <span>{isLoading ? "Loading..." : placeholder}</span>
        <div className="button-indicator">
          <div
            className={`selected-dot ${selected.size > 0 ? "visible" : ""}`}
          ></div>
          <FiChevronDown
            className={`dropdown-chevron ${isOpen ? "open" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`dropdown-item ${
                selected.has(option.value) ? "selected" : ""
              }`}
              onClick={() => handleItemClick(option.value)}
            >
              <div className="checkmark-container">
                {/* Conditionally render the checkmark icon */}
                {selected.has(option.value) && <FiCheck size={16} />}
              </div>
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckboxDropdown;
