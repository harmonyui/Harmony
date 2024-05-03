"use client";
import { useState } from "react";
import { ChevronSwitch } from "./chevron-switch";
import { Input } from "./input";
import type { FilterChildren, FilterItem } from "./filter-button";
import { FilterButton } from "./filter-button";
import { Dropdown } from "./dropdown";
import { BarsArrowDownIcon } from "./icons";
import { compare } from "@harmony/util/src/utils/common";

export type TableGridItemValue =
  | string
  | { compareKey: string | number; label: React.ReactNode };
export type TableGridItem<T, S extends keyof T = keyof T> = {[Key in S]: TableGridItemValue};
export interface TableGridColumn<S> {
  id: S;
  label: string;
}
export type TableGridFooter<S extends string | number | symbol> = Record<S, React.ReactNode>
export interface TableGridItemParams<T, S extends keyof T> {
	id: string,
	gridItem: TableGridItem<T, S>, 
	background?: string,
	backgroundHover?: string,
	extraContent?: React.ReactNode
}
export type FilterFunction<T> = {[P in keyof T]?: (key: T[P]) => boolean;}
export interface TableGridProps<T, S extends keyof T> {
  data: T[];
	columns: TableGridColumn<S>[];
  itemsPerPage?: number;
  footer?: TableGridFooter<S> | ((data: T[]) => TableGridFooter<S>);
  onItemClick?: (item: T, index: number) => void;
  className?: string;
	search?: boolean;
	children: (item: T, index: number) => TableGridItemParams<T, S>
}
export const TableGrid = <T, S extends keyof T>({
  data,
  columns,
  onItemClick,
  itemsPerPage,
  footer: footerFunc,
  className,
	children,
}: TableGridProps<T, S>): JSX.Element => {
  const [sortId, setSortId] = useState<S | undefined>();
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [pageNum, setPageNum] = useState(1);

	const items: TableGridItemParams<T, S>[] = data.map(children);
	
  const totalPages = (function getTotalPages(): number {
    if (itemsPerPage !== undefined) {
      const numItems = items.length / itemsPerPage;

      return Math.floor(numItems) + (Math.floor(numItems) < numItems ? 1 : 0);
    }

    return 1;
  })();

  const getCompareKey = (item: TableGridItemValue): string | number => {
    if (typeof item === "string") return item;

    return item.compareKey;
  };

  const getLabel = (item: TableGridItemValue): React.ReactNode => {
    if (typeof item === "string") return item;

    return item.label;
  };

  const sortItems = (): TableGridItemParams<T, S>[] => {
    if (sortId) {
      return items.slice().sort(({gridItem: a}, {gridItem: b}) => {
        let first = a;
        let second = b;
        if (sortOrder === "DESC") {
          first = b;
          second = a;
        }

				const firstVal = first[sortId];
				const secondVal = second[sortId];
				
        return compare(
          getCompareKey(firstVal),
          getCompareKey(secondVal),
        );
      });
    }

    return items;
  };

  const paginateItems = (pageItems: TableGridItemParams<T, S>[]): TableGridItemParams<T, S>[] => {
    const pageNumIndexed = pageNum - 1;
    if (itemsPerPage !== undefined) {
      return pageItems.slice(
        pageNumIndexed * itemsPerPage,
        pageNumIndexed * itemsPerPage + itemsPerPage,
      );
    }

    return pageItems;
  };

  const onSortClick = (id: S): void => {
    const newSortOrder =
      sortId === undefined || sortOrder === "DESC" ? "ASC" : "DESC";
    setSortId(id);
    setSortOrder(newSortOrder);
  };

  const onRowClick = (item: T, index: number): void => {
		onItemClick && onItemClick(item, index);
  };

  const sorted = paginateItems(sortItems());
	const footer = typeof footerFunc === 'function' ? footerFunc(data) : footerFunc;
  return (
    <div className={`${className} hw-flex hw-flex-col hw-gap-2`}>
      <div className="hw-relative hw-overflow-x-auto">
        <table className="hw-w-full hw-text-sm hw-text-left hw-rounded-md hw-shadow-md hw-overflow-hidden">
          <thead className="hw-text-xs hw-bg-gray dark:hw-bg-gray-700 hw-font-semibold">
            <tr>
              {columns.map(({ label, id }) => (
                <th className="hw-px-4 hw-py-1 hw-border-b" key={label} scope="col">
                  <ChevronSwitch
                    label={label}
                    onChange={() => {
                      onSortClick(id);
                    }}
                    value={id === sortId && sortOrder === "ASC"}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
							<>
								<tr
									className={`${item.background ?? 'hw-bg-gray-50'} hw-border-b dark:hw-bg-gray-800 dark:hw-border-gray-700 ${
										onItemClick ? `${item.backgroundHover ?? 'hover:hw-bg-gray-100'} hw-cursor-pointer` : ""
									}`}
									key={item.id}
									onClick={() => {
										const index = items.indexOf(item);
										onRowClick(data[index], index);
									}}
								>
									{columns.map(({ id }) => (
										<td className="hw-px-6 hw-py-4" key={id.toString()}>
											{getLabel(item.gridItem[id])}
										</td>
									))}
								</tr>
								{item.extraContent !== undefined ? <tr key={`${item.id}-extra`}><td colSpan={columns.length}>{item.extraContent}</td></tr> : null}
							</>	
            ))}
            {footer ? (
              <tr className="hw-bg-gray-50 hw-border-b dark:hw-bg-gray-800 dark:hw-border-gray-700">
                {columns.map(({ id }) => (
                  <td className="hw-px-6 hw-py-4" key={id.toString()}>
                    {footer[id]}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {itemsPerPage !== undefined && totalPages > 1 ? (
        <div className="hw-flex hw-flex-col hw-mx-auto hw-text-center">
          <span>
            {pageNum} of {totalPages}
          </span>
          <div>
            <button
              className="hw-text-primary hover:hw-text-primary-light disabled:hw-text-primary/50"
              disabled={pageNum === 1}
              onClick={() => {
                setPageNum(pageNum > 1 ? pageNum - 1 : 1);
              }}
              type="button"
            >
              Prev
            </button>
            <span> | </span>
            <button
              className="hw-text-primary hover:hw-text-primary-light disabled:hw-text-primary/50"
              disabled={pageNum === totalPages}
              onClick={() => {
                setPageNum(pageNum < totalPages ? pageNum + 1 : totalPages);
              }}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export type FilterTableGridProps<TFilter, TTable extends Record<string, unknown>, TTableKey extends keyof TTable> = {
	search?: boolean,
	items: FilterItem<TFilter>[],
	onChange: (items: FilterItem<TFilter>[]) => void,
	getFilterContent: FilterChildren<TFilter>,
	filterFunctions: FilterFunction<TTable>,
	filterKeys: (keyof TTable)[],
	sortOptions?: {id: string, name: string, sortFunc: (items: TTable[]) => TTable[]}[]
} & TableGridProps<TTable, TTableKey>

export const FilterTableGrid = <TFilter, TTable extends Record<string, unknown>, TTableKey extends keyof TTable>({search, items, onChange, getFilterContent, filterFunctions, filterKeys, sortOptions, ...tableProps}: FilterTableGridProps<TFilter, TTable, TTableKey>): JSX.Element => {
	const [searchKey, setSearchKey] = useState<string | undefined>();
	const [sortId, setSortId] = useState<string | undefined>();
	const filteredData = searchItems(
    filterItems<TTable, TTableKey>(tableProps.data, filterFunctions),
    searchKey,
    filterKeys,
  );
	const sortItems = (_items: TTable[]): TTable[] => {
		if (sortId === undefined || sortOptions === undefined) {
			return _items;
		}

		const option = sortOptions.find(sortOption => sortOption.id === sortId);
		if (option === undefined) {
			return _items;
		}

		return option.sortFunc(_items);
	}

	const onSortChange = (item: {id: string}): void => {
		setSortId(item.id);
	}
	return (
		<div className="hw-flex hw-flex-col hw-gap-2">
			<div className="hw-flex hw-gap-2">
				{search ? <div className="hw-w-fit"><Input
					className="hw-h-8"
					onChange={setSearchKey}
					placeholder="Search"
					value={searchKey}
				/></div> : null}
				<FilterButton items={items} onChange={onChange}>
					{getFilterContent}
				</FilterButton>
				{sortOptions !== undefined ? <div className="">
					<Dropdown beforeIcon={BarsArrowDownIcon} chevron={false} initialValue={sortId} items={sortOptions} onChange={onSortChange}> Sort</Dropdown>
					</div> : null}
			</div>
			<TableGrid {...tableProps} data={sortItems(filteredData)}/>
		</div>
	)
}

function filterItems<T, S extends keyof T>(
  items: T[],
  filterObject: { [P in S]?: (key: T[P]) => boolean },
): T[] {
  const filterItem = (item: T): boolean => {
    for (const key in filterObject) {
      const predicate = filterObject[key];
      if (predicate && !predicate(item[key])) {
        return false;
      }
    }
    return true;
  };
  return items.filter((item) => filterItem(item));
}

function searchItems<T extends Record<string, unknown>>(
  items: T[],
  filterKey: string | undefined,
  keys?: (keyof T)[],
): T[] {
  const _getCompareKey = (value: unknown): string | number => {
    return String(value).toLowerCase();
  };
  const reduceItem = (item: T): string =>
    Object.entries(item).reduce<string>(
      (prev, [key, value]) =>
        prev +
        (keys === undefined || keys.includes(key) ? _getCompareKey(value) : ""),
      "",
    );

  return items.filter((item) =>
    reduceItem(item).includes((filterKey || "").toLowerCase()),
  );
}