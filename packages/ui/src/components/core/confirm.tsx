import { useState } from 'react'
import type { ButtonType, ButtonProps } from './button'
import { Button } from './button'
import { Header } from './header'
import { HarmonyModal } from './modal'

interface ButtonInfo {
  mode: Exclude<ButtonType, 'other'>
  handler: () => void
  label: string
}

interface ConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
  header: string
  message: string
  show: boolean
}
export const ConfirmModal: React.FunctionComponent<ConfirmModalProps> = ({
  onConfirm,
  onCancel,
  show,
  header,
  message,
}) => {
  const buttons: ButtonInfo[] = [
    {
      mode: 'secondary',
      label: 'Cancel',
      handler: onCancel,
    },
    {
      mode: 'primary',
      label: 'Confirm',
      handler: onConfirm,
    },
  ]

  return (
    <HarmonyModal show={show} onClose={onCancel}>
      <Header level={3}>{header}</Header>
      {message}
      <div className='flex justify-end gap-2'>
        {buttons.map(({ mode, label, handler }) => (
          <Button key={label} mode={mode} onClick={handler}>
            {label}
          </Button>
        ))}
      </div>
    </HarmonyModal>
  )
}

type ConfirmButtonProps<C extends React.ElementType> = ButtonProps<C> &
  ConfirmModalProps
export const ConfirmButton = <C extends React.ElementType>(
  props: ConfirmButtonProps<C>,
) => {
  const [isOpen, setIsOpen] = useState(false)
  const { onConfirm, onCancel, message, header } = props

  const onButtonClick = () => {
    setIsOpen(true)
  }
  const onCancelClick = () => {
    setIsOpen(false)
    onCancel()
  }
  const onOk = () => {
    setIsOpen(false)
    onConfirm()
  }

  return (
    <>
      <Button {...props} onClick={onButtonClick} />
      <ConfirmModal
        show={isOpen}
        onCancel={onCancelClick}
        onConfirm={onOk}
        header={header}
        message={message}
      />
    </>
  )
}
