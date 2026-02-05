interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
    return (
        <div className="w-full text-black">
            {label && (
                <label className="block text-sm font-medium mb-1 text-black">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${className}`}
                {...props}
            />
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
    return (
        <div className="w-full text-black">
            {label && (
                <label className="block text-sm font-medium mb-1 text-black">
                    {label}
                </label>
            )}
            <select
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className={"text-black"}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    </div>
  );
}
