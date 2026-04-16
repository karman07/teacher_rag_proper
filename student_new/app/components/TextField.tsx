import { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
}

export default function TextField({ label, icon, error, className = "", ...props }: TextFieldProps) {
  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-semibold text-blue-700 mb-1 ml-1">
        {label}
      </label>
      <div className={`flex items-center bg-blue-50 border border-blue-200 focus-within:border-blue-500 transition-all shadow-sm rounded-lg px-3 py-2 ${error ? "border-red-400" : ""}`}>
        {icon && <span className="mr-2 text-blue-400">{icon}</span>}
        <input
          className="flex-1 bg-transparent outline-none text-blue-900 placeholder:text-blue-300 font-medium text-base"
          {...props}
        />
      </div>
      {error && <div className="text-xs text-red-500 mt-1 ml-1">{error}</div>}
    </div>
  );
}
