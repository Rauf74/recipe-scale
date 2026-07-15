import React, { useState } from "react";

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
  const [isFocused, setIsFocused] = useState(false);

  const formatValueForDisplay = (val: string | number) => {
    if (val === undefined || val === null || val === "") return "";
    
    if (isFocused) {
      // While focused, show clean decimal with comma (no thousands dots) to prevent typing bugs/glitches
      // e.g. "1250.5" -> "1250,5"
      return val.toString().replace(/\./g, ",");
    } else {
      // While blurred, show formatted number with thousands dots
      // e.g. "1250.5" -> "1.250,5"
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
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\./g, ","); // treat typed dot as comma decimal separator
    let clean = raw.replace(/[^0-9,]/g, ""); // allow only digits and comma
    
    // Restrict to at most one comma
    const parts = clean.split(",");
    if (parts.length > 2) {
      clean = `${parts[0]},${parts.slice(1).join("")}`;
    }
    
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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
