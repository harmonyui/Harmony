/* eslint-disable @typescript-eslint/no-empty-function  -- ok*/
/* eslint-disable @typescript-eslint/no-floating-promises  -- ok*/

/* eslint-disable import/no-cycle  -- ok*/
import {
  ArrowLeftIcon,
  MaximizeIcon,
  ShareArrowIcon,
  LinkIcon,
  SendIcon,
} from '@harmony/ui/src/components/core/icons'
import React, { useMemo, useState } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { Popover } from '@harmony/ui/src/components/core/popover'
import type { PublishRequest } from '@harmony/util/src/types/network'
import { getEditorUrl } from '@harmony/util/src/utils/component'
import { usePinchGesture } from '../harmony-provider'
import type {
  ComponentUpdateWithoutGlobal,
  SelectMode,
} from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import { useHarmonyStore } from '../hooks/state'
import { ComponentAttributeProvider } from './attribute-panel'
import { GiveFeedbackModal, HelpGuide } from './welcome/help-guide'
import { SidePanel, SidePanelProvider } from './side-panel'
import { ToolbarPanel } from './toolbar-panel'
import { PublishProvider, PublishButton } from './publish-button'
import { HarmonyToolbar } from './overlays/harmony-toolbar'

export interface HarmonyPanelProps {
  onAttributesChange: (updates: ComponentUpdateWithoutGlobal[]) => void
  mode: SelectMode
  onModeChange: (mode: SelectMode) => void
  children: React.ReactNode
  toggle: boolean
  onToggleChange: (toggle: boolean) => void
  isDirty: boolean
  setIsDirty: (value: boolean) => void
}
export const HarmonyPanel: React.FunctionComponent<
  HarmonyPanelProps & { inspector: React.ReactNode }
> = ({ inspector, ...props }) => {
  const isOverlay = useHarmonyStore((state) => state.isOverlay)
  const { children } = props

  return (
    <PublishProvider>
      <SidePanelProvider>
        <ComponentAttributeProvider onChange={props.onAttributesChange}>
          {isOverlay ? (
            <div
              className='hw-fixed hw-h-full hw-w-full hw-z-[10000] hw-pointer-events-none hw-top-0'
              id='harmony-overlay'
            >
              <div className='hw-pointer-events-auto'>
                <div className='hw-absolute hw-top-0 hw-left-0 hw-right-0'>
                  <MainPanel {...props} />
                </div>
                <div className='hw-absolute hw-top-[52px] hw-bottom-0 hw-left-0'>
                  <SidePanel />
                </div>
                <FeedbackOverlay />
                <HarmonyToolbar />
                {inspector}
              </div>
            </div>
          ) : (
            <WheelContainer
              toolbarPanel={<MainPanel {...props} />}
              sidePanel={<SidePanel />}
              overlay={<FeedbackOverlay />}
            >
              {children}
            </WheelContainer>
          )}
        </ComponentAttributeProvider>
      </SidePanelProvider>
    </PublishProvider>
  )
}

const MainPanel: React.FunctionComponent<HarmonyPanelProps> = (props) => {
  const { displayMode } = useHarmonyContext()

  if (displayMode.includes('designer')) {
    return <EditorPanel {...props} />
  }

  return <PreviewPanel />
}

const FeedbackOverlay: React.FunctionComponent = () => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { showGiveFeedback, setShowGiveFeedback } = useHarmonyContext()

  return (
    <>
      <div className='hw-absolute hw-left-4 hw-bottom-4'>
        {isDemo ? (
          <Button
            as='a'
            href='https://j48inpgngmc.typeform.com/to/Ch60XpCt'
            className='hw-mr-4'
            target='_blank'
          >
            Join Beta
          </Button>
        ) : null}
        <Button mode='secondary' onClick={() => setShowGiveFeedback(true)}>
          Give us feedback
        </Button>
      </div>
      <div className='hw-absolute hw-right-0 hw-bottom-0'>
        <HelpGuide className='hw-mr-4 hw-mb-4' />
      </div>
      <GiveFeedbackModal
        show={showGiveFeedback}
        onClose={() => setShowGiveFeedback(false)}
      />
    </>
  )
}

interface WheelContainerProps {
  children: React.ReactNode
  sidePanel: React.ReactNode
  toolbarPanel: React.ReactNode
  overlay: React.ReactNode
}
const WheelContainer: React.FunctionComponent<WheelContainerProps> = ({
  children,
  sidePanel,
  toolbarPanel,
  overlay,
}) => {
  const { scale, onScaleChange } = useHarmonyContext()
  const { onTouch } = usePinchGesture({
    scale,
    onTouching(newScale, cursorPos) {
      onScaleChange(newScale, cursorPos)
    },
  })
  const { onTouch: onTouchHeader } = usePinchGesture({ scale, onTouching() {} })

  return (
    <div
      className='hw-flex hw-h-full'
      ref={(ref) => {
        ref?.addEventListener('wheel', onTouchHeader)
      }}
    >
      {sidePanel}
      <div className='hw-relative hw-flex hw-flex-col hw-divide-y hw-divide-gray-200 hw-w-full hw-h-full hw-overflow-hidden hw-rounded-lg hw-bg-white hw-shadow-md'>
        <div data-name='harmony-panel'>{toolbarPanel}</div>
        <div
          id='harmony-scroll-container'
          ref={(ref) => {
            ref?.addEventListener('wheel', onTouch)
          }}
          className='hw-relative hw-flex hw-w-full hw-overflow-auto hw-flex-1 hw-px-4 hw-py-5 sm:hw-px-[250px] hw-bg-gray-200'
        >
          {children}
        </div>
        {overlay}
      </div>
    </div>
  )
}

const EditorPanel: React.FunctionComponent<HarmonyPanelProps> = ({
  mode,
  onModeChange,
  toggle,
  onToggleChange,
  isDirty,
}) => {
  const { environment } = useHarmonyContext()

  const EDITOR_URL = useMemo(() => getEditorUrl(environment), [environment])

  return (
    <div className='hw-flex hw-w-full hw-items-center hw-shadow-2xl hw-bg-white'>
      <div className='hw-h-10 hw-ml-4'>
        <img
          alt='Harmony Logo'
          className='hw-h-full'
          src={`${EDITOR_URL}/Harmony_logo.svg`}
        />
      </div>
      <div className='hw-pl-4 hw-pr-2 hw-py-2 hw-w-full'>
        <ToolbarPanel
          mode={mode}
          onModeChange={onModeChange}
          toggle={toggle}
          onToggleChange={onToggleChange}
          isDirty={isDirty}
        />
      </div>
    </div>
  )
}

const PreviewPanel: React.FunctionComponent = () => {
  const { changeMode } = useHarmonyContext()
  const upadatePublishState = useHarmonyStore(
    (state) => state.updatePublishState,
  )
  const publishState = useHarmonyStore((state) => state.publishState)
  const currentBranch = useHarmonyStore((state) => state.currentBranch)
  const publish = useHarmonyStore((state) => state.publishChanges)

  const [loading, setLoading] = useState(false)
  const onMaximize = () => {
    changeMode('preview-full')
  }

  const onBack = () => {
    changeMode('designer')
    upadatePublishState(undefined)
  }

  const onSendRequest = () => {
    if (!publishState) throw new Error('There should be a publish state')

    const request: PublishRequest = {
      branchId: currentBranch.id,
      pullRequest: publishState,
    }

    setLoading(true)
    publish(request).then(() => {
      setLoading(false)
    })
  }

  const url = new URL(window.location.href)
  url.searchParams.set('mode', 'preview-full')

  return (
    <div className='hw-flex hw-w-full hw-items-center hw-shadow-2xl hw-justify-between hw-pl-4 hw-pr-2 hw-py-2'>
      <div>
        <div className='hw-flex hw-gap-4'>
          <button
            className='hw-p-1 hw-bg-[#11283B] hover:hw-bg-[#11283B]/80 hw-rounded-md'
            onClick={onBack}
          >
            <ArrowLeftIcon className='hw-h-5 hw-w-5 hw-fill-white hw-stroke-white hw-stroke-[2.5]' />
          </button>
          <button className='hw-bg-[#11283B] hw-rounded-md hw-p-1 hover:hw-bg-[#11283B]/80'>
            <MaximizeIcon
              className='hw-h-5 hw-w-5 hw-fill-white hw-stroke-none'
              onClick={onMaximize}
            />
          </button>
        </div>
      </div>
      <div>
        <div className='hw-flex hw-gap-4 hw-items-center'>
          <ShareButton />
          {!publishState ? (
            <PublishButton />
          ) : (
            <Button
              className='hw-h-7'
              mode='dark'
              onClick={onSendRequest}
              loading={loading}
            >
              Send Request <SendIcon className='hw-h-5 hw-w-5' />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// interface SidePanelToolbarItem {
// 	id: string,
// 	label: string,
// 	icon: IconComponent,
// 	panel: React.ReactNode
// }
// const SidePanelToolbar: React.FunctionComponent = () => {
// 	const {setPanel} = useSidePanel();
// 	//const [show, setShow] = useState<SidePanelToolbarItem | undefined>();
// 	const items: SidePanelToolbarItem[] = [
// 		{
// 			id: 'component',
// 			label: 'Components',
// 			icon: DocumentTextIcon,
// 			panel: 'Components coming soon!'
// 		},
// 		{
// 			id: 'element',
// 			label: 'Elements',
// 			icon: DocumentTextIcon,
// 			panel: 'Elements coming soon!'
// 		},
// 		{
// 			id: 'text',
// 			label: 'Text',
// 			icon: DocumentTextIcon,
// 			panel: 'Text coming soon!'
// 		},
// 	];
// 	const onShow = (show: SidePanelToolbarItem | undefined) => {
// 		setPanel(show ? {
// 				id: show.id,
// 				content: <div className="hw-z-10 hw-bg-slate-800 hw-min-w-[300px] hw-h-full hw-top-0 hw-shadow-lg hw-ring-1 hw-ring-gray-900/5 hw-text-white hw-text-xs">
// 				<div className="hw-p-4">
// 					{show.panel}
// 				</div>
// 			</div>
// 		} : undefined);
// 	}
// 	return (
// 		<div className="hw-flex hw-flex-col hw-text-white/75 hw-h-full hw-text-xs hw-bg-slate-800">
// 			{items.map(item =>
// 				<button key={item.id} className="hw-flex hw-flex-col hw-items-center hw-gap-1 hw-p-2 hover:hw-bg-slate-700 hover:hw-text-white" onClick={() => onShow(item)}>
// 					<item.icon className="hw-h-8 hw-w-8"/>
// 					<span>{item.label}</span>
// 				</button>
// 			)}
// 		</div>
// 	)
// }

const ShareButton = () => {
  //const [show, setShow] = useState(false);
  const [copyText, setCopyText] = useState('Copy Link')

  const url = new URL(window.location.href)
  url.searchParams.set('mode', 'preview-full')
  const href = url.href

  // const onClose = () => {
  // 	setShow(false);
  // }

  // const onClick = () => {
  // 	setShow(true);
  // }

  const onCopy = () => {
    window.navigator.clipboard.writeText(href)
    setCopyText('Copied!')
  }

  return (
    <>
      <Popover
        buttonClass='hw-h-8'
        button={
          <button className='hw-text-[#11283B] hover:hw-text-[#11283B]/80'>
            <ShareArrowIcon className='hw-h-8 hw-w-8 hw-fill-white hw-stroke-none' />
          </button>
        }
      >
        <button
          className='hw-text-sm hw-text-blue-500 hw-flex hw-items-center hw-gap-1'
          onClick={onCopy}
        >
          <LinkIcon className='hw-h-4 hw-w-4 hw-fill-blue-500' />
          {copyText}
        </button>
      </Popover>
      {/* <HarmonyModal show={show} onClose={onClose} editor>
			<div className="hw-flex hw-gap-2 hw-items-center">
				<Header level={3}>Share Project</Header>
			</div> 
			<button className="hw-text-sm hw-text-blue-500 hw-flex hw-items-center hw-gap-1" onClick={onCopy}>
				<LinkIcon className="hw-h-4 hw-w-4 hw-fill-blue-500"/>
				{copyText}
			</button>
		</HarmonyModal> */}
    </>
  )
}

// interface AttributePanelProps {
// 	selectedComponent: ComponentElement | undefined;
// 	onAttributesChange: (component: ComponentElement, attributes: Attribute[]) => void;
// 	onAttributesSave: () => void;
// 	onAttributesCancel: () => void;
// 	root: ComponentElement | undefined;
// 	onComponentSelect: (component: ComponentElement) => void;
// 	onComponentHover: (component: ComponentElement) => void;
// }
// const AttributePanel: React.FunctionComponent<AttributePanelProps> = ({root, selectedComponent, onAttributesChange: onAttributesChangeProps, onAttributesSave, onAttributesCancel, onComponentHover, onComponentSelect}) => {
// 	const [isDirty, setIsDirty] = useState(false);
// 	const getTreeItems = (children: ComponentElement[]): TreeViewItem<ComponentElement>[] => {
// 		return children.map<TreeViewItem<ComponentElement>>(child => ({
// 			id: child,
// 			content: child.name,
// 			items: getTreeItems(child.children),
// 			selected: selectedComponent === child.element
// 		}))
// 	}
// 	const treeItems: TreeViewItem<ComponentElement>[] = root ? getTreeItems([root]) : [];

// 	const onAttributesChange = (attributes: Attribute[]): void => {
// 		setIsDirty(true);
// 		selectedComponent && onAttributesChangeProps(selectedComponent, attributes);
// 	}

// 	const onSave = (): void => {
// 		onAttributesSave();
// 		setIsDirty(false);
// 	}

// 	const onCancel = (): void => {
// 		onAttributesCancel();
// 		setIsDirty(false);
// 	}

// 	return (
// 		<div className="hw-absolute hw-right-0 hw-flex hw-flex-col hw-h-full hw-border hw-border-gray-200 hw-p-4 hw-bg-white hw-pointer-events-auto hw-overflow-auto" style={{minWidth: '400px'}}>
// 			<div className="hw-flex-1">
// 				{isDirty ? <div className="hw-flex hw-gap-2">
// 					<Button onClick={onSave}>Save</Button>
// 					<Button onClick={onCancel} mode='secondary'>Cancel</Button>
// 				</div> : null}
// 				{selectedComponent ? <>
// 					<ComponentDisplay value={selectedComponent} onAttributesChange={onAttributesChange}/>
// 				</> : null}
// 			</div>
// 			<div className="hw-flex-1">
// 				<TreeView items={treeItems} expand={true} onClick={(item) => onComponentSelect(item.id)} onHover={(item) => onComponentHover(item.id)}/>
// 				{/* {rootFiber ? <ComponentTree node={rootFiber} expand={true} onHover={onFiberHover} onClick={onFiberClick}/> : null} */}
// 			</div>
// 		</div>
// 	)
// }

// const spacingTypes = ['padding', 'margin', 'border'] as const;
// const spacingDirections = ['top', 'left', 'right', 'bottom'] as const;
// type SpacingType = typeof spacingTypes[number]
// type SpacingDirection = typeof spacingDirections[number];
// interface SpacingValue {
// 	direction: SpacingDirection,
// 	value: number,
// }
// const spacingConvesions = {
// 	getSpacingValues: (attributes: Attribute[]): Record<SpacingType, SpacingValue[]> => {
// 		const values: Record<SpacingType, SpacingValue[]> = {'border': [], 'padding': [], 'margin': []};
// 		for (const attribute of attributes) {
// 			const {id, value: attributeValue} = attribute;
// 			const [type, direction] = id.split('-');

// 			const spacingType = spacingTypes.find(sType => type === sType);
// 			const spacingDirection = spacingDirections.find(sDirection => sDirection === direction);
// 			if (!spacingType || !spacingDirection) continue;

// 			const value = Number(attributeValue);
// 			if (isNaN(value)) {
// 				throw new Error(`Invalid attribute value for ${id}: ${attributeValue}`);
// 			}

// 			values[spacingType].push({direction: spacingDirection, value});
// 			// const spacingType = spacingTypes.find(type => id.includes(type));
// 			// if (spacingType) {
// 			// 	const directions = spacingDirections.filter(type => name.includes(type));
// 			// 	const value = Number(attributeValue);
// 			// 	if (isNaN(value)) {
// 			// 		throw new Error("Invalid attribute value for " + name);
// 			// 	}
// 			// 	const finalDirections = (directions.length > 0 ? directions : spacingDirections);
// 			// 	values[spacingType].push(...finalDirections.map(direction => ({direction, value, attribute })))
// 			// }
// 		}

// 		return values;
// 	},
// 	//padding -> p
// 	//padding-left-right -> px
// 	//padding-top-bottom -> py
// 	//padding-left -> pl
// 	//padding-top -> pt
// 	//padding-right -> pr
// 	//padding-bottom -> pb
// 	getAttributes: (spacingValues: Record<SpacingType, SpacingValue[]>): Attribute[] => {
// 		const attributes: Attribute[] = [];
// 		for (const type in spacingValues) {
// 			const values = spacingValues[type as SpacingType];
// 			attributes.push(...values.map(value => ({id: `${type}-${value.direction}`, type: 'className', name: `${type} ${value.direction}`, value: String(value.value), reference: {id: '', isComponent: false, parentId: ''}})));
// 			// const sameValues = groupBy(values, 'value');
// 			// for (const value in sameValues) {
// 			// 	const sameDirection = groupBy(sameValues[Number(value)], 'direction');
// 			// 	const directions = Object.keys(sameDirection) as SpacingDirection[];
// 			// 	const directionTag: string = directions.length === 4 ? '' : `-${directions.join('-')}`;
// 			// 	attributes.push({name: `${type}${directionTag}`, value, });
// 			// }
// 		}

// 		return attributes;
// 	}
// }

// const useSpacingAttributeConverter = () => {
// 	return spacingConvesions;
// }

// interface ComponentDisplayProps {
// 	value: ComponentElement;
// 	onAttributesChange: (attributes: Attribute[]) => void;
// }
// const ComponentDisplay: React.FunctionComponent<ComponentDisplayProps> = ({value, onAttributesChange}) => {
// 	const {name, attributes} = value;

// 	return (
// 		<div className="hw-inline-flex hw-flex-col hw-gap-2">
// 			<Header level={2}>{name}</Header>
// 			<Header level={3}>Attributes</Header>
// 			{/* <SpacingDisplay attributes={attributes} onChange={onAttributesChange}/> */}
// 			<PropsDisplay attributes={attributes} onChange={onAttributesChange}/>
// 		</div>
// 	)
// }

// interface SpacingDisplayProps {
// 	attributes: Attribute[],
// 	onChange: (value: Attribute[]) => void;
// }
// const SpacingDisplay: React.FunctionComponent<SpacingDisplayProps> = ({attributes, onChange}) => {
// 	const {getSpacingValues, getAttributes} = useSpacingAttributeConverter();

// 	const spacingValues = getSpacingValues(attributes);
// 	const {border, padding, margin} = spacingValues;

// 	const onSpacingChange = (type: SpacingType) => (values: SpacingValue[]): void => {
// 		const copy = {...spacingValues};
// 		copy[type] = values;

// 		const newAttributes = getAttributes(copy);
// 		onChange(newAttributes);
// 	}

// 	const borderItemTabs: TabItem[] = [
// 		{
// 			id: 0,
// 			label: 'padding',
// 			component: <SpacingInput type='padding' values={padding} onChange={onSpacingChange('padding')}/>
// 		},
// 		{
// 			id: 1,
// 			label: 'margin',
// 			component: <SpacingInput type='margin' values={margin} onChange={onSpacingChange('margin')}/>
// 		},
// 		{
// 			id: 2,
// 			label: 'border',
// 			component: <SpacingInput type='border' values={border} onChange={onSpacingChange('border')}/>
// 		}
// 	]
// 	return (
// 		<TabButton className="hw-inline-flex hw-flex-col" items={borderItemTabs}/>
// 	)
// }

// interface PropsDisplayProps {
// 	attributes: Attribute[]
// 	onChange: (attributes: Attribute[]) => void;
// }
// const PropsDisplay: React.FunctionComponent<PropsDisplayProps> = ({attributes, onChange}) => {
// 	const onAttributeChange = (attribute: Attribute) => (value: string) => {
// 		const copy = attributes.slice();
// 		const index = copy.indexOf(attribute);
// 		if (index < 0) throw new Error("Cannot find attribute " + attribute.id);

// 		copy[index] = {...attribute, value};

// 		onChange(copy);
// 	}
// 	return (
// 		attributes.map(attribute => <Label label={attribute.name} key={attribute.id}>
// 			<Input value={attribute.value} onChange={onAttributeChange(attribute)}/>
// 		</Label>)
// 	)
// }

// interface SpacingInputProps {
// 	values: SpacingValue[],
// 	onChange: (values: SpacingValue[]) => void,
// 	type: SpacingType
// }
// const SpacingInput: React.FunctionComponent<SpacingInputProps> = ({values, onChange, type}) => {
// 	const [selectedDirection, setSelectedDirection] = useState<SpacingDirection>('top');
// 	const selectedValue = values.find(value => value.direction === selectedDirection)?.value || 0;

// 	const onChangeInput = (value: string) => {
// 		const number = value ? Number(value) : 0;
// 		if (isNaN(number)) return;

// 		const copy = [...values];
// 		const index = copy.findIndex(c => c.direction === selectedDirection);
// 		if (index > -1) {
// 			const copyValue = {...copy[index]};
// 			copyValue.value = number;
// 			copy[index] = copyValue;
// 		} else {
// 			copy.push({direction: selectedDirection, value: number});
// 		}

// 		onChange(copy);
// 	}

// 	return (
// 		<div className="hw-flex hw-flex-col hw-gap-2">
// 			<div className="hw-flex hw-flex-col hw-gap-2">
// 				<div className="hw-mx-auto">
// 					<Button mode={selectedDirection === 'top' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('top')}>
// 						<ArrowUpIcon className="hw-w-5 hw-h-5"/>
// 					</Button>
// 				</div>
// 				<div className="hw-flex hw-justify-between">
// 					<Button mode={selectedDirection === 'left' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('left')}>
// 						<ArrowLeftIcon className="hw-w-5 hw-h-5"/>
// 					</Button>
// 					<Button mode={selectedDirection === 'right' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('right')}>
// 						<ArrowRightIcon className="hw-w-5 hw-h-5"/>
// 					</Button>
// 				</div>
// 				<div className="hw-mx-auto">
// 					<Button mode={selectedDirection === 'bottom' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('bottom')}>
// 						<ArrowDownIcon className="hw-w-5 hw-h-5"/>
// 					</Button>
// 				</div>
// 			</div>
// 			<InputBlur key={selectedValue} value={selectedValue || ''} onChange={onChangeInput} className="w-full"/>
// 		</div>
// 	)
// }

// type Alignments = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right'
// | 'bottom-left' | 'bottom-center' | 'bottom-right'
// interface AlignmentSelectorProps {
// 	value: Alignments,
// 	onChange: (value: Alignments) => void;
// 	className?: string
// }
// const AlignmentSelector: React.FunctionComponent<AlignmentSelectorProps> = ({value, onChange, className}) => {
// 	const alignmentButtons: {alignment: Alignments, icon: IconComponent, attr?: string}[][] = [
// 		[{
// 			alignment: 'top-left',
// 			icon: Bars3BottomRight,
// 			attr: 'rotate-180'
// 		},
// 		{
// 			alignment: 'top-center',
// 			icon: Bars3
// 		},
// 		{
// 			alignment: 'top-right',
// 			icon: Bars3BottomLeft,
// 			attr: 'rotate-180'
// 		},],
// 		[{
// 			alignment: 'middle-left',
// 			icon: Bars3CenterLeft,
// 		},
// 		{
// 			alignment: 'middle-center',
// 			icon: Bars3
// 		},
// 		{
// 			alignment: 'middle-right',
// 			icon: Bars3CenterLeft,
// 			attr: 'rotate-180'
// 		},],
// 		[{
// 			alignment: 'bottom-left',
// 			icon: Bars3BottomLeft,
// 		},
// 		{
// 			alignment: 'bottom-center',
// 			icon: Bars3
// 		},
// 		{
// 			alignment: 'bottom-right',
// 			icon: Bars3BottomRight,
// 		},]
// 	]
// 	return (
// 		<div className={getClass('hw-inline-flex hw-flex-col hw-gap-2', className)}>
// 			{alignmentButtons.map((row, i) => <div key={i} className="hw-flex hw-gap-2">
// 				{row.map(button => <button key={button.alignment} onClick={() => onChange(button.alignment)} className={getClass('p-1 hw-bg-white rounded-md', value === button.alignment ? 'border shadow-sm hover:hw-bg-gray-50' : 'hover:hw-bg-gray-100')}>
// 					<button.icon className={getClass('hw-w-5 hw-h-5', button.attr)}/>
// 				</button>)}
// 			</div>)}
// 		</div>
// 	)
// }
