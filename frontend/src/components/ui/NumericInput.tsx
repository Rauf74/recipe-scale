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
    
    // Standardise: convert float dot to Indonesian comma for display
    const str = val.toString();
    const parts = str.split(".");
    
    const integerPart = parts[0].replace(/\D/g, "");
    const decimalPart = parts[1] ? parts[1].replace(/\D/g, "") : "";
    
    const formattedInteger = integerPart 
      ? new Intl.NumberFormat("id-ID").format(parseInt(integerPart, 10)) 
      : "";
      
    // If the value ends with a dot in the parent state, keep the comma at the end for typing
    if (str.endsWith(".")) {
      return `${formattedInteger},`;
    }
    
    if (str.includes(".")) {
      return `${formattedInteger},${decimalPart}`;
    }
    return formattedInteger;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Convert typed dot at the end to a comma decimal indicator
    if (raw.endsWith(".")) {
      raw = raw.slice(0, -1) + ",";
    }
    
    // Locate the decimal comma
    const commaIndex = raw.indexOf(",");
    let cleanFloatStr = "";
    
    if (commaIndex !== -1) {
      // Split into integer (remove all dots) and decimal (remove all dots/non-digits)
      const beforeComma = raw.substring(0, commaIndex).replace(/\D/g, "");
      const afterComma = raw.substring(commaIndex + 1).replace(/\D/g, "");
      
      cleanFloatStr = beforeComma + "." + afterComma;
    } else {
      // Integer only: strip all thousands separator dots
      cleanFloatStr = raw.replace(/\D/g, "");
    }
    
    onChange(cleanFloatStr);
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
