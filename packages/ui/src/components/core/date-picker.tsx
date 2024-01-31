/* eslint-disable no-nested-ternary -- We will let this go for now... */
import React, { useRef } from "react";
import {
  CalendarDate,
  createCalendar,
  getDayOfWeek,
  getLocalTimeZone,
  getWeeksInMonth,
  isSameDay,
} from "@internationalized/date";
import { useRangeCalendar } from "@react-aria/calendar";
import { useLocale } from "@react-aria/i18n";
import { useRangeCalendarState } from "@react-stately/calendar";
import { type DatePickerProps } from "@react-types/datepicker";
import {
  DismissButton,
  mergeProps,
  Overlay,
  useButton,
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  useDateField,
  useDatePicker,
  useDateRangePicker,
  useDateSegment,
  useDialog,
  useFocusRing,
  usePopover,
  type AriaButtonProps,
  type AriaCalendarGridProps,
  type AriaDialogProps,
  type AriaPopoverProps,
  type CalendarProps,
  type DateRange,
  type DateValue,
  type RangeCalendarProps,
} from "react-aria";
import {
  useCalendarState,
  useDateFieldState,
  useDatePickerState,
  useDateRangePickerState,
  type CalendarState,
  type DateFieldState,
  type DatePickerStateOptions,
  type DateSegment,
  type OverlayTriggerState,
  type RangeCalendarState,
} from "react-stately";

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationIcon,
} from "./icons";
import { createPortal } from "react-dom";

const dateToCalendarDate = (date: Date): CalendarDate =>
  new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

interface MyDatePickerProps {
  date: Date | null;
  onChange: (date: Date | null) => void;
}
export const DatePicker = (props: MyDatePickerProps): JSX.Element => {
  const options: DatePickerStateOptions<CalendarDate> = {
    value: props.date ? dateToCalendarDate(props.date) : null,
    onChange: (value: CalendarDate | null) => {
      props.onChange(value?.toDate(getLocalTimeZone()) ?? null);
    },
  };
  const state = useDatePickerState(options);
  const ref = useRef<HTMLDivElement>(null);
  const { groupProps, fieldProps, buttonProps, dialogProps, calendarProps } =
    useDatePicker(options, state, ref);

  return (
    <div className="relative text-left">
      {/* <span {...labelProps} className="text-sm text-gray-800">
        {props.label}
      </span> */}
      <div {...groupProps} className="flex group" ref={ref}>
        <div className="bg-white border border-gray-300 group-hover:border-gray-400 transition-colors rounded-l-md group-focus-within:border-primary group-focus-within:group-hover:border-primary p-1 relative flex items-center">
          <DateField {...fieldProps} />
          {state.validationState === "invalid" && (
            <ExclamationIcon className="w-6 h-6 text-red-500 absolute right-1" />
          )}
        </div>
        <FieldButton {...buttonProps} isPressed={state.isOpen}>
          <CalendarIcon className="w-4 h-4 text-gray-700 group-focus-within:text-primary" />
        </FieldButton>
      </div>
      {state.isOpen ? (
        <Popover
          className="p-8"
          placement="bottom start"
          state={state}
          triggerRef={ref}
        >
          <Dialog {...dialogProps}>
            <Calendar {...calendarProps} />
          </Dialog>
        </Popover>
      ) : null}
    </div>
  );
};

interface DateRangePickerProps {
  start: Date | null;
  end: Date | null;
  onChange: (start: Date, end?: Date) => void;
}
export const DateRangePicker = (props: DateRangePickerProps): JSX.Element => {
  const options = {
    value:
      props.start && props.end
        ? {
            start: dateToCalendarDate(props.start),
            end: dateToCalendarDate(props.end),
          }
        : null,
    onChange: (range: DateRange) => {
      props.onChange(
        range.start.toDate(getLocalTimeZone()),
        range.end.toDate(getLocalTimeZone()),
      );
    },
  };
  const state = useDateRangePickerState(options);
  const ref = useRef<HTMLDivElement>(null);
  const {
    groupProps,
    //labelProps,
    startFieldProps,
    endFieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDateRangePicker(options, state, ref);

  return (
    <div className="relative text-left">
      {/* <span {...labelProps} className="text-sm text-gray-800">
        {props.label}
      </span> */}
      <div {...groupProps} className="flex group" ref={ref}>
        <div className="flex bg-white border border-gray-300 group-hover:border-gray-400 transition-colors rounded-l-md pr-10 group-focus-within:border-primary group-focus-within:group-hover:border-primary p-1 relative">
          <DateField {...startFieldProps} />
          <span aria-hidden="true" className="px-2">
            –
          </span>
          <DateField {...endFieldProps} />
          {state.validationState === "invalid" && (
            <ExclamationIcon className="w-6 h-6 text-red-500 absolute right-1" />
          )}
        </div>
        <FieldButton {...buttonProps} isPressed={state.isOpen}>
          <CalendarIcon className="w-5 h-5 text-gray-700 group-focus-within:text-primary" />
        </FieldButton>
      </div>
      {state.isOpen ? (
        <Popover
          className="p-8"
          placement="bottom start"
          state={state}
          triggerRef={ref}
        >
          <Dialog {...dialogProps}>
            <RangeCalendar {...calendarProps} />
          </Dialog>
        </Popover>
      ) : null}
    </div>
  );
};

export const DateField = <T extends DateValue>(
  props: DatePickerProps<T>,
): JSX.Element => {
  const { locale } = useLocale();
  const state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { fieldProps } = useDateField(props, state, ref);

  return (
    <div {...fieldProps} className="flex text-xs" ref={ref}>
      {state.segments.map((segment, i) => (
        <DateSegment key={i} segment={segment} state={state} />
      ))}
    </div>
  );
};

function DateSegment({
  segment,
  state,
}: {
  segment: DateSegment;
  state: DateFieldState;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { segmentProps } = useDateSegment(segment, state, ref);

  return (
    <div
      {...segmentProps}
      className={`px-0.5 box-content tabular-nums text-right outline-none rounded-sm focus:bg-primary focus:text-white group ${
        !segment.isEditable ? "text-gray-500" : "text-gray-800"
      }`}
      ref={ref}
      style={{
        ...segmentProps.style,
        minWidth:
          segment.maxValue !== undefined
            ? `${String(segment.maxValue).length}ch`
            : undefined,
      }}
    >
      {/* Always reserve space for the placeholder, to prevent layout shift when editing. */}
      <span
        aria-hidden="true"
        className="block w-full text-center italic text-gray-500 group-focus:text-white"
        style={{
          visibility: segment.isPlaceholder ? undefined : "hidden",
          height: segment.isPlaceholder ? "" : 0,
          pointerEvents: "none",
        }}
      >
        {segment.placeholder}
      </span>
      {segment.isPlaceholder ? "" : segment.text}
    </div>
  );
}

export const Calendar = <T extends DateValue>(
  props: CalendarProps<T> | { value: Date },
): JSX.Element => {
  const options =
    props.value && "getDate" in props.value
      ? { value: dateToCalendarDate(props.value) }
      : (props as CalendarProps<DateValue>);
  const { locale } = useLocale();
  const state = useCalendarState({
    ...options,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } =
    useCalendar(
      options,
      state,
      //ref
    );

  return (
    <div {...calendarProps} className="inline-block text-gray-800" ref={ref}>
      <div className="flex items-center pb-4">
        <h2 className="flex-1 font-bold text-xl ml-2">{title}</h2>
        <CalendarButton {...prevButtonProps}>
          <ChevronLeftIcon className="h-6 w-6" />
        </CalendarButton>
        <CalendarButton {...nextButtonProps}>
          <ChevronRightIcon className="h-6 w-6" />
        </CalendarButton>
      </div>
      <CalendarGrid state={state} />
    </div>
  );
};

export const RangeCalendar = <T extends DateValue>(
  props: RangeCalendarProps<T>,
): JSX.Element => {
  const { locale } = useLocale();
  const state = useRangeCalendarState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } =
    useRangeCalendar(props, state, ref);

  return (
    <div {...calendarProps} className="inline-block" ref={ref}>
      <div className="flex items-center pb-4">
        <h2 className="flex-1 font-bold text-xl ml-2">{title}</h2>
        <CalendarButton {...prevButtonProps}>
          <ChevronLeftIcon className="h-6 w-6" />
        </CalendarButton>
        <CalendarButton {...nextButtonProps}>
          <ChevronRightIcon className="h-6 w-6" />
        </CalendarButton>
      </div>
      <CalendarGrid state={state} />
    </div>
  );
};

type CalendarGridProps = {
  state: CalendarState | RangeCalendarState;
} & AriaCalendarGridProps;
export const CalendarGrid = ({
  state,
  ...props
}: CalendarGridProps): JSX.Element => {
  const { locale } = useLocale();
  const { gridProps, headerProps, weekDays } = useCalendarGrid(props, state);

  // Get the number of weeks in the month so we can render the proper number of rows.
  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <table {...gridProps} cellPadding="0" className="flex-1">
      <thead {...headerProps} className="text-gray-600">
        <tr>
          {weekDays.map((day, index) => (
            <th className="text-center" key={index}>
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array<number>(weeksInMonth)].map((_, weekIndex) => (
          <tr key={weekIndex}>
            {state
              .getDatesInWeek(weekIndex)
              .map((date, i) =>
                date ? (
                  <CalendarCell date={date} key={i} state={state} />
                ) : (
                  <td key={i} />
                ),
              )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

interface CalendarCellProps {
  date: CalendarDate;
  state: CalendarState | RangeCalendarState;
}
export function CalendarCell({ state, date }: CalendarCellProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    formattedDate,
    isInvalid,
  } = useCalendarCell({ date }, state, ref);

  // The start and end date of the selected range will have
  // an emphasized appearance.
  const isSelectionStart =
    "highlightedRange" in state
      ? isSameDay(date, state.highlightedRange.start)
      : isSelected;
  const isSelectionEnd =
    "highlightedRange" in state
      ? isSameDay(date, state.highlightedRange.end)
      : isSelected;

  // We add rounded corners on the left for the first day of the month,
  // the first day of each week, and the start date of the selection.
  // We add rounded corners on the right for the last day of the month,
  // the last day of each week, and the end date of the selection.
  const { locale } = useLocale();
  const dayOfWeek = getDayOfWeek(date, locale);
  const isRoundedLeft =
    isSelected && (isSelectionStart || dayOfWeek === 0 || date.day === 1);
  const isRoundedRight =
    isSelected &&
    (isSelectionEnd ||
      dayOfWeek === 6 ||
      date.day === date.calendar.getDaysInMonth(date));

  const { focusProps, isFocusVisible } = useFocusRing();

  return (
    <td
      {...cellProps}
      className={`py-0.5 relative ${isFocusVisible ? "z-10" : "z-0"}`}
    >
      <div
        {...mergeProps(buttonProps, focusProps)}
        className={`w-10 h-10 outline-none group ${
          isRoundedLeft ? "rounded-l-full" : ""
        } ${isRoundedRight ? "rounded-r-full" : ""} ${
          isSelected
            ? isInvalid
              ? "bg-red-300"
              : "bg-primary bg-opacity-30"
            : ""
        } ${isDisabled ? "disabled" : ""}`}
        hidden={isOutsideVisibleRange}
        ref={ref}
      >
        <div
          className={`w-full h-full rounded-full flex items-center justify-center ${
            isDisabled && !isInvalid ? "text-gray-400" : ""
          } ${
            // Focus ring, visible while the cell has keyboard focus.
            isFocusVisible
              ? "ring-2 group-focus:z-2 ring-primary ring-offset-2"
              : ""
          } ${
            // Darker selection background for the start and end.
            isSelectionStart || isSelectionEnd
              ? isInvalid
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-primary text-white hover:bg-primary hover:bg-opacity-90"
              : ""
          } ${
            // Hover state for cells in the middle of the range.
            isSelected && !isDisabled && !(isSelectionStart || isSelectionEnd)
              ? isInvalid
                ? "hover:bg-red-400"
                : "hover:bg-primary hover:bg-opacity-30"
              : ""
          } ${
            // Hover state for non-selected cells.
            !isSelected && !isDisabled
              ? "hover:bg-opacity-10 hover:bg-primary"
              : ""
          } cursor-default`}
        >
          {formattedDate}
        </div>
      </div>
    </td>
  );
}

type DialogProps = AriaDialogProps & React.PropsWithChildren;
export function Dialog({ children, ...props }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { dialogProps } = useDialog(props, ref);

  return (
    <div {...dialogProps} ref={ref}>
      {children}
    </div>
  );
}

type PopoverProps = React.PropsWithChildren<
  Omit<AriaPopoverProps, "popoverRef"> & {
    state: OverlayTriggerState;
    className?: string;
  }
>;
export const Popover = (props: PopoverProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  const { children, state } = props;

  const { popoverProps, underlayProps } = usePopover(
    {
      ...props,
      popoverRef: ref,
    },
    state,
  );

  return (
    createPortal(<>
      <div {...underlayProps} className="fixed inset-0" />
      <div
        {...popoverProps}
        className={`hw-absolute hw-top-full hw-bg-white hw-border hw-border-gray-300 hw-rounded-md hw-shadow-lg hw-mt-2 hw-z-10 ${
          props.className || ""
        }`}
        ref={ref}
      >
        <DismissButton onDismiss={state.close.bind(state)} />
        {children}
        <DismissButton onDismiss={state.close.bind(state)} />
      </div>
    </>, document.getElementById('harmony-container') as HTMLElement)
  );
};

export function CalendarButton(props: AriaButtonProps): JSX.Element {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(props, ref);
  const { focusProps, isFocusVisible } = useFocusRing();
  return (
    <button
      {...mergeProps(buttonProps, focusProps)}
      className={`p-2 rounded-full ${props.isDisabled ? "text-gray-400" : ""} ${
        !props.isDisabled ? "hover:opacity-10 active:opacity-20" : ""
      } outline-none ${
        isFocusVisible ? "ring-2 ring-offset-2 ring-primary" : ""
      }`}
      ref={ref}
      type="button"
    >
      {props.children}
    </button>
  );
}

type FieldProps = AriaButtonProps & {
  isPressed: boolean;
};
export function FieldButton(props: FieldProps): JSX.Element {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps, isPressed } = useButton(props, ref);
  return (
    <button
      {...buttonProps}
      className={`px-2 -ml-px border transition-colors rounded-r-md group-focus-within:border-primary group-focus-within:group-hover:border-primary outline-none ${
        isPressed || props.isPressed
          ? "bg-gray-200 border-gray-400"
          : "bg-gray-50 border-gray-300 group-hover:border-gray-400"
      }`}
      ref={ref}
      type="button"
    >
      {props.children}
    </button>
  );
}
