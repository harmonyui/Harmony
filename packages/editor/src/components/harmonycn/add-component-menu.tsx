import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@harmony/ui/src/components/core/command'
import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import {
  FrameIcon,
  ImageIcon,
  TIcon,
} from '@harmony/ui/src/components/core/icons'
import { useHarmonyStore } from '../../hooks/state'
import { useUpdateComponent } from './update-component'

interface AddComponentMenuProps {
  isOpen: boolean
  onClose: () => void
  options: ComponentMenuOptions
}
export interface ComponentMenuOptions {
  position: 'above' | 'below'
}
export const AddComponentMenu: React.FunctionComponent<
  AddComponentMenuProps
> = ({ isOpen, onClose, options }) => {
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const { addComponent } = useUpdateComponent()

  const onItemClick = (component: HarmonyCnNames) => () => {
    if (!selectedComponent) return
    addComponent(selectedComponent.element, component, options.position)
  }
  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={onClose}
      container={document.getElementById('harmony-container') ?? undefined}
    >
      <Command className='rounded-lg border shadow-md md:min-w-[450px]'>
        <CommandInput placeholder='Search for a component...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading='Suggestions'>
            {components.map(({ name, icon: Icon }) => (
              <CommandItem key={name} onClick={onItemClick(name)}>
                <Icon />
                <span>{name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

interface HarmonyCn {
  name: string
  icon: IconComponent
}
type HarmonyCnNames = (typeof components)[number]['name']
const components = [
  {
    name: 'Text',
    icon: TIcon,
  },
  {
    name: 'Frame',
    icon: FrameIcon,
  },
  {
    name: 'Image',
    icon: ImageIcon,
  },
] as const satisfies HarmonyCn[]
