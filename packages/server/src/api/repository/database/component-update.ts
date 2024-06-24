import type { Db, Prisma } from '@harmony/db/lib/prisma'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { updateTypesSchema } from '@harmony/util/src/types/component'

interface Selector {
  dateModified: Date
}

export interface ComponentUpdateRepository {
  getUpdates: <T extends keyof Selector>(
    branchId: string,
    select?: T[],
  ) => Promise<(ComponentUpdate & Pick<Selector, T>)[]>
  createUpdates: (
    updates: ComponentUpdate[],
    branchId: string,
  ) => Promise<ComponentUpdate[]>
}

export class PrismaComponentUpdateRepository
  implements ComponentUpdateRepository
{
  constructor(private prisma: Db) {}

  public async getUpdates<T extends keyof Selector>(
    branchId: string,
    select?: T[],
  ) {
    const query = await this.prisma.$queryRaw<
      {
        type: string
        childIndex: number
        name: string
        value: string
        oldValue: string
        id: string
        isGlobal: boolean
        dateModified: Date
      }[]
    >`
            SELECT u.type, u.name, u."childIndex", u.value, u.old_value as "oldValue", u.is_global as "isGlobal", u.component_id as "id", u.date_modified as "dateModified" FROM "ComponentUpdate" u
            WHERE u.branch_id = ${branchId}
            ORDER BY u.date_modified ASC`

    const updates: (ComponentUpdate & Pick<Selector, T>)[] = query.map((up) => {
      const selector: Selector = {
        dateModified: up.dateModified,
      }
      const selected: Pick<Selector, T> = {} as Pick<Selector, T>
      for (const key of select || []) {
        selected[key] = selector[key]
      }
      return {
        type: up.type as ComponentUpdate['type'],
        name: up.name,
        value: up.value,
        oldValue: up.oldValue,
        componentId: up.id,
        childIndex: up.childIndex,
        isGlobal: up.isGlobal,
        ...selected,
      }
    })

    return updates
  }

  public async createUpdates(
    updates: ComponentUpdate[],
    branchId: string,
  ): Promise<ComponentUpdate[]> {
    const newUpdates = await this.prisma.componentUpdate.createManyAndReturn({
      data: updates.map((up) => ({
        component_id: up.componentId,
        type: up.type,
        name: up.name,
        value: up.value,
        branch_id: branchId,
        old_value: up.oldValue,
        childIndex: up.childIndex,
        is_global: up.isGlobal,
      })),
    })

    return newUpdates.map((update) => this.prismaToComponentUpdate(update))
  }

  private prismaToComponentUpdate(
    update: Prisma.ComponentUpdateGetPayload<true>,
  ): ComponentUpdate {
    return {
      componentId: update.component_id,
      childIndex: update.childIndex,
      type: updateTypesSchema.parse(update.type),
      name: update.name,
      isGlobal: update.is_global,
      value: update.value,
      oldValue: update.old_value,
    }
  }
}
