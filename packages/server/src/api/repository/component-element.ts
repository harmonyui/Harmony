import {type ComponentElement} from '@harmony/util/src/types/component';
import {Prisma, type Db} from '@harmony/db/lib/prisma';
import {INDEXING_VERSION} from '@harmony/util/src/constants';

export type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof componentElementPayload>;

export interface ComponentElementRepository {
    createOrUpdateElement: (element: ComponentElement, repositoryId: string) => Promise<ComponentElementPrisma>
}

const componentElementPayload = {
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
export class PrismaComponentElementRepository implements ComponentElementRepository {
    constructor(private prisma: Db) {}

    public async createOrUpdateElement(instance: ComponentElement, repositoryId: string): Promise<ComponentElementPrisma> {
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
						id: instance.containingComponent.id
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
						id: instance.containingComponent.id
					}
				},
				version: INDEXING_VERSION
			},
            ...componentElementPayload
		});

		await this.prisma.componentAttribute.deleteMany({
			where: {
				component_id: instance.id
			}
		});
		newInstance.attributes = await Promise.all(instance.attributes.map(attribute => this.prisma.componentAttribute.create({
            data: {
                name: attribute.name,
                type: attribute.type,
                value: attribute.value,
                component: {
                    connect: {
                        id: instance.id
                    }
                },
                index: attribute.index,
                location: {
                    create: {
                        file: attribute.location.file,
                        start: attribute.location.start,
                        end: attribute.location.end
                    }
                },
                reference_component: {
                    connect: {
                        id: attribute.reference.id
                    }
                }
            },
            ...componentElementPayload.include.attributes
        })));

        return newInstance;
    }

    // public async getComponentElement(id: string): Promise<ComponentElement | undefined> {
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
    //             ...componentElementPayload.include,
    //             definition: {
    //                 include: {
    //                     location: true
    //                 }
    //             }
    //         }
    //     });

    //     const componentElements: ComponentElement[] = [];
    //     for (let i = 0; i < componentElements.length; i++) {

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

    // private async prismaToComponentElement(prismaElement: Prisma.ComponentElementGetPayload<typeof componentElementPayload>): Promise<ComponentElement> {
    //     const parentId = prismaElement.id.split('#').slice(0, prismaElement.id.split('#').length - 1);
    //     const parent = this.getC
    // }

    // private prismaToComponentElementRaw(prismaElement: Prisma.ComponentElementGetPayload<typeof componentElementPayload>, parent: ComponentElement | undefined, component: HarmonyComponent): ComponentElement {
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