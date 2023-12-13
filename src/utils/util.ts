import dayjs from "dayjs";
import { z } from "zod";

export const displayDate = (date: Date) => {
  return dayjs(date).format("MM/DD/YY");
};

export const displayTime = (date: Date): string => {
	return dayjs(date).format("h:mm A");
}

export const formatDollarAmount = (amount: number): string => {
  const digits = Math.floor(amount).toString().split("").reverse();
  let str = "";
  for (let i = 0; i < digits.length; i++) {
    str = digits[i] + str;
    if (i % 3 === 2 && i > 0 && i < digits.length - 1) {
      str = "," + str;
    }
  }

  // There's got to be a better way to do this
  return `$${str}${(Math.round((amount - Math.floor(amount)) * 100) / 100)
    .toString()
    .slice(1)}`;
};

export const second = 1000;
export const minute = 60000;
export const hour = 3600000;
export const day = 86400000;
export const week = 604800000;
export const calculateDateDifference = (milisecondsSinceToday: number): Date => {
	const today = new Date();
	today.setTime(today.getTime() - milisecondsSinceToday);

	return today;
}

export const displayElapsedTime = (time: Date): string => {
  const currTime = new Date();
  const elapsedTime = currTime.getTime() - time.getTime();

  if (elapsedTime < minute) {
    return `${round(elapsedTime / second)}s ago`;
  }

  if (elapsedTime < hour) {
    return `${round(elapsedTime / minute)}m ago`;
  }

  if (elapsedTime < day) {
    return `${round(elapsedTime / hour)}h ago`;
  }

  if (elapsedTime < week) {
    return `${round(elapsedTime / day)}d ago`;
  }

  return displayDate(time);
};

export const displayRelativeDate = (date: Date): string => {
	const elapsedTime = new Date().getTime() - date.getTime();
	if (elapsedTime < day) {
		return 'Today';
	}

	if (elapsedTime < day * 2) {
		return 'Yesterday';
	}

	return displayDate(date);
}

export const round = (value: number, digits = 0): number => {
  const places = Math.pow(10, digits);
  return Math.round(value * places) / places;
};

export const displayStorageSpace = (value: number): string => {
  if (value < 1000) {
    return `${value} B`;
  }

  if (value < 1000000) {
    return `${Math.round(value / 100) / 10} KB`;
  }

  if (value < 1000000000) {
    return `${Math.round(value / 100000) / 10} MB`;
  }

  return `${Math.round(value / 100000000) / 10} GB`;
};

export const compare = (f1: string | number | Date, f2: string | number | Date): number => {
  if (typeof f1 === "string" && typeof f2 === "string") {
    return f1.localeCompare(f2);
  }

  if (typeof f1 === "number" && typeof f2 === "number") {
    return f1 - f2;
  }

	if (typeof f1 === 'object' && typeof f2 === 'object') {
		return compare(f1.getTime(), f2.getTime());
	}

  return 0;
};

export const getClass = (...strings: (string | undefined)[]) => {
  return strings.filter((x) => !!x).join(" ");
};

export const groupBy = function <T extends Pick<T, K>, K extends keyof T>(
  arr: T[],
  key: K,
) {
  return arr.reduce<Record<T[K], T[]>>((prev, curr) => {
    let a: T[] = [];
    const val = prev[curr[key]];
    if (val) {
      a = val;
    }
    a?.push(curr);
    prev[curr[key]] = a;

    return prev;
  }, {});
};

export const groupByDistinct = function <
  T extends Pick<T, K>,
  K extends keyof T,
>(arr: T[], key: K) {
  return arr.reduce<Record<T[K], T>>((prev, curr) => {
    if (prev[curr[key]]) {
      throw new DOMException("Each key value in the list must be unique");
    }

    prev[curr[key]] = curr;

    return prev;
  }, {});
};

export const groupTogether = function <T extends Pick<T, K>, K extends keyof T>(
  arr: T[],
  key: K,
) {
  const groups = groupBy(arr, key);

  return Object.keys(groups);
};

export const groupTogetherDistinct = function <
  T extends Pick<T, K>,
  K extends keyof T,
>(arr: T[], key: K): string[] {
  const groups = groupByDistinct(arr, key);

  return Object.keys(groups);
};

export function isDateInBetween(
  test: Date | undefined,
  start: Date | undefined,
  end: Date | undefined,
): boolean {
  if (test === undefined) {
    return true;
  }
  return (
    (start !== undefined ? start <= test : true) &&
    (end !== undefined ? test <= end : true)
  );
}

export const arrayOfAll = <T,>() => <U extends T[]>(
  array: U & ([T] extends [U[number]] ? unknown : Exclude<T, U[number]>)
) => array;

export const stringUnionSchema = <T extends readonly string[]>(array: T) => z.custom<T[number]>((data) => typeof data === 'string' && array.includes(data));

