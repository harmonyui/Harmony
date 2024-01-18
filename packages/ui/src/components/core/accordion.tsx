import React, { Fragment, useState, type PropsWithChildren } from "react";

import { MinusIcon, PlusIcon } from "./icons";

interface AccordionItemBase {
  content: React.ReactNode;
}
interface AccordionItemLabel extends AccordionItemBase {
  label: string;
}
interface AccordionItemLabelContent extends AccordionItemBase {
  labelContent: React.ReactNode;
}
export type AccordionItem = AccordionItemLabel | AccordionItemLabelContent;
export interface AccordionProps {
  items: AccordionItem[];
}
export const Accordion: React.FunctionComponent<AccordionProps> = ({
  items,
}) => {
  const [selected, setSelected] = useState<number>(-1);
  const onSelect = (value: boolean, i: number): void => {
    setSelected(value ? i : -1);
  };
  return (
    <div className={`group ${selected}`}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <ExpandableComponent
            label={LabelContent(item)}
            onChange={(value) => {
              onSelect(value, i);
            }}
            value={selected === i}
          >
            {item.content}
          </ExpandableComponent>
        </Fragment>
      ))}
    </div>
  );
};

export interface ExpandableComponentProps extends PropsWithChildren {
  value: boolean;
  onChange?: (value: boolean) => void;
  label: React.ReactNode;
}
export const ExpandableComponent: React.FunctionComponent<
  ExpandableComponentProps
> = ({ value, onChange, label, children }) => {
  return (
    <div className="hw-flex hw-flex-col hw-gap-2">
      <button
        onClick={() => {
          onChange && onChange(!value);
        }}
        type="button"
      >
        {label}
      </button>
      {value ? <div>{children}</div> : null}
    </div>
  );
};

const LabelContent = (item: AccordionItem): React.ReactNode =>
  "labelContent" in item ? (
    item.labelContent
  ) : (
    <>
      <span>{item.label}</span>
      <PlusIcon className="hw-w-4 hw-h-4 group-[.accordion-1]:hw-hidden" />
      <MinusIcon className="hw-w-4 hw-h-4 hw-hidden group-[.accordion-1]:hw-block" />
    </>
  );
