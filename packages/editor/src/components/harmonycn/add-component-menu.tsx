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
import type { HarmonyCn } from '@harmony/util/src/harmonycn/types'
import { capitalizeFirstLetter } from '@harmony/util/src/utils/common'
import { useHarmonyStore } from '../../hooks/state'
import type { UpdateComponentOptions } from './update-component'
import { useUpdateComponent } from './update-component'

interface AddComponentMenuProps {
  isOpen: boolean
  onClose: () => void
  options: UpdateComponentOptions
}
export const AddComponentMenu: React.FunctionComponent<
  AddComponentMenuProps
> = ({ isOpen, onClose, options }) => {
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const { addComponent } = useUpdateComponent()

  const onItemClick = (component: HarmonyCn) => () => {
    if (!selectedComponent) return
    addComponent(selectedComponent.element, component, options)
    onClose()
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
              <CommandItem key={name} onSelect={onItemClick(name)}>
                <Icon />
                <span>{capitalizeFirstLetter(name)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

interface HarmonyCnListItem {
  name: HarmonyCn
  icon: IconComponent
}
const components: HarmonyCnListItem[] = [
  {
    name: 'text',
    icon: TIcon,
  },
  {
    name: 'frame',
    icon: FrameIcon,
  },
  {
    name: 'image',
    icon: ImageIcon,
  },
  {
    name: 'button',
    icon: FrameIcon,
  },
]
