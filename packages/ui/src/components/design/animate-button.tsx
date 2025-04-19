import { motion, MotionProps } from 'framer-motion'

type AnimateButtonProps = Omit<
  React.ComponentPropsWithRef<typeof motion.button>,
  keyof MotionProps
> & {
  children: React.ReactNode
}

export const AnimateButton: React.FC<AnimateButtonProps> = (props) => {
  return (
    <motion.button
      {...props}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {props.children}
    </motion.button>
  )
}
