import React, { useState } from "react";
import { CheckmarkIcon } from "./icons";
import { Label } from "./label";

interface InputProps {
  onChange?: (value: string) => void;
	onBlur?: (value: string) => void;
  value?: string | number | readonly string[] | undefined;
  className?: string;
  type?: "input" | "textarea" | "password" | "email";
  label?: string;
  placeholder?: string;
  required?: boolean;
	inlineLabel?: string;
}
export const Input: React.FunctionComponent<InputProps> = ({
  onChange,
	onBlur,
  value,
  className,
  label,
  type = "input",
  placeholder,
  required,
	inlineLabel
}) => {
  const props = {
    className: `${
      className || ""
    } w-full border focus:outline-0 focus:border-gray-300 border-gray-300 shadow-sm rounded-md px-3  py-1.5 text-sm text-gray-900 focus:ring-primary focus:ring-1 transition-[box-shadow] focus-visible:outline-none placeholder:text-gray-400`,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onChange && onChange(e.target.value);
    },
		onBlur: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			onBlur && onBlur(e.target.value);
		},
    placeholder,
    required,
  };
  let input =
    type === "textarea" ? (
      <textarea {...props} value={value} />
    ) : (
      <input {...props} type={type} value={value} />
    );
	if (inlineLabel !== undefined) {
		input = <div className="flex border border-gray-300 rounded-md shadow-sm focus-within:ring-primary focus-within:ring-1 transition-[box-shadow] focus-visible:outline-none sm:max-w-md">
			<span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">{inlineLabel}</span>
			<input
				className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
				placeholder={placeholder}
				type="text"
			/>
		</div>
	}
  if (label) {
    return <Label label={label}>{input}</Label>;
  }
  return input;
};

export const InputBlur: React.FunctionComponent<Omit<InputProps, 'onBlur'>> = ({onChange, value: valueProps, ...rest}) => {
	const [value, setValue] = useState(valueProps);

	const onInputChange = (value: string): void => {
		setValue(value);
	}
	return <Input {...rest} value={value} onChange={onInputChange} onBlur={onChange} />
}

export interface CheckboxInputProps {
  className?: string;
  value: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
}
export const CheckboxInput: React.FunctionComponent<CheckboxInputProps> = ({
  value,
  onChange,
  label,
  className,
}) => {
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange && onChange(e.target.checked);
  };

  const input = (
    <div
      className={`${
        value ? "bg-primary" : "bg-gray-100"
      } ${className} text-blue-600 border-gray-300 rounded focus:ring-primary-light dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer relative`}
    >
      <input
        checked={value}
        className="absolute top-0 left-0 opacity-0"
        onChange={onInputChange}
        type="checkbox"
      />
      <CheckmarkIcon
        className={`w-4 h-4 fill-white ${value ? "visible" : "invisible"}`}
      />
    </div>
  );
  if (label) {
    return <Label label={label}>{input}</Label>;
  }

  return input;
};
