/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import type {Prisma, Db} from '@harmony/db/lib/prisma';
import {INDEXING_VERSION} from '@harmony/util/src/constants';
import type { HarmonyComponent } from '../../services/indexor/types';

export type HarmonyComponentPrisma = Prisma.ComponentElementGetPayload<typeof harmonyComponentPayload>;

export interface HarmonyComponentRepository {
    createOrUpdateElement: (element: HarmonyComponent, repositoryId: string) => Promise<HarmonyComponentPrisma>
    createOrUpdateElements: (elements: HarmonyComponent[], repositoryId: string) => Promise<void>
}

const harmonyComponentPayload = {
    include: {
        attributes: {
            include: {
                location: true,
                reference_component: true
            }
        },
        location: true
    }
}
export class PrismaHarmonyComponentRepository implements HarmonyComponentRepository {
    constructor(private prisma: Db) {}

    public async createOrUpdateElement(instance: HarmonyComponent, repositoryId: string): Promise<HarmonyComponentPrisma> {
        // const referenceFirst = instance.attributes.filter(attr => instance.id !== attr.reference.id).map(attr => attr.reference as HarmonyComponent);
        // await Promise.all(referenceFirst.map(ref => this.createOrUpdateElement(ref, repositoryId)));
        
        const newInstance = await this.prisma.componentElement.upsert({
			where: {
				id: instance.id
			},
			create: {
				id: instance.id,
				repository_id: repositoryId,
				name: instance.name,
				location: {
					create: {
						file: instance.location.file,
						start: instance.location.start,
						end: instance.location.end
					}
				},
				definition: {
					connect: {
						id: instance.containingComponent!.id
					}
				},
				version: INDEXING_VERSION
			},
			update: {
				id: instance.id,
				repository_id: repositoryId,
				name: instance.name,
				definition: {
					connect: {
						id: instance.containingComponent!.id
					}
				},
				version: INDEXING_VERSION
			},
            ...harmonyComponentPayload
		});

		// await this.prisma.componentAttribute.deleteMany({
		// 	where: {
		// 		component_id: instance.id
		// 	}
		// });
		// newInstance.attributes = await Promise.all(instance.attributes.map(attribute => this.prisma.componentAttribute.create({
        //     data: {
        //         name: attribute.name,
        //         type: attribute.type,
        //         value: attribute.value,
        //         component: {
        //             connect: {
        //                 id: instance.id
        //             }
        //         },
        //         index: attribute.index,
        //         location: {
        //             create: {
        //                 file: attribute.location.file,
        //                 start: attribute.location.start,
        //                 end: attribute.location.end
        //             }
        //         },
        //         reference_component: {
        //             connect: {
        //                 id: attribute.reference.id
        //             }
        //         }
        //     },
        //     ...harmonyComponentPayload.include.attributes
        // })));

        return newInstance;
    }

    public async createOrUpdateElements(elements: HarmonyComponent[], repositoryId: string): Promise<void> {
        const existingElements = await this.prisma.componentElement.findMany({
            where: {
                id: {
                    in: elements.map(({id}) => id)
                },
                repository_id: repositoryId
            }
        });
        const updateElements = existingElements;
        let newElements = elements.filter(({id}) => !updateElements.find(({id: updateId}) => updateId === id));
        newElements = newElements.filter(a => newElements.filter(b => a.id === b.id).length < 2);
        const locations = await this.prisma.location.createManyAndReturn({
            data: newElements.map(element => ({
                file: element.location.file,
                start: element.location.start,
                end: element.location.end
            }))
        })
        
        await this.prisma.componentElement.createMany({
            data: newElements.map((element, i) => ({
                id: element.id,
				repository_id: repositoryId,
				name: element.name,
				definition_id: element.containingComponent!.id,
                location_id: locations[i].id,
				version: INDEXING_VERSION
            }))
        })
    }

    // public async getHarmonyComponent(id: string): Promise<HarmonyComponent | undefined> {
    //     const idTree = id.split('#').reduce<string[]>((prev, curr, i) => {
    //         const prevId = id.split('#').slice(0, i)
    //         const newId = [...prevId, curr].join('#');
    //         prev.push(newId);

    //         return prev;
    //     }, []);

    //     const elements = await this.prisma.componentElement.findMany({
    //         where: {
    //             id: {
    //                 in: idTree
    //             }
    //         },
    //         include: {
    //             ...harmonyComponentPayload.include,
    //             definition: {
    //                 include: {
    //                     location: true
    //                 }
    //             }
    //         }
    //     });

    //     const harmonyComponents: HarmonyComponent[] = [];
    //     for (let i = 0; i < harmonyComponents.length; i++) {

    //     }
    // }

    // public async getHarmonyComponent(id: string): Promise<HarmonyComponent | undefined> {
    //     const componentDefinition = await this.prisma.componentDefinition.findUnique({
    //         where: {
    //             id
    //         },
    //         include: {
    //             location: true
    //         }
    //     });
    //     if (!componentDefinition) return undefined;

    //     return {
    //         id: componentDefinition.id,
    //         children: [],
    //         isComponent: true,
    //         name: componentDefinition.name,
    //         location: componentDefinition.location,
    //     }
    // }

    // private async prismaToHarmonyComponent(prismaElement: Prisma.HarmonyComponentGetPayload<typeof harmonyComponentPayload>): Promise<HarmonyComponent> {
    //     const parentId = prismaElement.id.split('#').slice(0, prismaElement.id.split('#').length - 1);
    //     const parent = this.getC
    // }

    // private prismaToHarmonyComponentRaw(prismaElement: Prisma.HarmonyComponentGetPayload<typeof harmonyComponentPayload>, parent: HarmonyComponent | undefined, component: HarmonyComponent): HarmonyComponent {
    //     return {
    //         id: prismaElement.id,
    //         attributes: prismaElement.attributes.map<Attribute>(attr => ({
    //             id: attr.id,
    //             index: attr.index,
    //             location: attr.location,
    //             name: attr.name,
    //             reference: attr.reference_component,
    //             type: attr.type,
    //             value: attr.value
    //         })),
    //         getParent() {
    //             return parent
    //         },
    //         children: [],
    //         containingComponent: component,
    //         isComponent: prismaElement.name[0].toLowerCase() !== prismaElement.name[0],
    //         location: prismaElement.location,
    //         name: prismaElement.name
    //     }
    // }
}