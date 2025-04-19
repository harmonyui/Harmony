import { AnimatePresence, motion } from 'framer-motion'
import { FC } from 'react'

interface AnimateOpenCloseProps {
  openElement: React.ReactNode
  closedElement?: React.ReactNode
  isOpen: boolean
}

export const AnimateOpenClose: FC<AnimateOpenCloseProps> = ({
  openElement,
  closedElement,
  isOpen,
}) => {
  return (
    <AnimatePresence mode={closedElement ? 'wait' : undefined}>
      {isOpen ? (
        <motion.div
          key='A'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          {openElement}
        </motion.div>
      ) : closedElement ? (
        <motion.div
          key='B'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          {closedElement}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
