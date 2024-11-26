import { AttachmentIcon } from './icons'

export interface AttachmentProps {
  label: string
  link: string
}
export const Attachment = ({ label, link }: AttachmentProps) => {
  return (
    <a
      href={link}
      className='hw-relative hw-mt-2 hw-inline-flex hw-items-center hw-text-sm hw-font-medium hover:hw-text-teal-500 focus-visible:hw-text-teal-500 dark:hover:hw-text-teal-300 dark:focus-visible:hw-text-teal-300'
      target='_blank'
      rel='noreferrer'
    >
      <AttachmentIcon className='hw-mr-2 hw-h-3 hw-w-3' />
      <span>{label}</span>
    </a>
  )
}
