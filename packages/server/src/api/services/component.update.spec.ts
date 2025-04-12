import { describe, expect, it } from 'vitest'
import type { ComponentUpdateWithDate } from './component-update'
import { normalizeRecentUpdates } from './component-update'
import { ComponentUpdate } from '@harmony/util/src/types/component'

describe('component-update', () => {
  describe('normalizeRecentUpdates', () => {
    const areEqual = (a: ComponentUpdate, b: ComponentUpdate) => {
      return (
        a.type === b.type &&
        a.name === b.name &&
        a.componentId === b.componentId &&
        a.childIndex === b.childIndex &&
        a.value === b.value
      )
    }
    it('Should remove older of same updates', () => {
      const updates = testCases.mostRecent
      const normalized = normalizeRecentUpdates(updates)
      expect(normalized.length).toBe(3)
      expect(areEqual(normalized[0], updates[0])).toBe(true)
      expect(areEqual(normalized[1], updates[1])).toBe(true)
      expect(areEqual(normalized[2], updates[2])).toBe(true)
    })

    it('Should go with last update when same date', () => {
      const updates = testCases.sameDate
      const normalized = normalizeRecentUpdates(updates)
      expect(normalized.length).toBe(3)
      expect(areEqual(normalized[0], updates[3])).toBe(true)
      expect(areEqual(normalized[1], updates[0])).toBe(true)
      expect(areEqual(normalized[2], updates[2])).toBe(true)
    })

    it('Should not normalize different child indexes', () => {
      const updates = testCases.childIndex
      const normalized = normalizeRecentUpdates(updates)
      expect(normalized.length).toBe(3)
      expect(areEqual(normalized[0], updates[0])).toBe(true)
      expect(areEqual(normalized[1], updates[1])).toBe(true)
      expect(areEqual(normalized[2], updates[2])).toBe(true)
    })
  })

  //TODO: When css updator has meaningful stuff, put tests here
  // describe("prepareUpdatesForGenerator", () => {

  // })
})

//type Cases = keyof typeof testCases;
const testCases = {
  mostRecent: [
    {
      type: 'className',
      name: 'padding-left',
      value: '12px',
      oldValue: '14px',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:03.826Z'),
    },
    {
      type: 'text',
      name: 'string',
      value: 'Hello there',
      oldValue: 'Good bye',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:10.826Z'),
    },
    {
      type: 'text',
      name: 'string',
      value: 'Hello there',
      oldValue: 'Good bye',
      isGlobal: false,
      componentId: '2',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:10.826Z'),
    },
    {
      type: 'className',
      name: 'padding-left',
      value: '10px',
      oldValue: '12px',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:00.826Z'),
    },
  ],
  sameDate: [
    {
      type: 'className',
      name: 'padding-left',
      value: '12px',
      oldValue: '14px',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:03.826Z'),
    },
    {
      type: 'text',
      name: 'string',
      value: 'Hello there',
      oldValue: 'Good bye',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:10.826Z'),
    },
    {
      type: 'text',
      name: 'string',
      value: 'Thank you',
      oldValue: 'Hello there',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:10.826Z'),
    },
    {
      type: 'className',
      name: 'padding-left',
      value: '10px',
      oldValue: '12px',
      isGlobal: false,
      componentId: '2',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:00.826Z'),
    },
  ],
  childIndex: [
    {
      type: 'className',
      name: 'padding-left',
      value: '12px',
      oldValue: '14px',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:03.826Z'),
    },
    {
      type: 'text',
      name: 'string',
      value: 'Hello there',
      oldValue: 'Good bye',
      isGlobal: false,
      componentId: '1',
      childIndex: 0,
      dateModified: new Date('2024-06-10T15:28:10.826Z'),
    },
    {
      type: 'text',
      name: 'string',
      value: 'Hello there',
      oldValue: 'Good bye',
      isGlobal: false,
      componentId: '1',
      childIndex: 1,
      dateModified: new Date('2024-06-10T15:28:20.826Z'),
    },
  ],
} as const satisfies Record<string, ComponentUpdateWithDate[]>
