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
    } border focus:outline-0 focus:border-gray-400 border-gray-400 shadow-sm rounded-[3px] px-3 py-1.5 text-sm text-gray-900 focus:ring-primary focus:ring-1 transition-[box-shadow] focus-visible:outline-none placeholder:text-gray-400`,
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
      <div className='flex border border-gray-300 rounded-[3px] shadow-sm focus-within:ring-primary focus-within:ring-1 transition-[box-shadow] focus-visible:outline-none sm:max-w-md'>
        <span className='flex select-none items-center pl-3 text-gray-500 sm:text-sm'>
          {inlineLabel}
        </span>
        <input
          className='block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6'
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
        value ? 'bg-primary' : 'bg-gray-100'
      } ${className} text-blue-600 border-gray-300 rounded focus:ring-primary-light dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer relative`}
    >
      <input
        checked={value}
        className='absolute top-0 left-0 opacity-0'
        onChange={onInputChange}
        type='checkbox'
      />
      <CheckmarkIcon
        className={`w-4 h-4 fill-white ${value ? 'visible' : 'invisible'}`}
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
    <div className='flex rounded-[3px] border border-gray-400 items-center overflow-auto'>
      <button
        className='hover:bg-gray-100 py-[1px] px-2.5 border-r border-gray-400'
        onClick={() => {
          changeValue(valueProp - 1)
        }}
      >
        -
      </button>
      <input
        className='px-1.5 text-sm py-[1px] border-none w-8 focus:ring-0'
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <button
        className='hover:bg-gray-100 py-[1px] px-2.5 border-l border-gray-400'
        onClick={() => {
          changeValue(valueProp + 1)
        }}
      >
        +
      </button>
    </div>
  )
}
