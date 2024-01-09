interface ChangePropertyType<T> {
  <K extends keyof T>(item: T, key: K, value: T[K]): T;
  function: (item: T) => void;
}
export const useChangeProperty = <T>(
  func: (item: T) => void,
): ChangePropertyType<T> => {
  const ret: ChangePropertyType<T> = <K extends keyof T>(
    item: T,
    key: K,
    value: T[K],
  ): T => {
    const copy = { ...item };
    copy[key] = value;

    func(copy);

    return copy;
  };
  ret.function = func;

  return ret;
};

interface ChangeArrayType<T> {
  <K extends keyof T>(items: T[], index: number, key: K, value: T[K]): T[];
  function: (items: T[]) => void;
}
export const useChangeArray = <T>(
  func: (items: T[]) => void,
): ChangeArrayType<T> => {
  const ret: ChangeArrayType<T> = <K extends keyof T>(
    items: T[],
    index: number,
    key: K,
    value: T[K],
  ): T[] => {
    const copy = items.slice();
    const item = copy[index];
    //if (item === undefined) throw new Error("Invalid index");

		const copyItem = {...item};

    copyItem[key] = value;
		copy[index] = copyItem;

    func(copy);

    return copy;
  };
  ret.function = func;

  return ret;
};