import React from "react";

interface NumericInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  suffix?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  placeholder,
  className = "input",
  required = false,
  disabled = false,
  suffix,
}) => {
  const formatValueForDisplay = (val: string | number) => {
    if (val === undefined || val === null || val === "") return "";
    
    // Standardize input string (convert dots to commas for display format parsing)
    const str = val.toString().replace(/\./g, ",");
    
    const parts = str.split(",");
    const integerPart = parts[0].replace(/\D/g, "");
    const decimalPart = parts.slice(1).join("").replace(/\D/g, "");
    
    const formattedInteger = integerPart 
      ? new Intl.NumberFormat("id-ID").format(parseInt(integerPart, 10)) 
      : "";
      
    if (str.includes(",")) {
      return `${formattedInteger},${decimalPart}`;
    }
    return formattedInteger;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Treat typed dots as commas (decimal separators in Indonesian formatting)
    let inputVal = e.target.value.replace(/\./g, ",");
    let clean = inputVal.replace(/[^0-9,]/g, "");
    
    // Restrict to at most one comma
    const parts = clean.split(",");
    if (parts.length > 2) {
      clean = `${parts[0]},${parts.slice(1).join("")}`;
    }
    
    // Convert comma back to dot for standard float-parseable string in parent state
    const rawFloatStr = clean.replace(/,/g, ".");
    onChange(rawFloatStr);
  };

  const displayVal = formatValueForDisplay(value);

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayVal}
        onChange={handleTextChange}
        className={`${className} w-full ${suffix ? "pr-12" : ""}`}
      />
      {suffix && (
        <span className="absolute right-3.5 text-slate-500 text-xs font-semibold pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
