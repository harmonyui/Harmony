import React from 'react'
import { parseColor, type Color } from '@react-stately/color'
import type { HexColor } from '@harmony/util/src/types/colors'
import { HexColorPicker } from 'react-colorful'
import { Popover } from './popover'

const getHslaColor = <T extends Color | HexColor>(
  value: PickerColor<T>,
): Color => {
  return typeof value === 'string' ? parseColor(value).toFormat('hsla') : value
}

type PickerColor<T extends Color | HexColor> = T

type ColorSwatchProps<T extends Color | HexColor> = {
  value: PickerColor<T>
} & React.ComponentPropsWithoutRef<'div'>
function ColorSwatch<T extends Color | HexColor>(props: ColorSwatchProps<T>) {
  const { value, ...otherProps } = props
  const color = getHslaColor((value as HexColor | undefined) || '#000')

  const valueString = color.toString('css')
  return (
    <div
      role='img'
      className='hw-inline-block hw-rounded-sm hw-relative hw-w-5 hw-h-5 hw-overflow-hidden  hw-border hw-border-gray-400'
      aria-label={valueString}
      {...otherProps}
    >
      <div className='hw-absolute hw-w-full hw-h-full hw-bg-white' />
      <div
        className='hw-absolute hw-w-full hw-h-full'
        style={{
          backgroundColor: valueString,
        }}
      />
    </div>
  )
}

interface ColorPickerProps<T extends Color | HexColor> {
  value: PickerColor<T>
  onChange: (color: PickerColor<T>) => void
}

const ColorPicker = ({
  value,
  onChange,
  className,
  container,
}: ColorPickerProps<HexColor> & {
  container?: HTMLElement
  className?: string
}) => {
  return (
    <>
      <Popover
        button={
          <ColorSwatch
            value={(value as HexColor | undefined) || '#000'}
            //aria-label={`current color swatch: ${value.toString('rgb')}`}
          />
        }
        buttonClass={className}
        container={container}
      >
        <HexColorPicker
          color={(value as HexColor | undefined) || '#000'}
          onChange={(_value) => {
            console.log(_value)
            onChange(_value as HexColor)
          }}
        />
      </Popover>
    </>
  )
}

export default ColorPicker
