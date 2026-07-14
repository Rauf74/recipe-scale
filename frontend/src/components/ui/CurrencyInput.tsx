import React from "react";

interface CurrencyInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
  className = "input",
  required = false,
  disabled = false,
}) => {
  const formatNumber = (numStr: string | number) => {
    if (numStr === undefined || numStr === null) return "";
    const clean = numStr.toString().replace(/\D/g, "");
    if (!clean) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(clean));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    onChange(rawVal);
  };

  const displayVal = formatNumber(value);

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-3 text-slate-500 text-xs font-bold pointer-events-none select-none">Rp</span>
      <input
        type="text"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={displayVal}
        onChange={handleTextChange}
        className={`${className} w-full`}
        style={{ paddingLeft: "2.25rem" }}
      />
    </div>
  );
};
