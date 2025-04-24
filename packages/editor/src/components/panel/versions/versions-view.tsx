'use client'

import type React from 'react'

import { useState } from 'react'
//import { Badge } from '@/components/ui/badge'
import { Button } from '@harmony/ui/src/components/core/button'
import { Input } from '@harmony/ui/src/components/core/input'
import { ScrollArea } from '@harmony/ui/src/components/shadcn/scroll-area'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@harmony/ui/src/components/shadcn/tabs'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Maximize2,
  Eye,
  Code,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { VersionUpdate } from '../../../utils/version-updates'
import { displayDateFull } from '@harmony/util/src/utils/common'
import { EyeIcon, EyeOffIcon } from '@harmony/ui/src/components/core/icons'

interface VersionsProps {
  data: VersionUpdate[]
  onHover: (change: VersionUpdate['changes'][number]) => void
  onSelect: (change: VersionUpdate['changes'][number]) => void
  onHideChange: (
    change: VersionUpdate['changes'][number],
    value: boolean,
  ) => void
}

export const VersionsView: React.FunctionComponent<VersionsProps> = ({
  data: versionHistoryData,
  onHover,
  onSelect: onSelectProps,
  onHideChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(
    Object.fromEntries(versionHistoryData.map((day) => [day.date, true])),
  )
  const [selectedChange, setSelectedChange] = useState<number | null>(null)
  const [diffView, setDiffView] = useState<'split' | 'slider'>('split')
  const [sliderPosition, setSliderPosition] = useState(50)
  const [hiddenChanges, setHiddenChanges] = useState<number[]>([])

  // Filter changes based on search query
  const filteredHistory = versionHistoryData
    .map((day) => ({
      ...day,
      changes: day.changes.filter(
        (change) =>
          change.element.toLowerCase().includes(searchQuery.toLowerCase()) ||
          change.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          change.author.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((day) => day.changes.length > 0)

  // Toggle day expansion
  const toggleDay = (date: Date) => {
    setExpandedDays((prev) => ({
      ...prev,
      [date.toISOString()]: !prev[date.toISOString()],
    }))
  }

  // Get the selected change
  const selectedChangeDetails = versionHistoryData
    .flatMap((day) => day.changes)
    .find((change) => change.id === selectedChange)

  // Handle slider movement
  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedChangeDetails) return

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newPosition = (x / rect.width) * 100

    setSliderPosition(Math.max(0, Math.min(100, newPosition)))
  }

  const onSelect = (change: VersionUpdate['changes'][number] | null) => {
    setSelectedChange(change?.id ?? null)
    change && onSelectProps(change)
  }

  const handleHideChange = (
    change: VersionUpdate['changes'][number],
    hide: boolean,
  ) => {
    setHiddenChanges((prev) =>
      hide ? [...prev, change.id] : prev.filter((id) => id !== change.id),
    )
    onHideChange(change, hide)
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b'>
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-500' />
          <Input
            placeholder='Search changes...'
            className='pl-8 h-9 text-sm w-full'
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      </div>

      <div className='flex flex-col h-full'>
        {selectedChange !== null ? (
          <div className='flex flex-col h-full'>
            <div className='border-b p-3 flex items-center justify-between'>
              <Button mode='secondary' size='sm' onClick={() => onSelect(null)}>
                <ArrowLeft className='h-4 w-4 mr-1' />
                Back
              </Button>
              {/* <div className='flex items-center gap-1'>
                <Button
                  mode={diffView === 'split' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setDiffView('split')}
                  className='h-8 w-8 p-0'
                >
                  <Code className='h-4 w-4' />
                </Button>
                <Button
                  mode={diffView === 'slider' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setDiffView('slider')}
                  className='h-8 w-8 p-0'
                >
                  <Maximize2 className='h-4 w-4' />
                </Button>
              </div> */}
            </div>

            {selectedChangeDetails ? (
              <VersionDetail
                change={selectedChangeDetails}
                hide={hiddenChanges.includes(selectedChangeDetails.id)}
                onHideChange={handleHideChange}
              />
            ) : null}
          </div>
        ) : (
          <ScrollArea className='flex-1'>
            <div className=''>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((day) => (
                  <div key={day.date.toISOString()} className='mb-2'>
                    <button
                      className='flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-gray-200'
                      onClick={() => toggleDay(day.date)}
                    >
                      <span>{displayDateFull(day.date)}</span>
                      {expandedDays[day.date.toISOString()] ? (
                        <ChevronDown className='h-4 w-4 text-gray-500' />
                      ) : (
                        <ChevronRight className='h-4 w-4 text-gray-500' />
                      )}
                    </button>
                    {expandedDays[day.date.toISOString()] && (
                      <div className='ml-2 mt-1 space-y-1 border-l pl-3 border-gray-400'>
                        {day.changes.map((change) => (
                          <div key={change.id} className='relative'>
                            {hiddenChanges.includes(change.id) ? (
                              <div className='absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary' />
                            ) : null}
                            <button
                              className='flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-200'
                              onClick={() => onSelect(change)}
                              onMouseOver={() => onHover(change)}
                            >
                              <div className='flex w-full items-center justify-between'>
                                <div className='flex items-center gap-1.5'>
                                  {/* <Badge
                                  variant={getBadgeVariant(change.changeType)}
                                  className='capitalize text-xs px-1 py-0'
                                >
                                  {change.changeType.substring(0, 1)}
                                </Badge> */}
                                  <span className='font-medium truncate'>
                                    {change.element}
                                  </span>
                                </div>
                                <div className='flex items-center text-xs text-gray-500'>
                                  <Clock className='mr-1 h-3 w-3' />
                                  {change.time}
                                </div>
                              </div>
                              {/* <div className='mt-1 w-full flex gap-1'>
                              <div className='w-1/2 h-12 rounded overflow-hidden border'>
                                <img
                                  src={change.beforeImage || '/placeholder.svg'}
                                  alt='Before'
                                  className='w-full h-full object-cover'
                                />
                              </div>
                              <div className='w-1/2 h-12 rounded overflow-hidden border'>
                                <img
                                  src={change.afterImage || '/placeholder.svg'}
                                  alt='After'
                                  className='w-full h-full object-cover'
                                />
                              </div>
                            </div> */}
                              <p className='mt-0.5 text-xs text-gray-500 truncate w-full'>
                                {change.description}
                              </p>
                              <div className='mt-0.5 text-xs text-gray-500'>
                                by {change.author}
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className='py-4 text-center text-sm text-gray-500'>
                  <p>No changes match your search.</p>
                  <Button
                    mode='secondary'
                    size='sm'
                    className='mt-2'
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

interface VersionDetailProps {
  change: VersionUpdate['changes'][number]
  hide: boolean
  onHideChange: (
    change: VersionUpdate['changes'][number],
    hideChanges: boolean,
  ) => void
}

const VersionDetail: React.FunctionComponent<VersionDetailProps> = ({
  change,
  hide,
  onHideChange,
}) => {
  const handleHideChange = () => {
    onHideChange(change, !hide)
  }

  return (
    <div className='p-3 flex-1 overflow-auto' key={change.id}>
      <div className='flex items-start justify-between'>
        <div className='mb-3'>
          <h3 className='font-medium'>{change.element}</h3>
          <p className='text-sm text-gray-500'>{change.description}</p>
          <div className='flex items-center gap-2 mt-1 text-xs text-gray-500'>
            {/* <Badge
        variant={getBadgeVariant(
          change.changeType,
        )}
        className='capitalize'
      >
        {change.changeType}
      </Badge> */}
            <span>
              {change.author} • {change.time}
            </span>
          </div>
        </div>
        <button
          className='p-1.5 hover:bg-gray-200 rounded-md'
          onClick={handleHideChange}
        >
          {hide ? (
            <EyeOffIcon className='size-4' />
          ) : (
            <EyeIcon className='size-4' />
          )}
        </button>
      </div>

      {/* <Tabs defaultValue='visual' className='w-full'>
    <TabsList className='grid w-full grid-cols-2'>
      <TabsTrigger value='visual'>
        <Eye className='h-3 w-3 mr-1' />
        Visual
      </TabsTrigger>
      <TabsTrigger value='code'>
        <Code className='h-3 w-3 mr-1' />
        Code
      </TabsTrigger>
    </TabsList>

    <TabsContent value='visual' className='mt-2'>
      {diffView === 'split' ? (
        <div className='grid grid-cols-2 gap-2'>
          <div className='border rounded-md p-1'>
            <div className='text-xs text-gray-500 mb-1'>
              Before
            </div>
            <div className='overflow-hidden rounded'>
              <img
                src={
                  change.beforeImage ||
                  '/placeholder.svg'
                }
                alt='Before'
                className='w-full h-auto'
              />
            </div>
          </div>
          <div className='border rounded-md p-1'>
            <div className='text-xs text-gray-500 mb-1'>
              After
            </div>
            <div className='overflow-hidden rounded'>
              <img
                src={
                  change.afterImage ||
                  '/placeholder.svg'
                }
                alt='After'
                className='w-full h-auto'
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className='border rounded-md relative h-[200px] overflow-hidden cursor-col-resize'
          onMouseMove={handleSliderMove}
        >
          <div className='absolute inset-0 overflow-hidden'>
            <img
              src={
                change.beforeImage ||
                '/placeholder.svg'
              }
              alt='Before'
              className='w-full h-full object-cover'
            />
          </div>
          <div
            className='absolute inset-0 overflow-hidden'
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={
                change.afterImage ||
                '/placeholder.svg'
              }
              alt='After'
              className='w-full h-full object-cover'
            />
          </div>
          <div
            className='absolute top-0 bottom-0 w-0.5 bg-primary cursor-col-resize'
            style={{ left: `${sliderPosition}%` }}
          >
            <div className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white'>
              <ArrowLeft className='h-3 w-3' />
              <ArrowRight className='h-3 w-3' />
            </div>
          </div>
          <div className='absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded'>
            Before
          </div>
          <div className='absolute top-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded'>
            After
          </div>
        </div>
      )}
    </TabsContent> */}

      {/* <TabsContent value='code' className='mt-2'> */}
      <div className='grid grid-cols-2 gap-2'>
        <div className='border rounded-md p-2'>
          <div className='text-xs text-gray-500 mb-1'>Before</div>
          <pre className='text-xs bg-gray-200 p-2 rounded overflow-x-auto flex flex-col'>
            {[change.beforeCode].map((code) => (
              <code key={code}>{code}</code>
            ))}
          </pre>
        </div>
        <div className='border rounded-md p-2'>
          <div className='text-xs text-gray-500 mb-1'>After</div>
          <pre className='text-xs bg-gray-200 p-2 rounded overflow-x-auto flex flex-col'>
            {[change.afterCode].map((code) => (
              <code key={code}>{code}</code>
            ))}
          </pre>
        </div>
      </div>
      {/* </TabsContent>
  </Tabs> */}

      <div className='flex justify-between mt-4'>
        {/* <Button mode='secondary'>Revert to this version</Button> */}
        {/* <Button size='sm'>Apply this change</Button> */}
      </div>
    </div>
  )
}
