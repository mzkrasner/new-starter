import React from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface DebouncedInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
}

/**
 *
 * @param param0
 * Debounced Input, should handle debouncing in order to avoid
 * too many state changes
 */

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: DebouncedInputProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) => {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);
  return (
    <>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <PaperAirplaneIcon className="w-4 h-4" />
        </div>
        <input
          type="text"
          className="w-full block p-1.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          id="message-box"
          {...props}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </>
  );
};

export default DebouncedInput;
