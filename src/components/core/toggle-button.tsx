import { Button } from "./button";

export interface ToggleButtonType<T> {
  buttons: {
    id: T;
    label: string;
  }[];
  selected: T;
  setSelected: (selected: T) => void;
}
export const ToggleButton = <T,>({
  buttons,
  selected,
  setSelected,
}: ToggleButtonType<T>) => {
  return (
    <>
      <div className="flex gap-2">
        {buttons.map((button, i) => (
          <Button
            key={i}
            mode={selected === button.id ? "primary" : "secondary"}
            onClick={() => {
              setSelected(button.id);
            }}
          >
            {button.label}
          </Button>
        ))}
      </div>
    </>
  );
};
