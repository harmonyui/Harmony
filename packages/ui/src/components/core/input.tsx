import React, { useEffect, useState } from 'react'
import { usePrevious } from '../../hooks/previous'
import { CheckmarkIcon } from './icons'
import { Label } from './label'

interface InputProps {
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  value?: string | number | readonly string[] | undefined
  className?: string
  type?: 'input' | 'textarea' | 'password' | 'email'
  label?: string
  placeholder?: string
  required?: boolean
  inlineLabel?: string
}
export const Input: React.FunctionComponent<InputProps> = ({
  onChange,
  onBlur,
  value,
  className,
  label,
  type = 'input',
  placeholder,
  required,
  inlineLabel,
}) => {
  const props = {
    className: `${
      className || ''
    } hw-border focus:hw-outline-0 focus:hw-border-gray-400 hw-border-gray-400 hw-shadow-sm hw-rounded-[3px] hw-px-3 hw-py-1.5 hw-text-sm hw-text-gray-900 focus:hw-ring-primary focus:hw-ring-1 hw-transition-[box-shadow] focus-visible:hw-outline-none placeholder:hw-text-gray-400`,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onChange && onChange(e.target.value)
    },
    onBlur: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onBlur && onBlur(e.target.value)
    },
    placeholder,
    required,
  }
  let input =
    type === 'textarea' ? (
      <textarea {...props} value={value} />
    ) : (
      <input {...props} type={type} value={value} />
    )
  if (inlineLabel !== undefined) {
    input = (
      <div className='hw-flex hw-border hw-border-gray-300 hw-rounded-[3px] hw-shadow-sm focus-within:hw-ring-primary focus-within:hw-ring-1 hw-transition-[box-shadow] focus-visible:hw-outline-none sm:hw-max-w-md'>
        <span className='hw-flex hw-select-none hw-items-center hw-pl-3 hw-text-gray-500 sm:hw-text-sm'>
          {inlineLabel}
        </span>
        <input
          className='hw-block hw-flex-1 hw-border-0 hw-bg-transparent hw-py-1.5 hw-pl-1 hw-text-gray-900 placeholder:hw-text-gray-400 focus:hw-ring-0 sm:hw-text-sm sm:hw-leading-6'
          placeholder={placeholder}
          type='text'
        />
      </div>
    )
  }
  if (label) {
    return <Label label={label}>{input}</Label>
  }
  return input
}

export const InputBlur: React.FunctionComponent<Omit<InputProps, 'onBlur'>> = ({
  onChange,
  value: valueProps,
  ...rest
}) => {
  const [value, setValue] = useState(valueProps)
  const prevValue = usePrevious(valueProps)

  useEffect(() => {
    if (prevValue !== valueProps) {
      setValue(valueProps)
    }
  }, [prevValue, valueProps])

  const onInputChange = (_value: string): void => {
    setValue(_value)
  }
  return (
    <Input {...rest} value={value} onChange={onInputChange} onBlur={onChange} />
  )
}

export interface CheckboxInputProps {
  className?: string
  value: boolean
  onChange?: (value: boolean) => void
  label?: string
}
export const CheckboxInput: React.FunctionComponent<CheckboxInputProps> = ({
  value,
  onChange,
  label,
  className,
}) => {
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange && onChange(e.target.checked)
  }

  const input = (
    <div
      className={`${
        value ? 'hw-bg-primary' : 'hw-bg-gray-100'
      } ${className} hw-text-blue-600 hw-border-gray-300 hw-rounded focus:hw-ring-primary-light dark:focus:hw-ring-primary dark:hw-ring-offset-gray-800 focus:hw-ring-2 dark:hw-bg-gray-700 dark:hw-border-gray-600 hw-cursor-pointer hw-relative`}
    >
      <input
        checked={value}
        className='hw-absolute hw-top-0 hw-left-0 hw-opacity-0'
        onChange={onInputChange}
        type='checkbox'
      />
      <CheckmarkIcon
        className={`hw-w-4 hw-h-4 hw-fill-white ${value ? 'hw-visible' : 'hw-invisible'}`}
      />
    </div>
  )
  if (label) {
    return <Label label={label}>{input}</Label>
  }

  return input
}

interface NumberStepperInputProps {
  value: number
  onChange: (value: number) => void
}
export const NumberStepperInput: React.FunctionComponent<
  NumberStepperInputProps
> = ({ value: valueProp, onChange: onChangeProps }) => {
  const [value, setValue] = useState(String(valueProp))

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _value = e.target.value
    setValue(_value)
  }

  const changeValue = (newVal: number) => {
    const _newVal = Math.min(Math.max(0, newVal), 99)
    setValue(String(_newVal))
    onChangeProps(_newVal)
  }

  const onBlur = () => {
    let num = parseInt(value)
    if (isNaN(num)) {
      num = valueProp
    }

    changeValue(num)
  }

  return (
    <div className='hw-flex hw-rounded-[3px] hw-border hw-border-gray-400 hw-items-center hw-overflow-auto'>
      <button
        className='hover:hw-bg-gray-100 hw-py-[1px] hw-px-2.5 hw-border-r hw-border-gray-400'
        onClick={() => {
          changeValue(valueProp - 1)
        }}
      >
        -
      </button>
      <input
        className='hw-px-1.5 hw-text-sm hw-py-[1px] hw-border-none hw-w-8 focus:hw-ring-0'
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <button
        className='hover:hw-bg-gray-100 hw-py-[1px] hw-px-2.5 hw-border-l hw-border-gray-400'
        onClick={() => {
          changeValue(valueProp + 1)
        }}
      >
        +
      </button>
    </div>
  )
}
