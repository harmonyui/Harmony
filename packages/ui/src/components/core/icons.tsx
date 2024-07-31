import { getClass } from '@harmony/util/src/utils/common'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAlignCenter,
  faAlignJustify,
  faAlignLeft,
  faAlignRight,
  faArrowUpRightFromSquare,
  faBorderAll,
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
export const SquareIcon: IconComponent = (props) => {
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
        <rect
          x='4'
          y='4'
          width='16'
          height='16'
          rx='2'
          stroke='#000000'
          strokeWidth='2'
          stroke-linecap='round'
          stroke-linejoin='round'
        ></rect>{' '}
      </g>
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
          fill-rule='evenodd'
          clip-rule='evenodd'
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

export const BorderAllIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faBorderAll} className={props.className} />
}

export const AlignLeftIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignLeft} className={props.className} />
}

export const AlignRightIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignRight} className={props.className} />
}

export const AlignCenterIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignCenter} className={props.className} />
}

export const AlignJustifyIcon: IconComponent = (props) => {
  return <FontAwesomeIcon icon={faAlignJustify} className={props.className} />
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
    <FontAwesomeIcon
      icon={faArrowUpRightFromSquare}
      className={props.className}
    />
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
        fill-rule='nonzero'
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
