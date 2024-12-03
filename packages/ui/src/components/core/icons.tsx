/* eslint-disable no-nested-ternary -- ok*/
import { getClass } from '@harmony/util/src/utils/common'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAlignCenter,
  faAlignJustify,
  faAlignLeft,
  faAlignRight,
  faBorderNone,
  faCirclePlay,
  faCircleQuestion,
  faCodeBranch,
  faCodePullRequest,
  faRectangleList,
  faSquareShareNodes,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons'

export type IconComponent = (
  props: React.ComponentPropsWithoutRef<'svg'>,
) => JSX.Element
export const DeleteIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      className={`${className || ''} fill-primary stroke-primary-light`}
      {...props}
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect height='10' strokeWidth='2' width='10' x='5' y='6' />
      <path d='M3 6H17' strokeWidth='2' />
      <path d='M8 6V4H12V6' strokeWidth='2' />
    </svg>
  )
}

export const DottedSquareIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        stroke-linecap='round'
        stroke-linejoin='round'
      ></g>
      <g id='SVGRepo_iconCarrier'>
        {' '}
        <path
          d='M8 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40973 4.40973 4.71569 4.21799 5.09202C4 5.51984 4 6.07989 4 7.2V8M4 11V13M4 16V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.07989 20 7.2 20H8M11 20H13M16 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V16M20 13V11M20 8V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.71569 19.2843 4.40973 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H16M13 4H11'
          stroke='#000000'
          strokeWidth='2'
          stroke-linecap='round'
          stroke-linejoin='round'
        ></path>{' '}
      </g>
    </svg>
  )
}
export const PaintBrushIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42'
      />
    </svg>
  )
}
export const SquareIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M16.5 0.1875H1.5C1.1519 0.1875 0.818064 0.325781 0.571922 0.571922C0.325781 0.818064 0.1875 1.1519 0.1875 1.5V16.5C0.1875 16.8481 0.325781 17.1819 0.571922 17.4281C0.818064 17.6742 1.1519 17.8125 1.5 17.8125H16.5C16.8481 17.8125 17.1819 17.6742 17.4281 17.4281C17.6742 17.1819 17.8125 16.8481 17.8125 16.5V1.5C17.8125 1.1519 17.6742 0.818064 17.4281 0.571922C17.1819 0.325781 16.8481 0.1875 16.5 0.1875ZM16.6875 16.5C16.6875 16.5497 16.6677 16.5974 16.6326 16.6326C16.5974 16.6677 16.5497 16.6875 16.5 16.6875H1.5C1.45027 16.6875 1.40258 16.6677 1.36742 16.6326C1.33225 16.5974 1.3125 16.5497 1.3125 16.5V1.5C1.3125 1.45027 1.33225 1.40258 1.36742 1.36742C1.40258 1.33225 1.45027 1.3125 1.5 1.3125H16.5C16.5497 1.3125 16.5974 1.33225 16.6326 1.36742C16.6677 1.40258 16.6875 1.45027 16.6875 1.5V16.5Z'
        fill='black'
      />
      <path
        d='M16.5 0.1875H1.5C1.1519 0.1875 0.818064 0.325781 0.571922 0.571922C0.325781 0.818064 0.1875 1.1519 0.1875 1.5V16.5C0.1875 16.8481 0.325781 17.1819 0.571922 17.4281C0.818064 17.6742 1.1519 17.8125 1.5 17.8125H16.5C16.8481 17.8125 17.1819 17.6742 17.4281 17.4281C17.6742 17.1819 17.8125 16.8481 17.8125 16.5V1.5C17.8125 1.1519 17.6742 0.818064 17.4281 0.571922C17.1819 0.325781 16.8481 0.1875 16.5 0.1875ZM16.6875 16.5C16.6875 16.5497 16.6677 16.5974 16.6326 16.6326C16.5974 16.6677 16.5497 16.6875 16.5 16.6875H1.5C1.45027 16.6875 1.40258 16.6677 1.36742 16.6326C1.33225 16.5974 1.3125 16.5497 1.3125 16.5V1.5C1.3125 1.45027 1.33225 1.40258 1.36742 1.36742C1.40258 1.33225 1.45027 1.3125 1.5 1.3125H16.5C16.5497 1.3125 16.5974 1.33225 16.6326 1.36742C16.6677 1.40258 16.6875 1.45027 16.6875 1.5V16.5Z'
        fill='black'
        fillOpacity='0.2'
      />
    </svg>
  )
}
export const BorderIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='#000000'
      version='1.1'
      id='Capa_1'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      viewBox='0 0 389.00 389.00'
      stroke='#000000'
      strokeWidth='0.0038900000000000002'
    >
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        stroke-linecap='round'
        stroke-linejoin='round'
        stroke='#CCCCCC'
        strokeWidth='0.778'
      ></g>
      <g id='SVGRepo_iconCarrier'>
        {' '}
        <g>
          {' '}
          <g>
            {' '}
            <g>
              {' '}
              <path d='M379,326.035h-18.852c-5.522,0-10,4.477-10,10v14.111h-14.113c-5.522,0-10,4.477-10,10V379c0,5.523,4.478,10,10,10H379 c5.522,0,10-4.477,10-10v-42.965C389,330.512,384.522,326.035,379,326.035z'></path>{' '}
              <path d='M166.927,350.146h-58.813c-5.522,0-10,4.477-10,10V379c0,5.523,4.478,10,10,10h58.813c5.522,0,10-4.477,10-10v-18.854 C176.927,354.623,172.449,350.146,166.927,350.146z'></path>{' '}
              <path d='M280.887,350.146h-58.812c-5.523,0-10,4.477-10,10V379c0,5.523,4.477,10,10,10h58.812c5.522,0,10-4.477,10-10v-18.854 C290.887,354.623,286.409,350.146,280.887,350.146z'></path>{' '}
              <path d='M52.965,350.146H38.852v-14.111c0-5.523-4.478-10-10-10H10c-5.522,0-10,4.477-10,10V379c0,5.523,4.478,10,10,10h42.965 c5.521,0,10-4.477,10-10v-18.854C62.965,354.623,58.486,350.146,52.965,350.146z'></path>{' '}
              <path d='M10,290.886h18.852c5.522,0,10-4.477,10-10v-58.812c0-5.523-4.478-10-10-10H10c-5.522,0-10,4.477-10,10v58.812 C0,286.409,4.478,290.886,10,290.886z'></path>{' '}
              <path d='M10,176.926h18.852c5.522,0,10-4.477,10-10v-58.812c0-5.523-4.478-10-10-10H10c-5.522,0-10,4.477-10,10v58.812 C0,172.449,4.478,176.926,10,176.926z'></path>{' '}
              <path d='M52.965,0H10C4.478,0,0,4.477,0,10v42.967c0,5.523,4.478,10,10,10h18.852c5.522,0,10-4.477,10-10V38.854h14.113 c5.521,0,10-4.477,10-10V10C62.965,4.478,58.486,0,52.965,0z'></path>{' '}
              <path d='M280.887,0h-58.812c-5.522,0-10,4.477-10,10v18.854c0,5.523,4.478,10,10,10h58.812c5.522,0,10-4.477,10-10V10 C290.887,4.478,286.409,0,280.887,0z'></path>{' '}
              <path d='M108.113,38.854h58.813c5.522,0,10-4.477,10-10V10c0-5.523-4.478-10-10-10h-58.813c-5.522,0-10,4.477-10,10v18.854 C98.113,34.377,102.591,38.854,108.113,38.854z'></path>{' '}
              <path d='M379,0h-42.965c-5.522,0-10,4.477-10,10v18.854c0,5.523,4.478,10,10,10h14.113v14.113c0,5.523,4.478,10,10,10H379 c5.522,0,10-4.477,10-10V10C389,4.478,384.522,0,379,0z'></path>{' '}
              <path d='M379,212.074h-18.852c-5.522,0-10,4.477-10,10v58.812c0,5.522,4.478,10,10,10H379c5.522,0,10-4.478,10-10v-58.812 C389,216.551,384.522,212.074,379,212.074z'></path>{' '}
              <path d='M379,98.114h-18.852c-5.522,0-10,4.477-10,10v58.812c0,5.523,4.478,10,10,10H379c5.522,0,10-4.477,10-10v-58.812 C389,102.591,384.522,98.114,379,98.114z'></path>{' '}
            </g>{' '}
          </g>{' '}
        </g>{' '}
      </g>
    </svg>
  )
}

export const CancelCircle = () => {
  return (
    <svg
      className='w-full h-full'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      stroke='#000000'
      strokeWidth='1'
      stroke-linecap='round'
      stroke-linejoin='miter'
    >
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        stroke-linecap='round'
        stroke-linejoin='round'
      ></g>
      <g id='SVGRepo_iconCarrier'>
        <circle cx='12' cy='12' r='10'></circle>
        <line x1='5' y1='5' x2='19' y2='19'></line>
      </g>
    </svg>
  )
}

export const DottedLine = () => {
  return (
    <svg
      className='w-full h-full'
      viewBox='0 0 15 15'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        stroke-linecap='round'
        stroke-linejoin='round'
      ></g>
      <g id='SVGRepo_iconCarrier'>
        {' '}
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M1.5 6.625C1.01675 6.625 0.625 7.01675 0.625 7.5C0.625 7.98325 1.01675 8.375 1.5 8.375C1.98325 8.375 2.375 7.98325 2.375 7.5C2.375 7.01675 1.98325 6.625 1.5 6.625ZM5.5 6.625C5.01675 6.625 4.625 7.01675 4.625 7.5C4.625 7.98325 5.01675 8.375 5.5 8.375C5.98325 8.375 6.375 7.98325 6.375 7.5C6.375 7.01675 5.98325 6.625 5.5 6.625ZM9.5 6.625C9.01675 6.625 8.625 7.01675 8.625 7.5C8.625 7.98325 9.01675 8.375 9.5 8.375C9.98325 8.375 10.375 7.98325 10.375 7.5C10.375 7.01675 9.98325 6.625 9.5 6.625ZM12.625 7.5C12.625 7.01675 13.0168 6.625 13.5 6.625C13.9832 6.625 14.375 7.01675 14.375 7.5C14.375 7.98325 13.9832 8.375 13.5 8.375C13.0168 8.375 12.625 7.98325 12.625 7.5Z'
          fill='#000000'
        ></path>{' '}
      </g>
    </svg>
  )
}

export const SolidLine = () => {
  return (
    <svg
      className='w-full h-full'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      transform='rotate(90)'
    >
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        stroke-linecap='round'
        stroke-linejoin='round'
      ></g>
      <g id='SVGRepo_iconCarrier'>
        {' '}
        <g id='Interface / Line_L'>
          {' '}
          <path
            id='Vector'
            d='M12 19V5'
            stroke='#000000'
            strokeWidth='2'
            stroke-linecap='round'
            stroke-linejoin='round'
          ></path>{' '}
        </g>{' '}
      </g>
    </svg>
  )
}

export const DashedLine = () => {
  return (
    <svg
      className='w-full h-full'
      viewBox='0 0 17 17'
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      fill='#000000'
    >
      <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
      <g
        id='SVGRepo_tracerCarrier'
        stroke-linecap='round'
        stroke-linejoin='round'
      ></g>
      <g id='SVGRepo_iconCarrier'>
        {' '}
        <path
          d='M0 8h4v1h-4v-1zM6.5 9h4v-1h-4v1zM13 8v1h4v-1h-4z'
          fill='#000000'
        ></path>{' '}
      </g>
    </svg>
  )
}

export const CancelIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faBorderNone} className={props.className} />
}

export const PaddingAllIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 14 14'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M1.99984 1.19991C1.99984 1.01582 2.14908 0.866577 2.33317 0.866577H11.6665C11.8506 0.866577 11.9998 1.01582 11.9998 1.19991C11.9998 1.38401 11.8506 1.53324 11.6665 1.53324H2.33317C2.14908 1.53324 1.99984 1.38401 1.99984 1.19991Z'
        fill='#111827'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M1.99984 13.1999C1.99984 13.0158 2.14908 12.8666 2.33317 12.8666H11.6665C11.8506 12.8666 11.9998 13.0158 11.9998 13.1999C11.9998 13.384 11.8506 13.5332 11.6665 13.5332H2.33317C2.14908 13.5332 1.99984 13.384 1.99984 13.1999Z'
        fill='#111827'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12.9998 2.19991C13.1839 2.19991 13.3332 2.34915 13.3332 2.53324V11.8666C13.3332 12.0507 13.1839 12.1999 12.9998 12.1999C12.8157 12.1999 12.6665 12.0507 12.6665 11.8666V2.53324C12.6665 2.34915 12.8157 2.19991 12.9998 2.19991Z'
        fill='#111827'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M0.999838 2.19991C1.18393 2.19991 1.33317 2.34915 1.33317 2.53324L1.33317 11.8666C1.33317 12.0507 1.18393 12.1999 0.999837 12.1999C0.815742 12.1999 0.666504 12.0507 0.666504 11.8666L0.666504 2.53324C0.666504 2.34915 0.815743 2.19991 0.999838 2.19991Z'
        fill='#111827'
      />
    </svg>
  )
}

export const PaddingLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M2.3335 1.53332L2.3335 8.86666L9.66683 8.86666L9.66683 1.53332L2.3335 1.53332ZM3.00016 2.19999L9.00016 2.19999L9.00016 8.19999L3.00016 8.19999L3.00016 2.19999Z'
        fill='black'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M1.00016 9.86666L1.00016 0.533325L0.333496 0.533325L0.333497 9.86666L1.00016 9.86666Z'
        fill='black'
      />
    </svg>
  )
}

export const PaddingTopIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M1.3335 2.53333H8.66683V9.86666H1.3335V2.53333ZM2.00016 3.19999V9.19999H8.00016V3.19999H2.00016Z'
        fill='black'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M9.66683 1.19999H0.333496V0.533325H9.66683V1.19999Z'
        fill='black'
      />
    </svg>
  )
}

export const PaddingRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M7.6665 1.53333L7.6665 8.86666L0.333171 8.86666L0.333171 1.53333L7.6665 1.53333ZM6.99984 2.19999L0.999838 2.19999L0.999838 8.19999L6.99984 8.19999L6.99984 2.19999Z'
        fill='black'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M8.99984 9.86666L8.99984 0.533325L9.6665 0.533325L9.6665 9.86666L8.99984 9.86666Z'
        fill='black'
      />
    </svg>
  )
}

export const PaddingBottomIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M8.6665 7.86658H1.33317V0.533244H8.6665V7.86658ZM7.99984 7.19991V1.19991H1.99984V7.19991H7.99984Z'
        fill='black'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M0.333171 9.19991H9.6665V9.86658H0.333171V9.19991Z'
        fill='black'
      />
    </svg>
  )
}

export const BorderAllIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 12 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M1.9375 1.625C1.85462 1.625 1.77513 1.65792 1.71653 1.71653C1.65792 1.77513 1.625 1.85462 1.625 1.9375V4.4375C1.625 4.52038 1.59208 4.59987 1.53347 4.65847C1.47487 4.71708 1.39538 4.75 1.3125 4.75C1.22962 4.75 1.15013 4.71708 1.09153 4.65847C1.03292 4.59987 1 4.52038 1 4.4375V1.9375C1 1.68886 1.09877 1.4504 1.27459 1.27459C1.4504 1.09877 1.68886 1 1.9375 1H4.4375C4.52038 1 4.59987 1.03292 4.65847 1.09153C4.71708 1.15013 4.75 1.22962 4.75 1.3125C4.75 1.39538 4.71708 1.47487 4.65847 1.53347C4.59987 1.59208 4.52038 1.625 4.4375 1.625H1.9375ZM7.25 1.3125C7.25 1.22962 7.28292 1.15013 7.34153 1.09153C7.40013 1.03292 7.47962 1 7.5625 1H10.0625C10.3111 1 10.5496 1.09877 10.7254 1.27459C10.9012 1.4504 11 1.68886 11 1.9375V4.4375C11 4.52038 10.9671 4.59987 10.9085 4.65847C10.8499 4.71708 10.7704 4.75 10.6875 4.75C10.6046 4.75 10.5251 4.71708 10.4665 4.65847C10.4079 4.59987 10.375 4.52038 10.375 4.4375V1.9375C10.375 1.85462 10.3421 1.77513 10.2835 1.71653C10.2249 1.65792 10.1454 1.625 10.0625 1.625H7.5625C7.47962 1.625 7.40013 1.59208 7.34153 1.53347C7.28292 1.47487 7.25 1.39538 7.25 1.3125ZM1.3125 7.25C1.39538 7.25 1.47487 7.28292 1.53347 7.34153C1.59208 7.40013 1.625 7.47962 1.625 7.5625V10.0625C1.625 10.1454 1.65792 10.2249 1.71653 10.2835C1.77513 10.3421 1.85462 10.375 1.9375 10.375H4.4375C4.52038 10.375 4.59987 10.4079 4.65847 10.4665C4.71708 10.5251 4.75 10.6046 4.75 10.6875C4.75 10.7704 4.71708 10.8499 4.65847 10.9085C4.59987 10.9671 4.52038 11 4.4375 11H1.9375C1.68886 11 1.4504 10.9012 1.27459 10.7254C1.09877 10.5496 1 10.3111 1 10.0625V7.5625C1 7.47962 1.03292 7.40013 1.09153 7.34153C1.15013 7.28292 1.22962 7.25 1.3125 7.25ZM10.6875 7.25C10.7704 7.25 10.8499 7.28292 10.9085 7.34153C10.9671 7.40013 11 7.47962 11 7.5625V10.0625C11 10.3111 10.9012 10.5496 10.7254 10.7254C10.5496 10.9012 10.3111 11 10.0625 11H7.5625C7.47962 11 7.40013 10.9671 7.34153 10.9085C7.28292 10.8499 7.25 10.7704 7.25 10.6875C7.25 10.6046 7.28292 10.5251 7.34153 10.4665C7.40013 10.4079 7.47962 10.375 7.5625 10.375H10.0625C10.1454 10.375 10.2249 10.3421 10.2835 10.2835C10.3421 10.2249 10.375 10.1454 10.375 10.0625V7.5625C10.375 7.47962 10.4079 7.40013 10.4665 7.34153C10.5251 7.28292 10.6046 7.25 10.6875 7.25Z'
        fill='black'
      />
    </svg>
  )
}

export const BorderTopLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 8 8'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M3.33333 1.33333C2.22876 1.33333 1.33333 2.22876 1.33333 3.33333V7.33333C1.33333 7.70152 1.03486 8 0.666667 8C0.298477 8 0 7.70152 0 7.33333V3.33333C0 1.49238 1.49238 0 3.33333 0H7.33333C7.70152 0 8 0.298477 8 0.666667C8 1.03486 7.70152 1.33333 7.33333 1.33333H3.33333Z'
        fill='black'
      />
    </svg>
  )
}

export const BorderTopRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 8 8'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M4.66667 1.33333C5.77124 1.33333 6.66667 2.22876 6.66667 3.33333V7.33333C6.66667 7.70152 6.96514 8 7.33333 8C7.70152 8 8 7.70152 8 7.33333V3.33333C8 1.49238 6.50762 0 4.66667 0H0.666667C0.298476 0 0 0.298477 0 0.666667C0 1.03486 0.298476 1.33333 0.666667 1.33333H4.66667Z'
        fill='black'
      />
    </svg>
  )
}
export const BorderBottomLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 8 8'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M3.33333 6.66667C2.22876 6.66667 1.33333 5.77124 1.33333 4.66667V0.666667C1.33333 0.298476 1.03486 0 0.666667 0C0.298477 0 0 0.298476 0 0.666667V4.66667C0 6.50762 1.49238 8 3.33333 8H7.33333C7.70152 8 8 7.70152 8 7.33333C8 6.96514 7.70152 6.66667 7.33333 6.66667H3.33333Z'
        fill='black'
      />
    </svg>
  )
}
export const BorderBottomRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 8 8'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M4.66667 6.66667C5.77124 6.66667 6.66667 5.77124 6.66667 4.66667V0.666667C6.66667 0.298476 6.96514 0 7.33333 0C7.70152 0 8 0.298476 8 0.666667V4.66667C8 6.50762 6.50762 8 4.66667 8H0.666667C0.298476 8 0 7.70152 0 7.33333C0 6.96514 0.298476 6.66667 0.666667 6.66667H4.66667Z'
        fill='black'
      />
    </svg>
  )
}

export const TextAlignLeftIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignLeft} className={props.className} />
}

export const TextAlignRightIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignRight} className={props.className} />
}

export const TextAlignCenterIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignCenter} className={props.className} />
}

export const TextAlignJustifyIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignJustify} className={props.className} />
}

export const BoldIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 8 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M5.55336 4.56612C5.91834 4.2653 6.18155 3.85913 6.30704 3.4031C6.43253 2.94707 6.41418 2.46342 6.25449 2.01822C6.0948 1.57301 5.80156 1.18796 5.41483 0.915658C5.02809 0.643357 4.56673 0.497087 4.09375 0.496826H0.375C0.287976 0.496826 0.204516 0.531396 0.142981 0.592932C0.0814454 0.654467 0.046875 0.737927 0.046875 0.824951V9.13745C0.046875 9.22447 0.0814454 9.30794 0.142981 9.36947C0.204516 9.43101 0.287976 9.46558 0.375 9.46558H4.75C5.34659 9.46552 5.92374 9.25345 6.37842 8.86722C6.83311 8.48098 7.13573 7.94573 7.23226 7.357C7.32879 6.76828 7.21295 6.1644 6.90542 5.65319C6.59789 5.14197 6.11869 4.75669 5.55336 4.56612ZM0.703125 1.15308H4.09375C4.52887 1.15308 4.94617 1.32593 5.25385 1.6336C5.56152 1.94128 5.73438 2.35858 5.73438 2.7937C5.73438 3.22882 5.56152 3.64612 5.25385 3.9538C4.94617 4.26148 4.52887 4.43433 4.09375 4.43433H0.703125V1.15308ZM4.75 8.80933H0.703125V5.09058H4.75C5.24314 5.09058 5.71608 5.28647 6.06478 5.63517C6.41348 5.98388 6.60938 6.45681 6.60938 6.94995C6.60938 7.44309 6.41348 7.91603 6.06478 8.26473C5.71608 8.61343 5.24314 8.80933 4.75 8.80933Z'
        fill='black'
      />
    </svg>
  )
}

export const UnderlineIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 8 11'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M7.82812 10.45C7.82812 10.537 7.79356 10.6204 7.73202 10.682C7.67048 10.7435 7.58702 10.7781 7.5 10.7781H0.5C0.412976 10.7781 0.329516 10.7435 0.267981 10.682C0.206445 10.6204 0.171875 10.537 0.171875 10.45C0.171875 10.3629 0.206445 10.2795 0.267981 10.2179C0.329516 10.1564 0.412976 10.1218 0.5 10.1218H7.5C7.58702 10.1218 7.67048 10.1564 7.73202 10.2179C7.79356 10.2795 7.82812 10.3629 7.82812 10.45ZM4 9.02808C4.89894 9.02706 5.76077 8.66951 6.39641 8.03387C7.03206 7.39822 7.38961 6.53639 7.39062 5.63745V1.26245C7.39062 1.17543 7.35606 1.09197 7.29452 1.03043C7.23298 0.968896 7.14952 0.934326 7.0625 0.934326C6.97548 0.934326 6.89202 0.968896 6.83048 1.03043C6.76894 1.09197 6.73438 1.17543 6.73438 1.26245V5.63745C6.73438 6.36265 6.44629 7.05815 5.9335 7.57095C5.4207 8.08374 4.7252 8.37183 4 8.37183C3.2748 8.37183 2.5793 8.08374 2.0665 7.57095C1.55371 7.05815 1.26562 6.36265 1.26562 5.63745V1.26245C1.26562 1.17543 1.23105 1.09197 1.16952 1.03043C1.10798 0.968896 1.02452 0.934326 0.9375 0.934326C0.850476 0.934326 0.767016 0.968896 0.705481 1.03043C0.643945 1.09197 0.609375 1.17543 0.609375 1.26245V5.63745C0.610388 6.53639 0.967939 7.39822 1.60359 8.03387C2.23923 8.66951 3.10106 9.02706 4 9.02808Z'
        fill='black'
      />
    </svg>
  )
}
export const StrikeThroughIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 12 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M11.1406 5.19995C11.1406 5.28698 11.1061 5.37044 11.0445 5.43197C10.983 5.49351 10.8995 5.52808 10.8125 5.52808H8.2668C8.88367 5.90651 9.39062 6.47854 9.39062 7.38745C9.39062 8.77433 7.86977 9.90308 6 9.90308C4.13023 9.90308 2.60938 8.77433 2.60938 7.38745C2.60938 7.30043 2.64395 7.21697 2.70548 7.15543C2.76702 7.0939 2.85048 7.05933 2.9375 7.05933C3.02452 7.05933 3.10798 7.0939 3.16952 7.15543C3.23105 7.21697 3.26562 7.30043 3.26562 7.38745C3.26562 8.41284 4.49227 9.24683 6 9.24683C7.50773 9.24683 8.73438 8.41284 8.73438 7.38745C8.73438 6.3905 7.88891 5.93331 6.52117 5.52808H1.1875C1.10048 5.52808 1.01702 5.49351 0.955481 5.43197C0.893945 5.37044 0.859375 5.28698 0.859375 5.19995C0.859375 5.11293 0.893945 5.02947 0.955481 4.96793C1.01702 4.9064 1.10048 4.87183 1.1875 4.87183H10.8125C10.8995 4.87183 10.983 4.9064 11.0445 4.96793C11.1061 5.02947 11.1406 5.11293 11.1406 5.19995ZM3.1743 3.77808C3.20921 3.77793 3.24389 3.7724 3.27711 3.76167C3.35937 3.73409 3.42736 3.67505 3.4662 3.59746C3.50504 3.51988 3.51158 3.43007 3.48438 3.34769C3.45061 3.2392 3.43418 3.12606 3.4357 3.01245C3.4357 1.95261 4.5382 1.15308 6 1.15308C7.07078 1.15308 7.94469 1.58019 8.33734 2.2955C8.37926 2.37179 8.44977 2.4283 8.53335 2.45261C8.61694 2.47692 8.70676 2.46702 8.78305 2.42511C8.85934 2.38319 8.91585 2.31268 8.94016 2.2291C8.96447 2.14551 8.95457 2.0557 8.91266 1.9794C8.40297 1.05081 7.3125 0.496826 6 0.496826C4.16414 0.496826 2.77945 1.578 2.77945 3.01245C2.7784 3.19564 2.80645 3.37783 2.86258 3.55222C2.88412 3.6179 2.92586 3.6751 2.98184 3.71566C3.03781 3.75622 3.10517 3.77806 3.1743 3.77808Z'
        fill='black'
      />
    </svg>
  )
}

export const ClipboardIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184'
      />
    </svg>
  )
}

export const Bars3BottomLeft: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12'
      />
    </svg>
  )
}

export const Bars3BottomRight: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25'
      />
    </svg>
  )
}

export const Bars3CenterLeft: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5'
      />
    </svg>
  )
}

export const Bars3: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
      />
    </svg>
  )
}

export const Bars4Icon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5'
      />
    </svg>
  )
}

export const AddIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ''} fill-primary stroke-primary-light`}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M12 6v12m6-6H6' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export const BarsArrowDownIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='4 4 20 25'
      x='0px'
      y='0px'
    >
      <g data-name='Layer 2'>
        <path d='M8.29,9.71a1.014,1.014,0,0,0,1.42,0,1.008,1.008,0,0,0,0-1.42l-3-3a1.014,1.014,0,0,0-1.42,0l-3,3a1.008,1.008,0,0,0,0,1.42,1.014,1.014,0,0,0,1.42,0L5,8.42V23.586L3.707,22.293a1,1,0,0,0-1.414,1.414l3,3a1,1,0,0,0,1.414,0l3-3a1,1,0,0,0-1.414-1.414L7,23.586V8.42Z' />
        <path d='M29,18H14a1,1,0,0,0,0,2H29a1,1,0,0,0,0-2Z' />
        <path d='M29,24H14a1,1,0,0,0,0,2H29a1,1,0,0,0,0-2Z' />
        <path d='M29,12H14a1,1,0,0,0,0,2H29a1,1,0,0,0,0-2Z' />
        <path d='M14,8H29a1,1,0,0,0,0-2H14a1,1,0,0,0,0,2Z' />
      </g>
    </svg>
  )
}

export const CursorArrowRaysIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59'
      />
    </svg>
  )
}

export const EyeDropperIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9M15 11.25L12.75 9'
      />
    </svg>
  )
}

export const EditIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ''} hw-fill-primary hw-stroke-primary-light`}
      fill='none'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M4 13V16H7L16 7L13 4L4 13Z' strokeWidth='2' />
    </svg>
  )
}

export const EditSquareIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ArchiveIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ''} fill-primary stroke-primary-light`}
      fill='none'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect height='8' strokeWidth='2' width='10' x='5' y='8' />
      <rect height='4' strokeWidth='2' width='12' x='4' y='4' />
      <path d='M8 12H12' stroke='#A78BFA' strokeWidth='2' />
    </svg>
  )
}
export const AdjustIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ''} fill-primary stroke-primary-light`}
      fill='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z' />
    </svg>
  )
}

export const CheckIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M4.5 12.75l6 6 9-13.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ChevronDownIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M19.5 8.25l-7.5 7.5-7.5-7.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ChevronUpIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M4.5 15.75l7.5-7.5 7.5 7.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ChatBubbleLeftEllipsisIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const TagIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M6 6h.008v.008H6V6z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const PlusSmallIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M12 6v12m6-6H6' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export const PlusIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M12 4.5v15m7.5-7.5h-15'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const MinusIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M19.5 12h-15' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

export const DashboardIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 22 21'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z' />
      <path d='M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z' />
    </svg>
  )
}

export const PreviewIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 22 22'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M21.1763 0.823752C21.0123 0.657259 20.8064 0.538176 20.5803 0.479096C20.3542 0.420016 20.1163 0.423137 19.8919 0.488127H19.8816L1.88813 5.94719C1.63257 6.0212 1.40555 6.17113 1.23714 6.37711C1.06874 6.58309 0.966906 6.83538 0.945147 7.10054C0.923389 7.36571 0.982731 7.63123 1.11531 7.8619C1.24788 8.09257 1.44743 8.27751 1.6875 8.39219L9.70875 12.2959L13.605 20.3125C13.71 20.5373 13.8771 20.7273 14.0865 20.8602C14.296 20.9931 14.5391 21.0633 14.7872 21.0625C14.8247 21.0625 14.8631 21.0625 14.9006 21.0578C15.1664 21.0369 15.4193 20.935 15.6253 20.7659C15.8314 20.5967 15.9806 20.3685 16.0528 20.1119L21.5091 2.11844V2.10813C21.5744 1.88391 21.578 1.64622 21.5194 1.42014C21.4608 1.19407 21.3423 0.988017 21.1763 0.823752ZM20.4263 1.79875L14.9747 19.7903V19.8006C14.9643 19.8379 14.9426 19.8711 14.9125 19.8955C14.8825 19.92 14.8457 19.9345 14.807 19.9372C14.7684 19.9399 14.7299 19.9305 14.6968 19.9104C14.6637 19.8903 14.6376 19.8605 14.6222 19.825L10.8084 11.9894L15.4022 7.39563C15.4545 7.34336 15.4959 7.28132 15.5242 7.21304C15.5525 7.14475 15.567 7.07157 15.567 6.99766C15.567 6.92375 15.5525 6.85056 15.5242 6.78228C15.4959 6.71399 15.4545 6.65195 15.4022 6.59969C15.3499 6.54743 15.2879 6.50597 15.2196 6.47769C15.1513 6.4494 15.0781 6.43484 15.0042 6.43484C14.9303 6.43484 14.8571 6.4494 14.7888 6.47769C14.7206 6.50597 14.6585 6.54743 14.6063 6.59969L10.0125 11.1934L2.17032 7.375C2.13556 7.35881 2.10661 7.33235 2.08736 7.29919C2.06811 7.26603 2.05949 7.22777 2.06266 7.18956C2.06582 7.15135 2.08063 7.11503 2.10508 7.08549C2.12952 7.05596 2.16244 7.03463 2.19938 7.02438H2.20969L20.2013 1.57C20.2329 1.56112 20.2663 1.56097 20.298 1.56955C20.3297 1.57813 20.3584 1.59514 20.3813 1.61875C20.4044 1.64189 20.421 1.67068 20.4296 1.70226C20.4381 1.73384 20.4383 1.7671 20.43 1.79875H20.4263Z'
        fill='white'
      />
    </svg>
  )
}

export const TilesIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 18 18'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z' />
    </svg>
  )
}

export const MailboxIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='m17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z' />
    </svg>
  )
}

export const UserIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden='true'
      fill='currentColor'
      viewBox='0 0 14 18'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M7 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm2 1H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z' />
    </svg>
  )
}

export const UserGroupIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faUserGroup} className={props.className} />
}

export const UsersIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const UsersGroupIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden='true'
      fill='currentColor'
      viewBox='0 0 20 19'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M14.5 0A3.987 3.987 0 0 0 11 2.1a4.977 4.977 0 0 1 3.9 5.858A3.989 3.989 0 0 0 14.5 0ZM9 13h2a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4Z' />
      <path d='M5 19h10v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2ZM5 7a5.008 5.008 0 0 1 4-4.9 3.988 3.988 0 1 0-3.9 5.859A4.974 4.974 0 0 1 5 7Zm5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-1h-.424a5.016 5.016 0 0 1-1.942 2.232A6.007 6.007 0 0 1 17 17h2a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5ZM5.424 9H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h2a6.007 6.007 0 0 1 4.366-5.768A5.016 5.016 0 0 1 5.424 9Z' />
    </svg>
  )
}

export const UserCircleIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 83 80'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g clipPath='url(#clip0_634_457)'>
        <mask
          id='mask0_634_457'
          style={{ maskType: 'luminance' }}
          maskUnits='userSpaceOnUse'
          x='5'
          y='2'
          width='75'
          height='76'
        >
          <path
            d='M5.3374 2.08691H79.7274V77.2174H5.3374V2.08691Z'
            fill='white'
          />
        </mask>
        <g mask='url(#mask0_634_457)'>
          <path
            d='M42.5324 2.08691C22.0237 2.08691 5.3374 18.9393 5.3374 39.6521C5.3374 60.365 22.0237 77.2174 42.5324 77.2174C63.0412 77.2174 79.7274 60.365 79.7274 39.6521C79.7274 18.9393 63.0412 2.08691 42.5324 2.08691ZM21.6425 64.8233C21.9887 53.4764 31.213 44.3478 42.5324 44.3478C53.8509 44.3478 63.0752 53.4764 63.4223 64.8233C57.764 69.6195 50.4805 72.5217 42.5324 72.5217C34.5844 72.5217 27.3009 69.6195 21.6425 64.8233ZM30.909 27.913C30.909 21.4402 36.1234 16.1739 42.5324 16.1739C48.9415 16.1739 54.1559 21.4402 54.1559 27.913C54.1559 34.3858 48.9415 39.6521 42.5324 39.6521C36.1234 39.6521 30.909 34.3858 30.909 27.913ZM67.6251 60.5597C65.9417 51.7835 59.8465 44.5987 51.7729 41.4221C56.0151 38.4547 58.8052 33.5081 58.8052 27.913C58.8052 18.8523 51.5029 11.4782 42.5324 11.4782C33.561 11.4782 26.2596 18.8523 26.2596 27.913C26.2596 33.5081 29.0489 38.4547 33.292 41.4248C25.2183 44.6014 19.1223 51.7853 17.4371 60.5616C12.7859 54.8759 9.98678 47.5878 9.98678 39.6521C9.98678 21.5271 24.586 6.78257 42.5324 6.78257C60.4788 6.78257 75.0781 21.5271 75.0781 39.6521C75.0781 47.5878 72.2789 54.8759 67.6251 60.5597Z'
            fill='#11283B'
          />
        </g>
      </g>
      <defs>
        <clipPath id='clip0_634_457'>
          <rect width='83' height='80' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

export const ArrowDownIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ArrowUpIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ArrowRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3'
      />
    </svg>
  )
}

export const ArrowLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18'
      />
    </svg>
  )
}

export const ArrowVerticalIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 5 13'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M4.48199 9.90553C4.54344 9.96705 4.57795 10.0505 4.57795 10.1374C4.57795 10.2244 4.54344 10.3078 4.48199 10.3693L2.73199 12.1193C2.67047 12.1807 2.58707 12.2152 2.50012 12.2152C2.41316 12.2152 2.32976 12.1807 2.26824 12.1193L0.518241 10.3693C0.460281 10.3071 0.428727 10.2248 0.430227 10.1398C0.431727 10.0548 0.466164 9.97369 0.526282 9.91357C0.5864 9.85345 0.667506 9.81902 0.752513 9.81752C0.837519 9.81602 0.919789 9.84757 0.981991 9.90553L2.17199 11.095V1.30592L0.981991 2.49428C0.919789 2.55224 0.837519 2.5838 0.752513 2.5823C0.667506 2.5808 0.5864 2.54636 0.526282 2.48624C0.466164 2.42612 0.431727 2.34502 0.430227 2.26001C0.428727 2.175 0.460281 2.09273 0.518241 2.03053L2.26824 0.280532C2.32976 0.219085 2.41316 0.18457 2.50012 0.18457C2.58707 0.18457 2.67047 0.219085 2.73199 0.280532L4.48199 2.03053C4.51423 2.06057 4.54009 2.0968 4.55802 2.13705C4.57595 2.1773 4.5856 2.22075 4.58637 2.2648C4.58715 2.30886 4.57905 2.35262 4.56254 2.39348C4.54604 2.43434 4.52148 2.47145 4.49032 2.50261C4.45916 2.53377 4.42205 2.55833 4.38119 2.57484C4.34033 2.59134 4.29657 2.59944 4.25251 2.59867C4.20846 2.59789 4.16501 2.58824 4.12476 2.57031C4.08451 2.55238 4.04828 2.52652 4.01824 2.49428L2.82824 1.30483V11.0939L4.01824 9.90444C4.07991 9.84313 4.16339 9.80882 4.25034 9.80902C4.3373 9.80923 4.42061 9.84394 4.48199 9.90553Z'
        fill='#1F2937'
      />
    </svg>
  )
}

export const ArrowHorizontalIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 13 5'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M12.4195 2.43194L10.6695 4.18194C10.6073 4.2399 10.525 4.27146 10.44 4.26996C10.355 4.26846 10.2739 4.23402 10.2137 4.1739C10.1536 4.11378 10.1192 4.03268 10.1177 3.94767C10.1162 3.86266 10.1477 3.78039 10.2057 3.71819L11.3952 2.52819H1.6061L2.79555 3.71819C2.82779 3.74823 2.85365 3.78446 2.87158 3.82471C2.88951 3.86496 2.89916 3.90841 2.89993 3.95246C2.90071 3.99652 2.89261 4.04028 2.8761 4.08114C2.8596 4.122 2.83504 4.15911 2.80388 4.19027C2.77272 4.22143 2.73561 4.24599 2.69475 4.2625C2.65389 4.279 2.61013 4.2871 2.56607 4.28633C2.52202 4.28555 2.47857 4.27591 2.43832 4.25797C2.39807 4.24004 2.36184 4.21418 2.3318 4.18194L0.581801 2.43194C0.520354 2.37042 0.48584 2.28702 0.48584 2.20007C0.48584 2.11311 0.520354 2.02972 0.581801 1.96819L2.3318 0.218192C2.394 0.160232 2.47627 0.128678 2.56128 0.130178C2.64629 0.131678 2.72739 0.166115 2.78751 0.226233C2.84763 0.286351 2.88207 0.367457 2.88357 0.452464C2.88507 0.537471 2.85351 0.619741 2.79555 0.681942L1.605 1.87194H11.3941L10.2046 0.681942C10.1467 0.619741 10.1151 0.537471 10.1166 0.452464C10.1181 0.367457 10.1525 0.286351 10.2127 0.226233C10.2728 0.166115 10.3539 0.131678 10.4389 0.130178C10.5239 0.128678 10.6062 0.160232 10.6684 0.218192L12.4184 1.96819C12.48 2.02957 12.5147 2.11289 12.5149 2.19984C12.5151 2.28679 12.4808 2.37027 12.4195 2.43194Z'
        fill='#1F2937'
      />
    </svg>
  )
}

export const ShareArrowIcon: IconComponent = (props) => {
  return (
    <FontAwesomeIcon icon={faSquareShareNodes} className={props.className} />
  )
}

export const MaximizeIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      width='42'
      height='43'
      viewBox='0 0 42 43'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <mask
        id='mask0_397_1719'
        style={{ maskType: 'luminance' }}
        maskUnits='userSpaceOnUse'
        x='25'
        y='1'
        width='15'
        height='16'
      >
        <path
          d='M25.1831 1.64648H39.2363V16.211H25.1831V1.64648Z'
          fill='white'
        />
      </mask>
      <g mask='url(#mask0_397_1719)'>
        <path
          d='M37.8172 1.64648H26.3224C25.694 1.64648 25.1851 2.17387 25.1851 2.82497V2.84845C25.1851 3.49956 25.694 4.02694 26.3224 4.02694H35.3142L25.7655 13.9217C25.3215 14.3814 25.3215 15.1278 25.7655 15.5879L25.782 15.6046C26.2256 16.0647 26.946 16.0647 27.39 15.6046L36.9387 5.71024V15.028C36.9387 15.6786 37.4481 16.206 38.0761 16.206H38.0992C38.7271 16.206 39.2365 15.6786 39.2365 15.028V3.11711C39.2365 2.30481 38.6011 1.64648 37.8172 1.64648Z'
          fill='white'
        />
      </g>
      <mask
        id='mask1_397_1719'
        style={{ maskType: 'luminance' }}
        maskUnits='userSpaceOnUse'
        x='3'
        y='24'
        width='15'
        height='16'
      >
        <path d='M3.0957 24.5352H17.1515V39.097H3.0957V24.5352Z' fill='white' />
      </mask>
      <g mask='url(#mask1_397_1719)'>
        <path
          d='M16.0098 36.7162H7.01752L16.5663 26.8218C17.0107 26.3617 17.0107 25.6154 16.5663 25.1557L16.5501 25.1385C16.1061 24.6784 15.3862 24.6784 14.9422 25.1385L5.39301 35.0329V25.7151C5.39301 25.0645 4.88405 24.5371 4.25569 24.5371H4.23303C3.60467 24.5371 3.0957 25.0645 3.0957 25.7151V37.6265C3.0957 38.4388 3.73104 39.0971 4.51496 39.0971H16.0098C16.6382 39.0971 17.1471 38.5693 17.1471 37.9186V37.8947C17.1471 37.244 16.6382 36.7162 16.0098 36.7162Z'
          fill='white'
        />
      </g>
    </svg>
  )
}

export const MinimizeIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      width='42'
      height='43'
      viewBox='0 0 42 43'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <mask
        id='mask0_397_1719'
        style={{ maskType: 'luminance' }}
        maskUnits='userSpaceOnUse'
        x='25'
        y='1'
        width='15'
        height='16'
      >
        <path
          d='M39.2363 16.2109H25.1832V1.64642L39.2363 1.64642V16.2109Z'
          fill='white'
        />
      </mask>
      <g mask='url(#mask0_397_1719)'>
        <path
          d='M26.6022 16.2109H38.097C38.7254 16.2109 39.2344 15.6836 39.2344 15.0324V15.009C39.2344 14.3579 38.7254 13.8305 38.097 13.8305L29.1052 13.8305L38.6539 3.93567C39.098 3.47602 39.098 2.72964 38.6539 2.26953L38.6374 2.25282C38.1938 1.79272 37.4735 1.79272 37.0294 2.25282L27.4807 12.1472V2.82943C27.4807 2.17877 26.9713 1.65139 26.3434 1.65139H26.3203C25.6924 1.65139 25.183 2.17877 25.183 2.82943V14.7403C25.183 15.5526 25.8183 16.2109 26.6022 16.2109Z'
          fill='white'
        />
      </g>
      <mask
        id='mask1_397_1719'
        style={{ maskType: 'luminance' }}
        maskUnits='userSpaceOnUse'
        x='3'
        y='24'
        width='15'
        height='16'
      >
        <path
          d='M17.1514 39.0957H3.09559V24.5339H17.1514V39.0957Z'
          fill='white'
        />
      </mask>
      <g mask='url(#mask1_397_1719)'>
        <path
          d='M4.23727 26.9147H13.2296L3.68081 36.809C3.23634 37.2691 3.23634 38.0155 3.68081 38.4752L3.69693 38.4923C4.14097 38.9524 4.86084 38.9524 5.30488 38.4923L14.8541 28.598V37.9157C14.8541 38.5664 15.363 39.0938 15.9914 39.0938H16.014C16.6424 39.0938 17.1514 38.5664 17.1514 37.9157V26.0044C17.1514 25.1921 16.516 24.5337 15.7321 24.5337H4.23727C3.60891 24.5337 3.09995 25.0616 3.09995 25.7122V25.7362C3.09995 26.3868 3.60891 26.9147 4.23727 26.9147Z'
          fill='white'
        />
      </g>
    </svg>
  )
}

export const PaperAirplaneIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5'
      />
    </svg>
  )
}

export const LinkIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 16 16'
    >
      <path
        fillOpacity='1'
        fillRule='nonzero'
        stroke='none'
        d='m5.525 13.657 2.652-2.652.707.707-2.652 2.652c-1.269 1.27-3.327 1.27-4.596 0-1.27-1.27-1.27-3.327 0-4.596l2.652-2.652.707.707-2.652 2.652c-.879.879-.879 2.303 0 3.182.879.879 2.303.879 3.182 0zm6.187-4.773-.707-.707 2.652-2.652c.879-.879.879-2.303 0-3.182-.879-.879-2.303-.879-3.182 0L7.823 4.995l-.707-.707 2.652-2.652c1.269-1.27 3.327-1.27 4.596 0 1.27 1.27 1.27 3.327 0 4.596l-2.652 2.652zm-5.45 1.62 4.242-4.242-.766-.766-4.242 4.242.766.766z'
      ></path>
    </svg>
  )
}

export const RectangleListIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faRectangleList} className={props.className} />
}

export const BagIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 18 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M17 5.923A1 1 0 0 0 16 5h-3V4a4 4 0 1 0-8 0v1H2a1 1 0 0 0-1 .923L.086 17.846A2 2 0 0 0 2.08 20h13.84a2 2 0 0 0 1.994-2.153L17 5.923ZM7 9a1 1 0 0 1-2 0V7h2v2Zm0-5a2 2 0 1 1 4 0v1H7V4Zm6 5a1 1 0 1 1-2 0V7h2v2Z' />
    </svg>
  )
}

export const Cog6ToothIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
      />
    </svg>
  )
}

export const GitBranchIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faCodeBranch} className={props.className} />
}

export const GitPullRequestIcon: IconComponent = (props) => {
  return (
    <FontAwesomeIcon icon={faCodePullRequest} className={props.className} />
  )
}

export const PlayIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faCirclePlay} className={props.className} />
}

export const SigninIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      viewBox='0 0 18 16'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
      />
    </svg>
  )
}

export const EditDocumentIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z' />
      <path d='M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z' />
      <path d='M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z' />
    </svg>
  )
}

export const DocumentDuplicateIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const MapPinIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15 10.5a3 3 0 11-6 0 3 3 0 016 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const HamburgerIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden='true'
      fill='currentColor'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        clipRule='evenodd'
        d='M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z'
        fillRule='evenodd'
      />
    </svg>
  )
}

export const ChartPieIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const AttachmentIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden='true'
      fill='currentColor'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z' />
      <path d='M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z' />
    </svg>
  )
}

export const EllipsisHorizontalIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ClockIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const Bars3Icon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const PaperClipIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const FaceFrownIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const FaceSmileIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const FireIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const HandThumbUpIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const HeartIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const CheckCircleSolidIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        clipRule='evenodd'
        d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z'
        fillRule='evenodd'
      />
    </svg>
  )
}

export const RightArrowIcon: IconComponent = (props) => {
  return (
    <svg {...props} viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
      <path
        clipRule='evenodd'
        d='M20 10C20 4.48 15.52 0 10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10ZM6 9H10V6L14 10L10 14V11H6V9Z'
        fillRule='evenodd'
      />
    </svg>
  )
}

export const CalendarIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ChevronLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.75 19.5L8.25 12l7.5-7.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ChevronRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M8.25 4.5l7.5 7.5-7.5 7.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const ExclamationIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const CheckmarkIcon: IconComponent = (props) => {
  return (
    <svg {...props} viewBox='0 0 14 14' xmlns='http://www.w3.org/2000/svg'>
      <path d='M10.346 3.301a.929.929 0 0 1 1.37 0 1.076 1.076 0 0 1 0 1.456l-4.64 4.94a.929.929 0 0 1-1.37 0L3.284 7.123a1.076 1.076 0 0 1 0-1.456.929.929 0 0 1 1.37 0L6.39 7.513l3.955-4.212z' />
    </svg>
  )
}

export const CheckmarkSolidIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        clipRule='evenodd'
        d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z'
        fillRule='evenodd'
      />
    </svg>
  )
}

export const XMarkIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='30 25 60 60'
      fill='#11283B'
      xmlns='http://www.w3.org/2000/svg'
    >
      <mask
        id='mask0_466_808'
        style={{ maskType: 'luminance' }}
        maskUnits='userSpaceOnUse'
        x='7'
        y='0'
        width='106'
        height='106'
      >
        <path
          d='M7.65576 52.8192L59.9959 0.47906L112.248 52.7309L59.9076 105.071L7.65576 52.8192Z'
          fill='white'
        />
      </mask>
      <g mask='url(#mask0_466_808)'>
        <path d='M83.3691 26.6073L59.9541 50.0223L36.5786 26.6468C36.4879 26.5561 36.3896 26.4755 36.2837 26.405C36.1772 26.3338 36.0657 26.274 35.9472 26.2249C35.8293 26.1765 35.7077 26.1394 35.5822 26.1149C35.4568 26.0904 35.3307 26.0779 35.2027 26.0774C35.0747 26.0781 34.948 26.0902 34.8231 26.1155C34.6976 26.1402 34.5759 26.1775 34.4573 26.2268C34.3394 26.2754 34.2277 26.3354 34.1211 26.4068C34.0145 26.4781 33.9161 26.5589 33.8258 26.6491C33.7356 26.7394 33.6548 26.8378 33.5835 26.9444C33.5128 27.0504 33.4522 27.1627 33.4035 27.2806C33.3542 27.3992 33.3176 27.5203 33.2922 27.6464C33.2669 27.7713 33.2548 27.898 33.2547 28.0254C33.2546 28.154 33.2671 28.2801 33.2916 28.4055C33.3167 28.5303 33.3532 28.6526 33.4022 28.7699C33.4513 28.8883 33.5105 29.0005 33.5817 29.107C33.6522 29.2129 33.7328 29.3112 33.8235 29.4019L57.199 52.7774L33.784 76.1924C33.6938 76.2826 33.613 76.3811 33.5417 76.4877C33.471 76.5937 33.411 76.7066 33.3617 76.8239C33.3124 76.9425 33.2751 77.0642 33.2504 77.1897C33.2257 77.3152 33.213 77.4413 33.2129 77.5699C33.2128 77.6972 33.2253 77.8233 33.2498 77.9488C33.2742 78.0742 33.3113 78.1959 33.3604 78.3144C33.4089 78.4322 33.4693 78.5444 33.5398 78.6503C33.611 78.7568 33.6916 78.8551 33.7817 78.9451C33.8718 79.0352 33.9701 79.1159 34.0766 79.187C34.1824 79.2575 34.2946 79.318 34.4125 79.3664C34.531 79.4155 34.652 79.452 34.7781 79.4771C34.9035 79.5016 35.0296 79.5141 35.157 79.514C35.2856 79.5138 35.4117 79.5011 35.5372 79.4764C35.662 79.4511 35.7844 79.4144 35.903 79.3652C36.0203 79.3159 36.1332 79.2559 36.2392 79.1852C36.3458 79.1138 36.4442 79.0331 36.5344 78.9428L59.9494 55.5278L83.325 78.9033C83.4157 78.994 83.514 79.0747 83.6198 79.1452C83.7263 79.2163 83.8385 79.2755 83.957 79.3246C84.0742 79.3737 84.1965 79.4101 84.3213 79.4353C84.4468 79.4597 84.5729 79.4722 84.7015 79.4721C84.8288 79.472 84.9549 79.4593 85.0804 79.4346C85.2066 79.4093 85.3276 79.3726 85.4462 79.3233C85.5642 79.2747 85.6764 79.2141 85.7824 79.1434C85.889 79.072 85.9875 78.9912 86.0777 78.901C86.1679 78.8108 86.2487 78.7123 86.3201 78.6057C86.3914 78.4991 86.4514 78.3875 86.5 78.2695C86.5493 78.1509 86.5866 78.0292 86.6113 77.9037C86.636 77.7783 86.6487 77.6521 86.6495 77.5241C86.6489 77.3962 86.6364 77.2701 86.612 77.1446C86.5875 77.0192 86.5504 76.8975 86.5019 76.7797C86.4529 76.6612 86.393 76.5496 86.3219 76.4431C86.2514 76.3373 86.1707 76.239 86.08 76.1483L62.7045 52.7727L86.1195 29.3577C86.2104 29.2669 86.2912 29.1685 86.3619 29.0625C86.4332 28.9559 86.4926 28.8436 86.5425 28.7256C86.5911 28.6077 86.6278 28.4853 86.6531 28.3605C86.6778 28.235 86.6912 28.1082 86.6907 27.9803C86.6908 27.8529 86.6789 27.7262 86.6538 27.6014C86.6287 27.4753 86.5922 27.3543 86.5431 27.2358C86.4947 27.1179 86.4342 27.0057 86.3637 26.8999C86.2926 26.7934 86.2119 26.6951 86.1218 26.605C86.0318 26.5149 85.9335 26.4343 85.827 26.3631C85.7211 26.2926 85.6089 26.2322 85.4911 26.1837C85.3726 26.1346 85.2509 26.0975 85.1255 26.0731C85.0007 26.048 84.8739 26.0361 84.7466 26.0362C84.6186 26.0357 84.4918 26.049 84.3664 26.0737C84.2409 26.0984 84.1192 26.1357 84.0012 26.1844C83.8833 26.2343 83.771 26.2936 83.6644 26.365C83.5584 26.4357 83.46 26.5164 83.3691 26.6073Z' />
      </g>
    </svg>
  )
}

export const FilterIcon: IconComponent = (props) => {
  return (
    <svg {...props} viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M13.994.004c.555 0 1.006.448 1.006 1a.997.997 0 0 1-.212.614l-5.782 7.39L9 13.726a1 1 0 0 1-.293.708L7.171 15.97A.1.1 0 0 1 7 15.9V9.008l-5.788-7.39A.996.996 0 0 1 1.389.214a1.01 1.01 0 0 1 .617-.21z'
        fillRule='evenodd'
      />
    </svg>
  )
}

export const PhotoIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const HomeIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const DocumentTextIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const FolderIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export const UploadIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill='none'
      viewBox='0 0 20 16'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
      />
    </svg>
  )
}

export const ToggleIcon: React.FunctionComponent<{
  icon: IconComponent
  selected: boolean
  className: string
}> = ({ icon: Icon, selected, className }) => {
  return (
    <Icon
      aria-hidden='true'
      className={getClass(
        !className
          ? selected
            ? 'hw-text-primary'
            : 'hw-text-gray-400 group-hover:hw-text-primary'
          : '',
        'hw-h-6 hw-w-6 hw-shrink-0',
        className,
      )}
    />
  )
}

export const SendIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 45 37'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g clipPath='url(#clip0_673_28)'>
        <path
          d='M6.56659 14.796C5.68643 14.5015 5.67771 14.026 6.58321 13.7232L38.7628 2.95697C39.6546 2.65915 40.1653 3.16011 39.916 4.03689L30.7209 36.3351C30.4678 37.2307 29.9538 37.2611 29.5761 36.4115L23.5168 22.7246L33.6323 9.18621L20.145 19.3397L6.56659 14.796Z'
          fill='white'
        />
      </g>
      <defs>
        <clipPath id='clip0_673_28'>
          <rect width='45' height='37' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

export const QuestionMarkIcon: IconComponent = (props) => {
  return <FontAwesomeIcon className={props.className} icon={faCircleQuestion} />
}

export const StackIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 20 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M0.417406 6.76839L9.75034 12.1015C9.82635 12.1454 9.91256 12.1685 10.0003 12.1685C10.0881 12.1685 10.1743 12.1454 10.2503 12.1015L19.5833 6.76839C19.6598 6.72466 19.7234 6.66147 19.7677 6.58523C19.8119 6.50899 19.8353 6.4224 19.8353 6.33424C19.8353 6.24608 19.8119 6.15949 19.7677 6.08325C19.7234 6.007 19.6598 5.94381 19.5833 5.90009L10.2503 0.566984C10.1743 0.523102 10.0881 0.5 10.0003 0.5C9.91256 0.5 9.82635 0.523102 9.75034 0.566984L0.417406 5.90009C0.340856 5.94381 0.277228 6.007 0.232972 6.08325C0.188717 6.15949 0.165407 6.24608 0.165407 6.33424C0.165407 6.4224 0.188717 6.50899 0.232972 6.58523C0.277228 6.66147 0.340856 6.72466 0.417406 6.76839ZM10.0003 1.57694L18.3258 6.33424L10.0003 11.0915L1.67485 6.33424L10.0003 1.57694ZM19.7674 9.41744C19.8 9.47445 19.8211 9.53733 19.8294 9.60248C19.8378 9.66764 19.8332 9.7338 19.8159 9.79718C19.7987 9.86056 19.7691 9.91992 19.7289 9.97186C19.6887 10.0238 19.6386 10.0673 19.5816 10.0999L10.2487 15.433C10.1726 15.4769 10.0864 15.5 9.99866 15.5C9.9109 15.5 9.82468 15.4769 9.74867 15.433L0.415739 10.0999C0.300596 10.0336 0.216507 9.92428 0.18197 9.79598C0.147434 9.66768 0.165279 9.53092 0.231581 9.41577C0.297882 9.30063 0.407208 9.21654 0.535509 9.182C0.663809 9.14747 0.800575 9.16531 0.915718 9.23162L9.99866 14.4231L19.0816 9.23162C19.1388 9.19846 19.2019 9.17696 19.2674 9.16836C19.3329 9.15976 19.3995 9.16423 19.4633 9.18151C19.527 9.19879 19.5867 9.22853 19.639 9.26903C19.6912 9.30953 19.7348 9.35997 19.7674 9.41744Z'
        fill='black'
      />
      <path
        d='M0.417406 6.76839L9.75034 12.1015C9.82635 12.1454 9.91256 12.1685 10.0003 12.1685C10.0881 12.1685 10.1743 12.1454 10.2503 12.1015L19.5833 6.76839C19.6598 6.72466 19.7234 6.66147 19.7677 6.58523C19.8119 6.50899 19.8353 6.4224 19.8353 6.33424C19.8353 6.24608 19.8119 6.15949 19.7677 6.08325C19.7234 6.007 19.6598 5.94381 19.5833 5.90009L10.2503 0.566984C10.1743 0.523102 10.0881 0.5 10.0003 0.5C9.91256 0.5 9.82635 0.523102 9.75034 0.566984L0.417406 5.90009C0.340856 5.94381 0.277228 6.007 0.232972 6.08325C0.188717 6.15949 0.165407 6.24608 0.165407 6.33424C0.165407 6.4224 0.188717 6.50899 0.232972 6.58523C0.277228 6.66147 0.340856 6.72466 0.417406 6.76839ZM10.0003 1.57694L18.3258 6.33424L10.0003 11.0915L1.67485 6.33424L10.0003 1.57694ZM19.7674 9.41744C19.8 9.47445 19.8211 9.53733 19.8294 9.60248C19.8378 9.66764 19.8332 9.7338 19.8159 9.79718C19.7987 9.86056 19.7691 9.91992 19.7289 9.97186C19.6887 10.0238 19.6386 10.0673 19.5816 10.0999L10.2487 15.433C10.1726 15.4769 10.0864 15.5 9.99866 15.5C9.9109 15.5 9.82468 15.4769 9.74867 15.433L0.415739 10.0999C0.300596 10.0336 0.216507 9.92428 0.18197 9.79598C0.147434 9.66768 0.165279 9.53092 0.231581 9.41577C0.297882 9.30063 0.407208 9.21654 0.535509 9.182C0.663809 9.14747 0.800575 9.16531 0.915718 9.23162L9.99866 14.4231L19.0816 9.23162C19.1388 9.19846 19.2019 9.17696 19.2674 9.16836C19.3329 9.15976 19.3995 9.16423 19.4633 9.18151C19.527 9.19879 19.5867 9.22853 19.639 9.26903C19.6912 9.30953 19.7348 9.35997 19.7674 9.41744Z'
        fill='black'
        fillOpacity='0.2'
      />
    </svg>
  )
}

export const TextIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M15.3125 1.25V4.25C15.3125 4.39918 15.2532 4.54226 15.1477 4.64775C15.0423 4.75324 14.8992 4.8125 14.75 4.8125C14.6008 4.8125 14.4577 4.75324 14.3523 4.64775C14.2468 4.54226 14.1875 4.39918 14.1875 4.25V1.8125H8.5625V14.1875H11C11.1492 14.1875 11.2923 14.2468 11.3977 14.3523C11.5032 14.4577 11.5625 14.6008 11.5625 14.75C11.5625 14.8992 11.5032 15.0423 11.3977 15.1477C11.2923 15.2532 11.1492 15.3125 11 15.3125H5C4.85082 15.3125 4.70774 15.2532 4.60225 15.1477C4.49676 15.0423 4.4375 14.8992 4.4375 14.75C4.4375 14.6008 4.49676 14.4577 4.60225 14.3523C4.70774 14.2468 4.85082 14.1875 5 14.1875H7.4375V1.8125H1.8125V4.25C1.8125 4.39918 1.75324 4.54226 1.64775 4.64775C1.54226 4.75324 1.39918 4.8125 1.25 4.8125C1.10082 4.8125 0.957742 4.75324 0.852252 4.64775C0.746763 4.54226 0.6875 4.39918 0.6875 4.25V1.25C0.6875 1.10082 0.746763 0.957742 0.852252 0.852252C0.957742 0.746763 1.10082 0.6875 1.25 0.6875H14.75C14.8992 0.6875 15.0423 0.746763 15.1477 0.852252C15.2532 0.957742 15.3125 1.10082 15.3125 1.25Z'
        fill='black'
      />
      <path
        d='M15.3125 1.25V4.25C15.3125 4.39918 15.2532 4.54226 15.1477 4.64775C15.0423 4.75324 14.8992 4.8125 14.75 4.8125C14.6008 4.8125 14.4577 4.75324 14.3523 4.64775C14.2468 4.54226 14.1875 4.39918 14.1875 4.25V1.8125H8.5625V14.1875H11C11.1492 14.1875 11.2923 14.2468 11.3977 14.3523C11.5032 14.4577 11.5625 14.6008 11.5625 14.75C11.5625 14.8992 11.5032 15.0423 11.3977 15.1477C11.2923 15.2532 11.1492 15.3125 11 15.3125H5C4.85082 15.3125 4.70774 15.2532 4.60225 15.1477C4.49676 15.0423 4.4375 14.8992 4.4375 14.75C4.4375 14.6008 4.49676 14.4577 4.60225 14.3523C4.70774 14.2468 4.85082 14.1875 5 14.1875H7.4375V1.8125H1.8125V4.25C1.8125 4.39918 1.75324 4.54226 1.64775 4.64775C1.54226 4.75324 1.39918 4.8125 1.25 4.8125C1.10082 4.8125 0.957742 4.75324 0.852252 4.64775C0.746763 4.54226 0.6875 4.39918 0.6875 4.25V1.25C0.6875 1.10082 0.746763 0.957742 0.852252 0.852252C0.957742 0.746763 1.10082 0.6875 1.25 0.6875H14.75C14.8992 0.6875 15.0423 0.746763 15.1477 0.852252C15.2532 0.957742 15.3125 1.10082 15.3125 1.25Z'
        fill='black'
        fillOpacity='0.2'
      />
    </svg>
  )
}

export const SparklesIcon: IconComponent = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      fill='none'
      viewBox='0 0 24 24'
      {...props}
    >
      <path
        fill='currentColor'
        d='M6.394 4.444c.188-.592 1.024-.592 1.212 0C8.4 8.9 9.1 9.6 13.556 10.394c.592.188.592 1.024 0 1.212C9.1 12.4 8.4 13.1 7.606 17.556c-.188.592-1.024.592-1.212 0C5.6 13.1 4.9 12.4.444 11.606c-.592-.188-.592-1.024 0-1.212C4.9 9.6 5.6 8.9 6.394 4.444m8.716 9.841a.41.41 0 0 1 .78 0c.51 2.865.96 3.315 3.825 3.826.38.12.38.658 0 .778-2.865.511-3.315.961-3.826 3.826a.408.408 0 0 1-.778 0c-.511-2.865-.961-3.315-3.826-3.826a.408.408 0 0 1 0-.778c2.865-.511 3.315-.961 3.826-3.826Zm2.457-12.968a.454.454 0 0 1 .866 0C19 4.5 19.5 5 22.683 5.567a.454.454 0 0 1 0 .866C19.5 7 19 7.5 18.433 10.683a.454.454 0 0 1-.866 0C17 7.5 16.5 7 13.317 6.433a.454.454 0 0 1 0-.866C16.5 5 17 4.5 17.567 1.317'
      ></path>
    </svg>
  )
}

export const LogsIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 18 22'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M16.7278 2.86437L4.51688 0.708121C4.17456 0.648731 3.82267 0.727486 3.53833 0.927122C3.25399 1.12676 3.0604 1.43099 3 1.77312L0.210937 17.6169C0.180989 17.7866 0.184782 17.9607 0.2221 18.129C0.259417 18.2973 0.329528 18.4566 0.428427 18.5978C0.527327 18.739 0.653077 18.8594 0.798495 18.952C0.943913 19.0446 1.10615 19.1076 1.27594 19.1375L13.4869 21.2937C13.563 21.3076 13.6402 21.3145 13.7175 21.3144C14.0248 21.3119 14.3214 21.2017 14.5558 21.003C14.7901 20.8042 14.9473 20.5296 15 20.2269L17.7891 4.38312C17.8491 4.04107 17.7711 3.68918 17.5722 3.40452C17.3733 3.11985 17.0696 2.92562 16.7278 2.86437ZM16.6875 4.19L13.8984 20.0337C13.8943 20.0581 13.8854 20.0814 13.8722 20.1024C13.859 20.1233 13.8418 20.1414 13.8216 20.1556C13.7809 20.184 13.7307 20.1951 13.6819 20.1866L1.46719 18.0312C1.4423 18.0273 1.41846 18.0184 1.39709 18.005C1.37573 17.9917 1.35727 17.9741 1.34283 17.9535C1.32839 17.9328 1.31827 17.9095 1.31305 17.8848C1.30784 17.8602 1.30765 17.8347 1.3125 17.81L4.10156 1.96625C4.10571 1.94187 4.11463 1.91855 4.12783 1.89763C4.14102 1.87671 4.15822 1.85861 4.17844 1.84437C4.22018 1.81526 4.27173 1.80381 4.32188 1.8125L16.5328 3.96875C16.5577 3.97269 16.5815 3.9816 16.6029 3.99496C16.6243 4.00832 16.6427 4.02585 16.6572 4.0465C16.6716 4.06716 16.6817 4.09051 16.6869 4.11516C16.6922 4.13982 16.6923 4.16527 16.6875 4.19ZM14.4478 6.07906C14.4257 6.20987 14.3581 6.32866 14.2568 6.41444C14.1556 6.50021 14.0274 6.54745 13.8947 6.54781C13.8617 6.5478 13.8288 6.54497 13.7963 6.53937L6.015 5.165C5.94034 5.1543 5.86859 5.1287 5.80402 5.08972C5.73945 5.05073 5.68338 4.99916 5.63914 4.93807C5.59491 4.87697 5.56341 4.80761 5.54652 4.7341C5.52964 4.66059 5.52771 4.58443 5.54086 4.51016C5.554 4.43588 5.58195 4.36501 5.62303 4.30176C5.66412 4.23851 5.71751 4.18417 5.78003 4.14196C5.84254 4.09976 5.9129 4.07057 5.98693 4.05611C6.06096 4.04165 6.13714 4.04223 6.21094 4.05781L13.9922 5.43125C14.1382 5.45734 14.268 5.54005 14.3533 5.66137C14.4387 5.7827 14.4726 5.93282 14.4478 6.07906ZM13.9275 9.03125C13.9054 9.16206 13.8377 9.28085 13.7365 9.36663C13.6353 9.4524 13.507 9.49964 13.3744 9.5C13.3429 9.49975 13.3115 9.49661 13.2806 9.49062L5.49938 8.11718C5.35243 8.0912 5.22182 8.00791 5.13629 7.88563C5.05075 7.76335 5.0173 7.6121 5.04328 7.46515C5.06926 7.31821 5.15256 7.1876 5.27484 7.10207C5.39712 7.01653 5.54837 6.98308 5.69531 7.00906L13.4766 8.38343C13.6217 8.4106 13.7504 8.49377 13.8347 8.61497C13.9191 8.73617 13.9524 8.88569 13.9275 9.03125ZM9.52125 11.2991C9.49812 11.4292 9.42992 11.547 9.32861 11.6318C9.2273 11.7167 9.09934 11.7632 8.96719 11.7631C8.9342 11.763 8.90127 11.7602 8.86875 11.7547L4.97906 11.0675C4.9044 11.0568 4.83265 11.0312 4.76808 10.9922C4.70351 10.9532 4.64744 10.9017 4.6032 10.8406C4.55897 10.7795 4.52747 10.7101 4.51059 10.6366C4.4937 10.5631 4.49178 10.4869 4.50492 10.4127C4.51806 10.3384 4.54601 10.2675 4.5871 10.2043C4.62818 10.141 4.68157 10.0867 4.74409 10.0445C4.8066 10.0023 4.87697 9.97307 4.95099 9.95861C5.02502 9.94415 5.1012 9.94473 5.175 9.96031L9.06469 10.6466C9.13758 10.6597 9.20716 10.687 9.26945 10.7271C9.33174 10.7671 9.3855 10.8191 9.42766 10.88C9.46982 10.9409 9.49954 11.0095 9.51512 11.0819C9.5307 11.1543 9.53182 11.229 9.51844 11.3019L9.52125 11.2991Z'
        fill='black'
      />
      <path
        d='M16.7278 2.86437L4.51688 0.708121C4.17456 0.648731 3.82267 0.727486 3.53833 0.927122C3.25399 1.12676 3.0604 1.43099 3 1.77312L0.210937 17.6169C0.180989 17.7866 0.184782 17.9607 0.2221 18.129C0.259417 18.2973 0.329528 18.4566 0.428427 18.5978C0.527327 18.739 0.653077 18.8594 0.798495 18.952C0.943913 19.0446 1.10615 19.1076 1.27594 19.1375L13.4869 21.2937C13.563 21.3076 13.6402 21.3145 13.7175 21.3144C14.0248 21.3119 14.3214 21.2017 14.5558 21.003C14.7901 20.8042 14.9473 20.5296 15 20.2269L17.7891 4.38312C17.8491 4.04107 17.7711 3.68918 17.5722 3.40452C17.3733 3.11985 17.0696 2.92562 16.7278 2.86437ZM16.6875 4.19L13.8984 20.0337C13.8943 20.0581 13.8854 20.0814 13.8722 20.1024C13.859 20.1233 13.8418 20.1414 13.8216 20.1556C13.7809 20.184 13.7307 20.1951 13.6819 20.1866L1.46719 18.0312C1.4423 18.0273 1.41846 18.0184 1.39709 18.005C1.37573 17.9917 1.35727 17.9741 1.34283 17.9535C1.32839 17.9328 1.31827 17.9095 1.31305 17.8848C1.30784 17.8602 1.30765 17.8347 1.3125 17.81L4.10156 1.96625C4.10571 1.94187 4.11463 1.91855 4.12783 1.89763C4.14102 1.87671 4.15822 1.85861 4.17844 1.84437C4.22018 1.81526 4.27173 1.80381 4.32188 1.8125L16.5328 3.96875C16.5577 3.97269 16.5815 3.9816 16.6029 3.99496C16.6243 4.00832 16.6427 4.02585 16.6572 4.0465C16.6716 4.06716 16.6817 4.09051 16.6869 4.11516C16.6922 4.13982 16.6923 4.16527 16.6875 4.19ZM14.4478 6.07906C14.4257 6.20987 14.3581 6.32866 14.2568 6.41444C14.1556 6.50021 14.0274 6.54745 13.8947 6.54781C13.8617 6.5478 13.8288 6.54497 13.7963 6.53937L6.015 5.165C5.94034 5.1543 5.86859 5.1287 5.80402 5.08972C5.73945 5.05073 5.68338 4.99916 5.63914 4.93807C5.59491 4.87697 5.56341 4.80761 5.54652 4.7341C5.52964 4.66059 5.52771 4.58443 5.54086 4.51016C5.554 4.43588 5.58195 4.36501 5.62303 4.30176C5.66412 4.23851 5.71751 4.18417 5.78003 4.14196C5.84254 4.09976 5.9129 4.07057 5.98693 4.05611C6.06096 4.04165 6.13714 4.04223 6.21094 4.05781L13.9922 5.43125C14.1382 5.45734 14.268 5.54005 14.3533 5.66137C14.4387 5.7827 14.4726 5.93282 14.4478 6.07906ZM13.9275 9.03125C13.9054 9.16206 13.8377 9.28085 13.7365 9.36663C13.6353 9.4524 13.507 9.49964 13.3744 9.5C13.3429 9.49975 13.3115 9.49661 13.2806 9.49062L5.49938 8.11718C5.35243 8.0912 5.22182 8.00791 5.13629 7.88563C5.05075 7.76335 5.0173 7.6121 5.04328 7.46515C5.06926 7.31821 5.15256 7.1876 5.27484 7.10207C5.39712 7.01653 5.54837 6.98308 5.69531 7.00906L13.4766 8.38343C13.6217 8.4106 13.7504 8.49377 13.8347 8.61497C13.9191 8.73617 13.9524 8.88569 13.9275 9.03125ZM9.52125 11.2991C9.49812 11.4292 9.42992 11.547 9.32861 11.6318C9.2273 11.7167 9.09934 11.7632 8.96719 11.7631C8.9342 11.763 8.90127 11.7602 8.86875 11.7547L4.97906 11.0675C4.9044 11.0568 4.83265 11.0312 4.76808 10.9922C4.70351 10.9532 4.64744 10.9017 4.6032 10.8406C4.55897 10.7795 4.52747 10.7101 4.51059 10.6366C4.4937 10.5631 4.49178 10.4869 4.50492 10.4127C4.51806 10.3384 4.54601 10.2675 4.5871 10.2043C4.62818 10.141 4.68157 10.0867 4.74409 10.0445C4.8066 10.0023 4.87697 9.97307 4.95099 9.95861C5.02502 9.94415 5.1012 9.94473 5.175 9.96031L9.06469 10.6466C9.13758 10.6597 9.20716 10.687 9.26945 10.7271C9.33174 10.7671 9.3855 10.8191 9.42766 10.88C9.46982 10.9409 9.49954 11.0095 9.51512 11.0819C9.5307 11.1543 9.53182 11.229 9.51844 11.3019L9.52125 11.2991Z'
        fill='black'
        fillOpacity='0.2'
      />
    </svg>
  )
}
export const ChatTeardropIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 19 19'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.375 0.4375C6.93916 0.44023 4.60387 1.40907 2.88147 3.13147C1.15907 4.85387 0.19023 7.18916 0.1875 9.625V17.5C0.1875 17.8481 0.325781 18.1819 0.571922 18.4281C0.818064 18.6742 1.1519 18.8125 1.5 18.8125H9.375C11.8117 18.8125 14.1486 17.8445 15.8715 16.1215C17.5945 14.3986 18.5625 12.0617 18.5625 9.625C18.5625 7.18832 17.5945 4.85145 15.8715 3.12846C14.1486 1.40547 11.8117 0.4375 9.375 0.4375ZM9.375 17.6875H1.5C1.45027 17.6875 1.40258 17.6677 1.36742 17.6326C1.33225 17.5974 1.3125 17.5497 1.3125 17.5V9.625C1.3125 8.03039 1.78536 6.47159 2.67128 5.14572C3.5572 3.81984 4.81639 2.78645 6.28961 2.17622C7.76284 1.56599 9.38394 1.40633 10.9479 1.71742C12.5119 2.02851 13.9485 2.79639 15.076 3.92395C16.2036 5.05151 16.9715 6.48811 17.2826 8.05208C17.5937 9.61606 17.434 11.2372 16.8238 12.7104C16.2135 14.1836 15.1802 15.4428 13.8543 16.3287C12.5284 17.2146 10.9696 17.6875 9.375 17.6875Z'
        fill='black'
      />
      <path
        d='M9.375 0.4375C6.93916 0.44023 4.60387 1.40907 2.88147 3.13147C1.15907 4.85387 0.19023 7.18916 0.1875 9.625V17.5C0.1875 17.8481 0.325781 18.1819 0.571922 18.4281C0.818064 18.6742 1.1519 18.8125 1.5 18.8125H9.375C11.8117 18.8125 14.1486 17.8445 15.8715 16.1215C17.5945 14.3986 18.5625 12.0617 18.5625 9.625C18.5625 7.18832 17.5945 4.85145 15.8715 3.12846C14.1486 1.40547 11.8117 0.4375 9.375 0.4375ZM9.375 17.6875H1.5C1.45027 17.6875 1.40258 17.6677 1.36742 17.6326C1.33225 17.5974 1.3125 17.5497 1.3125 17.5V9.625C1.3125 8.03039 1.78536 6.47159 2.67128 5.14572C3.5572 3.81984 4.81639 2.78645 6.28961 2.17622C7.76284 1.56599 9.38394 1.40633 10.9479 1.71742C12.5119 2.02851 13.9485 2.79639 15.076 3.92395C16.2036 5.05151 16.9715 6.48811 17.2826 8.05208C17.5937 9.61606 17.434 11.2372 16.8238 12.7104C16.2135 14.1836 15.1802 15.4428 13.8543 16.3287C12.5284 17.2146 10.9696 17.6875 9.375 17.6875Z'
        fill='black'
        fillOpacity='0.2'
      />
    </svg>
  )
}
export const MonitorPlayIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 20 19'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M13.3122 7.78125L8.81219 4.78125C8.72742 4.7247 8.62889 4.69223 8.5271 4.68732C8.42532 4.68241 8.32412 4.70524 8.2343 4.75337C8.14448 4.80151 8.06943 4.87313 8.01716 4.9606C7.96488 5.04807 7.93735 5.1481 7.9375 5.25V11.25C7.93735 11.3519 7.96488 11.4519 8.01716 11.5394C8.06943 11.6269 8.14448 11.6985 8.2343 11.7466C8.32412 11.7948 8.42532 11.8176 8.5271 11.8127C8.62889 11.8078 8.72742 11.7753 8.81219 11.7188L13.3122 8.71875C13.3895 8.66744 13.453 8.59778 13.4969 8.51599C13.5408 8.4342 13.5638 8.34282 13.5638 8.25C13.5638 8.15718 13.5408 8.0658 13.4969 7.98401C13.453 7.90222 13.3895 7.83256 13.3122 7.78125ZM9.0625 10.1991V6.30094L11.9856 8.25L9.0625 10.1991ZM17.5 0.9375H2.5C1.95299 0.9375 1.42839 1.1548 1.04159 1.54159C0.654798 1.92839 0.4375 2.45299 0.4375 3V13.5C0.4375 14.047 0.654798 14.5716 1.04159 14.9584C1.42839 15.3452 1.95299 15.5625 2.5 15.5625H17.5C18.047 15.5625 18.5716 15.3452 18.9584 14.9584C19.3452 14.5716 19.5625 14.047 19.5625 13.5V3C19.5625 2.45299 19.3452 1.92839 18.9584 1.54159C18.5716 1.1548 18.047 0.9375 17.5 0.9375ZM18.4375 13.5C18.4375 13.7486 18.3387 13.9871 18.1629 14.1629C17.9871 14.3387 17.7486 14.4375 17.5 14.4375H2.5C2.25136 14.4375 2.0129 14.3387 1.83709 14.1629C1.66127 13.9871 1.5625 13.7486 1.5625 13.5V3C1.5625 2.75136 1.66127 2.5129 1.83709 2.33709C2.0129 2.16127 2.25136 2.0625 2.5 2.0625H17.5C17.7486 2.0625 17.9871 2.16127 18.1629 2.33709C18.3387 2.5129 18.4375 2.75136 18.4375 3V13.5ZM13.5625 18C13.5625 18.1492 13.5032 18.2923 13.3977 18.3977C13.2923 18.5032 13.1492 18.5625 13 18.5625H7C6.85082 18.5625 6.70774 18.5032 6.60225 18.3977C6.49676 18.2923 6.4375 18.1492 6.4375 18C6.4375 17.8508 6.49676 17.7077 6.60225 17.6023C6.70774 17.4968 6.85082 17.4375 7 17.4375H13C13.1492 17.4375 13.2923 17.4968 13.3977 17.6023C13.5032 17.7077 13.5625 17.8508 13.5625 18Z'
        fill='black'
      />
      <path
        d='M13.3122 7.78125L8.81219 4.78125C8.72742 4.7247 8.62889 4.69223 8.5271 4.68732C8.42532 4.68241 8.32412 4.70524 8.2343 4.75337C8.14448 4.80151 8.06943 4.87313 8.01716 4.9606C7.96488 5.04807 7.93735 5.1481 7.9375 5.25V11.25C7.93735 11.3519 7.96488 11.4519 8.01716 11.5394C8.06943 11.6269 8.14448 11.6985 8.2343 11.7466C8.32412 11.7948 8.42532 11.8176 8.5271 11.8127C8.62889 11.8078 8.72742 11.7753 8.81219 11.7188L13.3122 8.71875C13.3895 8.66744 13.453 8.59778 13.4969 8.51599C13.5408 8.4342 13.5638 8.34282 13.5638 8.25C13.5638 8.15718 13.5408 8.0658 13.4969 7.98401C13.453 7.90222 13.3895 7.83256 13.3122 7.78125ZM9.0625 10.1991V6.30094L11.9856 8.25L9.0625 10.1991ZM17.5 0.9375H2.5C1.95299 0.9375 1.42839 1.1548 1.04159 1.54159C0.654798 1.92839 0.4375 2.45299 0.4375 3V13.5C0.4375 14.047 0.654798 14.5716 1.04159 14.9584C1.42839 15.3452 1.95299 15.5625 2.5 15.5625H17.5C18.047 15.5625 18.5716 15.3452 18.9584 14.9584C19.3452 14.5716 19.5625 14.047 19.5625 13.5V3C19.5625 2.45299 19.3452 1.92839 18.9584 1.54159C18.5716 1.1548 18.047 0.9375 17.5 0.9375ZM18.4375 13.5C18.4375 13.7486 18.3387 13.9871 18.1629 14.1629C17.9871 14.3387 17.7486 14.4375 17.5 14.4375H2.5C2.25136 14.4375 2.0129 14.3387 1.83709 14.1629C1.66127 13.9871 1.5625 13.7486 1.5625 13.5V3C1.5625 2.75136 1.66127 2.5129 1.83709 2.33709C2.0129 2.16127 2.25136 2.0625 2.5 2.0625H17.5C17.7486 2.0625 17.9871 2.16127 18.1629 2.33709C18.3387 2.5129 18.4375 2.75136 18.4375 3V13.5ZM13.5625 18C13.5625 18.1492 13.5032 18.2923 13.3977 18.3977C13.2923 18.5032 13.1492 18.5625 13 18.5625H7C6.85082 18.5625 6.70774 18.5032 6.60225 18.3977C6.49676 18.2923 6.4375 18.1492 6.4375 18C6.4375 17.8508 6.49676 17.7077 6.60225 17.6023C6.70774 17.4968 6.85082 17.4375 7 17.4375H13C13.1492 17.4375 13.2923 17.4968 13.3977 17.6023C13.5032 17.7077 13.5625 17.8508 13.5625 18Z'
        fill='black'
        fillOpacity='0.2'
      />
    </svg>
  )
}

export const Dots6Icon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 16 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M2.5625 1.625C2.5625 1.81042 2.50752 1.99168 2.4045 2.14585C2.30149 2.30002 2.15507 2.42018 1.98377 2.49114C1.81246 2.56209 1.62396 2.58066 1.4421 2.54449C1.26025 2.50831 1.0932 2.41902 0.962088 2.28791C0.830976 2.1568 0.741688 1.98975 0.705514 1.8079C0.669341 1.62604 0.687906 1.43754 0.758863 1.26623C0.829821 1.09493 0.949982 0.948511 1.10415 0.845498C1.25832 0.742484 1.43958 0.6875 1.625 0.6875C1.87364 0.6875 2.1121 0.786272 2.28791 0.962088C2.46373 1.1379 2.5625 1.37636 2.5625 1.625ZM8 0.6875C7.81458 0.6875 7.63332 0.742484 7.47915 0.845498C7.32498 0.948511 7.20482 1.09493 7.13386 1.26623C7.06291 1.43754 7.04434 1.62604 7.08051 1.8079C7.11669 1.98975 7.20598 2.1568 7.33709 2.28791C7.4682 2.41902 7.63525 2.50831 7.8171 2.54449C7.99896 2.58066 8.18746 2.56209 8.35877 2.49114C8.53007 2.42018 8.67649 2.30002 8.7795 2.14585C8.88252 1.99168 8.9375 1.81042 8.9375 1.625C8.9375 1.37636 8.83873 1.1379 8.66291 0.962088C8.4871 0.786272 8.24864 0.6875 8 0.6875ZM14.375 2.5625C14.5604 2.5625 14.7417 2.50752 14.8958 2.4045C15.05 2.30149 15.1702 2.15507 15.2411 1.98377C15.3121 1.81246 15.3307 1.62396 15.2945 1.4421C15.2583 1.26025 15.169 1.0932 15.0379 0.962088C14.9068 0.830976 14.7398 0.741688 14.5579 0.705514C14.376 0.66934 14.1875 0.687906 14.0162 0.758864C13.8449 0.829821 13.6985 0.949982 13.5955 1.10415C13.4925 1.25832 13.4375 1.43958 13.4375 1.625C13.4375 1.87364 13.5363 2.1121 13.7121 2.28791C13.8879 2.46373 14.1264 2.5625 14.375 2.5625ZM1.625 7.4375C1.43958 7.4375 1.25832 7.49248 1.10415 7.5955C0.949982 7.69851 0.829821 7.84493 0.758863 8.01624C0.687906 8.18754 0.669341 8.37604 0.705514 8.5579C0.741688 8.73975 0.830976 8.9068 0.962088 9.03791C1.0932 9.16903 1.26025 9.25831 1.4421 9.29449C1.62396 9.33066 1.81246 9.3121 1.98377 9.24114C2.15507 9.17018 2.30149 9.05002 2.4045 8.89585C2.50752 8.74168 2.5625 8.56042 2.5625 8.375C2.5625 8.12636 2.46373 7.8879 2.28791 7.71209C2.1121 7.53627 1.87364 7.4375 1.625 7.4375ZM8 7.4375C7.81458 7.4375 7.63332 7.49248 7.47915 7.5955C7.32498 7.69851 7.20482 7.84493 7.13386 8.01624C7.06291 8.18754 7.04434 8.37604 7.08051 8.5579C7.11669 8.73975 7.20598 8.9068 7.33709 9.03791C7.4682 9.16903 7.63525 9.25831 7.8171 9.29449C7.99896 9.33066 8.18746 9.3121 8.35877 9.24114C8.53007 9.17018 8.67649 9.05002 8.7795 8.89585C8.88252 8.74168 8.9375 8.56042 8.9375 8.375C8.9375 8.12636 8.83873 7.8879 8.66291 7.71209C8.4871 7.53627 8.24864 7.4375 8 7.4375ZM14.375 7.4375C14.1896 7.4375 14.0083 7.49248 13.8542 7.5955C13.7 7.69851 13.5798 7.84493 13.5089 8.01624C13.4379 8.18754 13.4193 8.37604 13.4555 8.5579C13.4917 8.73975 13.581 8.9068 13.7121 9.03791C13.8432 9.16903 14.0102 9.25831 14.1921 9.29449C14.374 9.33066 14.5625 9.3121 14.7338 9.24114C14.9051 9.17018 15.0515 9.05002 15.1545 8.89585C15.2575 8.74168 15.3125 8.56042 15.3125 8.375C15.3125 8.12636 15.2137 7.8879 15.0379 7.71209C14.8621 7.53627 14.6236 7.4375 14.375 7.4375Z'
        fill='#111827'
      />
    </svg>
  )
}

export const AlignLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 12 11'
      xmlns='http://www.w3.org/2000/svg'
      fill='#374151'
    >
      <path d='M1.58125 0.4375V10.0625C1.58125 10.1785 1.53746 10.2898 1.45952 10.3719C1.38157 10.4539 1.27586 10.5 1.16563 10.5C1.05539 10.5 0.949679 10.4539 0.871734 10.3719C0.793789 10.2898 0.75 10.1785 0.75 10.0625V0.4375C0.75 0.321468 0.793789 0.210188 0.871734 0.128141C0.949679 0.0460937 1.05539 0 1.16563 0C1.27586 0 1.38157 0.0460937 1.45952 0.128141C1.53746 0.210188 1.58125 0.321468 1.58125 0.4375ZM2.4125 3.9375V1.75C2.4125 1.51794 2.50008 1.29538 2.65597 1.13128C2.81186 0.967187 3.02329 0.875 3.24375 0.875H8.23125C8.45171 0.875 8.66314 0.967187 8.81903 1.13128C8.97492 1.29538 9.0625 1.51794 9.0625 1.75V3.9375C9.0625 4.16956 8.97492 4.39212 8.81903 4.55622C8.66314 4.72031 8.45171 4.8125 8.23125 4.8125H3.24375C3.02329 4.8125 2.81186 4.72031 2.65597 4.55622C2.50008 4.39212 2.4125 4.16956 2.4125 3.9375ZM3.24375 3.9375H8.23125V1.75H3.24375V3.9375ZM11.1406 6.5625V8.75C11.1406 8.98206 11.053 9.20462 10.8972 9.36872C10.7413 9.53281 10.5298 9.625 10.3094 9.625H3.24375C3.02329 9.625 2.81186 9.53281 2.65597 9.36872C2.50008 9.20462 2.4125 8.98206 2.4125 8.75V6.5625C2.4125 6.33044 2.50008 6.10788 2.65597 5.94378C2.81186 5.77969 3.02329 5.6875 3.24375 5.6875H10.3094C10.5298 5.6875 10.7413 5.77969 10.8972 5.94378C11.053 6.10788 11.1406 6.33044 11.1406 6.5625ZM10.3094 8.75V6.5625H3.24375V8.75H10.3094Z' />
    </svg>
  )
}

export const AlignTopIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 11 11'
      fill='#374151'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M10.725 0.4375C10.725 0.553532 10.6812 0.664812 10.6033 0.746859C10.5253 0.828906 10.4196 0.875 10.3094 0.875H1.16563C1.05539 0.875 0.949679 0.828906 0.871734 0.746859C0.793789 0.664812 0.75 0.553532 0.75 0.4375C0.75 0.321468 0.793789 0.210188 0.871734 0.128141C0.949679 0.0460937 1.05539 0 1.16563 0H10.3094C10.4196 0 10.5253 0.0460937 10.6033 0.128141C10.6812 0.210188 10.725 0.321468 10.725 0.4375ZM9.89375 2.625V7.875C9.89375 8.10706 9.80617 8.32962 9.65028 8.49372C9.49439 8.65781 9.28296 8.75 9.0625 8.75H6.98438C6.76391 8.75 6.55248 8.65781 6.39659 8.49372C6.2407 8.32962 6.15313 8.10706 6.15313 7.875V2.625C6.15313 2.39294 6.2407 2.17038 6.39659 2.00628C6.55248 1.84219 6.76391 1.75 6.98438 1.75H9.0625C9.28296 1.75 9.49439 1.84219 9.65028 2.00628C9.80617 2.17038 9.89375 2.39294 9.89375 2.625ZM9.0625 2.625H6.98438V7.875H9.0625V2.625ZM5.32188 2.625V10.0625C5.32188 10.2946 5.2343 10.5171 5.07841 10.6812C4.92252 10.8453 4.71109 10.9375 4.49063 10.9375H2.4125C2.19204 10.9375 1.98061 10.8453 1.82472 10.6812C1.66883 10.5171 1.58125 10.2946 1.58125 10.0625V2.625C1.58125 2.39294 1.66883 2.17038 1.82472 2.00628C1.98061 1.84219 2.19204 1.75 2.4125 1.75H4.49063C4.71109 1.75 4.92252 1.84219 5.07841 2.00628C5.2343 2.17038 5.32188 2.39294 5.32188 2.625ZM4.49063 2.625H2.4125V10.0625H4.49063V2.625Z' />
    </svg>
  )
}

export const AlignBottomIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='#374151'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M9.87 9.6C9.87 9.70609 9.82997 9.80783 9.7587 9.88284C9.68744 9.95786 9.59078 10 9.49 10H1.13C1.02922 10 0.932563 9.95786 0.861299 9.88284C0.790036 9.80783 0.75 9.70609 0.75 9.6C0.75 9.49391 0.790036 9.39217 0.861299 9.31716C0.932563 9.24214 1.02922 9.2 1.13 9.2H9.49C9.59078 9.2 9.68744 9.24214 9.7587 9.31716C9.82997 9.39217 9.87 9.49391 9.87 9.6ZM5.69 7.6V2.8C5.69 2.58783 5.77007 2.38434 5.9126 2.23431C6.05513 2.08429 6.24844 2 6.45 2H8.35C8.55157 2 8.74487 2.08429 8.8874 2.23431C9.02993 2.38434 9.11 2.58783 9.11 2.8V7.6C9.11 7.81217 9.02993 8.01566 8.8874 8.16569C8.74487 8.31571 8.55157 8.4 8.35 8.4H6.45C6.24844 8.4 6.05513 8.31571 5.9126 8.16569C5.77007 8.01566 5.69 7.81217 5.69 7.6ZM6.45 7.6H8.35V2.8H6.45V7.6ZM1.51 7.6V0.8C1.51 0.587827 1.59007 0.384344 1.7326 0.234315C1.87513 0.0842854 2.06844 0 2.27 0H4.17C4.37156 0 4.56487 0.0842854 4.7074 0.234315C4.84993 0.384344 4.93 0.587827 4.93 0.8V7.6C4.93 7.81217 4.84993 8.01566 4.7074 8.16569C4.56487 8.31571 4.37156 8.4 4.17 8.4H2.27C2.06844 8.4 1.87513 8.31571 1.7326 8.16569C1.59007 8.01566 1.51 7.81217 1.51 7.6ZM2.27 7.6H4.17V0.8H2.27V7.6Z' />
    </svg>
  )
}

export const AlignRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 11 11'
      fill='#374151'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M10.3906 0.4375V10.0625C10.3906 10.1785 10.3468 10.2898 10.2689 10.3719C10.1909 10.4539 10.0852 10.5 9.975 10.5C9.86477 10.5 9.75905 10.4539 9.68111 10.3719C9.60316 10.2898 9.55937 10.1785 9.55937 10.0625V0.4375C9.55937 0.321468 9.60316 0.210188 9.68111 0.128141C9.75905 0.0460937 9.86477 0 9.975 0C10.0852 0 10.1909 0.0460937 10.2689 0.128141C10.3468 0.210188 10.3906 0.321468 10.3906 0.4375ZM8.72812 1.75V3.9375C8.72812 4.16956 8.64055 4.39212 8.48466 4.55622C8.32877 4.72031 8.11734 4.8125 7.89687 4.8125H2.90937C2.68891 4.8125 2.47748 4.72031 2.32159 4.55622C2.1657 4.39212 2.07812 4.16956 2.07812 3.9375V1.75C2.07812 1.51794 2.1657 1.29538 2.32159 1.13128C2.47748 0.967187 2.68891 0.875 2.90937 0.875H7.89687C8.11734 0.875 8.32877 0.967187 8.48466 1.13128C8.64055 1.29538 8.72812 1.51794 8.72812 1.75ZM7.89687 1.75H2.90937V3.9375H7.89687V1.75ZM8.72812 6.5625V8.75C8.72812 8.98206 8.64055 9.20462 8.48466 9.36872C8.32877 9.53281 8.11734 9.625 7.89687 9.625H0.83125C0.610789 9.625 0.399357 9.53281 0.243467 9.36872C0.0875778 9.20462 0 8.98206 0 8.75V6.5625C0 6.33044 0.0875778 6.10788 0.243467 5.94378C0.399357 5.77969 0.610789 5.6875 0.83125 5.6875H7.89687C8.11734 5.6875 8.32877 5.77969 8.48466 5.94378C8.64055 6.10788 8.72812 6.33044 8.72812 6.5625ZM7.89687 6.5625H0.83125V8.75H7.89687V6.5625Z' />
    </svg>
  )
}

export const AlignCenterHorizonalIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='#374151'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M8.46154 5.38462H5V4.61538H7.30769C7.51171 4.61538 7.70736 4.53434 7.85162 4.39008C7.99588 4.24582 8.07692 4.05017 8.07692 3.84615V1.92308C8.07692 1.71906 7.99588 1.52341 7.85162 1.37915C7.70736 1.23489 7.51171 1.15385 7.30769 1.15385H5V0.384615C5 0.282609 4.95948 0.184781 4.88735 0.112651C4.81522 0.0405218 4.71739 0 4.61538 0C4.51338 0 4.41555 0.0405218 4.34342 0.112651C4.27129 0.184781 4.23077 0.282609 4.23077 0.384615V1.15385H1.92308C1.71906 1.15385 1.52341 1.23489 1.37915 1.37915C1.23489 1.52341 1.15385 1.71906 1.15385 1.92308V3.84615C1.15385 4.05017 1.23489 4.24582 1.37915 4.39008C1.52341 4.53434 1.71906 4.61538 1.92308 4.61538H4.23077V5.38462H0.769231C0.565218 5.38462 0.369561 5.46566 0.225302 5.60992C0.0810437 5.75418 0 5.94983 0 6.15385V8.07692C0 8.28094 0.0810437 8.47659 0.225302 8.62085C0.369561 8.76511 0.565218 8.84615 0.769231 8.84615H4.23077V9.61539C4.23077 9.71739 4.27129 9.81522 4.34342 9.88735C4.41555 9.95948 4.51338 10 4.61538 10C4.71739 10 4.81522 9.95948 4.88735 9.88735C4.95948 9.81522 5 9.71739 5 9.61539V8.84615H8.46154C8.66555 8.84615 8.86121 8.76511 9.00547 8.62085C9.14972 8.47659 9.23077 8.28094 9.23077 8.07692V6.15385C9.23077 5.94983 9.14972 5.75418 9.00547 5.60992C8.86121 5.46566 8.66555 5.38462 8.46154 5.38462ZM1.92308 1.92308H7.30769V3.84615H1.92308V1.92308ZM8.46154 8.07692H0.769231V6.15385H8.46154V8.07692Z' />
    </svg>
  )
}

export const AlignCenterVerticalIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 10 10'
      fill='#374151'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M8.46154 5.38462H5V4.61538H7.30769C7.51171 4.61538 7.70736 4.53434 7.85162 4.39008C7.99588 4.24582 8.07692 4.05017 8.07692 3.84615V1.92308C8.07692 1.71906 7.99588 1.52341 7.85162 1.37915C7.70736 1.23489 7.51171 1.15385 7.30769 1.15385H5V0.384615C5 0.282609 4.95948 0.184781 4.88735 0.112651C4.81522 0.0405218 4.71739 0 4.61538 0C4.51338 0 4.41555 0.0405218 4.34342 0.112651C4.27129 0.184781 4.23077 0.282609 4.23077 0.384615V1.15385H1.92308C1.71906 1.15385 1.52341 1.23489 1.37915 1.37915C1.23489 1.52341 1.15385 1.71906 1.15385 1.92308V3.84615C1.15385 4.05017 1.23489 4.24582 1.37915 4.39008C1.52341 4.53434 1.71906 4.61538 1.92308 4.61538H4.23077V5.38462H0.769231C0.565218 5.38462 0.369561 5.46566 0.225302 5.60992C0.0810437 5.75418 0 5.94983 0 6.15385V8.07692C0 8.28094 0.0810437 8.47659 0.225302 8.62085C0.369561 8.76511 0.565218 8.84615 0.769231 8.84615H4.23077V9.61539C4.23077 9.71739 4.27129 9.81522 4.34342 9.88735C4.41555 9.95948 4.51338 10 4.61538 10C4.71739 10 4.81522 9.95948 4.88735 9.88735C4.95948 9.81522 5 9.71739 5 9.61539V8.84615H8.46154C8.66555 8.84615 8.86121 8.76511 9.00547 8.62085C9.14972 8.47659 9.23077 8.28094 9.23077 8.07692V6.15385C9.23077 5.94983 9.14972 5.75418 9.00547 5.60992C8.86121 5.46566 8.66555 5.38462 8.46154 5.38462ZM1.92308 1.92308H7.30769V3.84615H1.92308V1.92308ZM8.46154 8.07692H0.769231V6.15385H8.46154V8.07692Z' />
    </svg>
  )
}

export const PolygonRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 6 6'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M5.59813 3L0.401978 6L0.401978 0L5.59813 3Z' fill='#999999' />
    </svg>
  )
}

export const PolygonDownIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 6 6'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M3 5.59801L0 0.401855H6L3 5.59801Z' fill='#999999' />
    </svg>
  )
}

export const FrameIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 11 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M7.52209 11.5V0.5H8.52209V11.5H7.52209Z'
        fill='#999999'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M2.52209 11.5V0.5H3.52209V11.5H2.52209Z'
        fill='#999999'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M4.37115e-08 2.98666L11 2.98666V3.98666L0 3.98666L4.37115e-08 2.98666Z'
        fill='#999999'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M4.37115e-08 7.98666L11 7.98666V8.98666L0 8.98666L4.37115e-08 7.98666Z'
        fill='#999999'
      />
    </svg>
  )
}

export const TIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 11 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M1.37788 3.15778V1.63647H9.622V3.15778H6.46079V10.3637H4.63692V3.15778H1.37788Z'
        fill='#999999'
      />
    </svg>
  )
}

export const ImageIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      viewBox='0 0 11 12'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M0.5 1V11H10.5V1H0.5ZM0.25 0.5C0.111929 0.5 0 0.611929 0 0.75V11.25C0 11.3881 0.111929 11.5 0.25 11.5H10.75C10.8881 11.5 11 11.3881 11 11.25V0.75C11 0.611929 10.8881 0.5 10.75 0.5H0.25Z'
        fill='#999999'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M3.80261 2.99332L4.25148 2.98077L8.51943 11.1125L8.07671 11.3449L4.046 3.66516L0.660215 11.0979L0.2052 10.8906L3.80261 2.99332Z'
        fill='#999999'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M8.37805 5.3997L6.91639 8.22903L6.47217 7.99954L8.164 4.72467L8.61143 4.73111L10.9931 9.68576L10.5424 9.90238L8.37805 5.3997Z'
        fill='#999999'
      />
    </svg>
  )
}

export const ComponentIcon: IconComponent = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      {...props}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path>
      <path d='m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z'></path>
      <path d='M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z'></path>
      <path d='m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z'></path>
    </svg>
  )
}
