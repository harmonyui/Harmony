import { Button } from "./button";

interface FormItem {
  title: string;
  description: string;
  content: React.ReactNode;
}
export interface FormTwoColumnProps {
  items: FormItem[];
  onSubmit: () => void;
  onCancel: () => void;
  showButtons: boolean;
}
export const FormTwoColumn: React.FunctionComponent<FormTwoColumnProps> = ({
  items,
  onSubmit,
  onCancel,
  showButtons,
}) => {
  const onSubmitClick: React.FormEventHandler = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={onSubmitClick}>
      <div className="space-y-12">
        {items.map((item) => (
          <FormItem item={item} key={item.title} />
        ))}
      </div>

      {showButtons ? (
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Button mode="none" onClick={onCancel}>
            Cancel
          </Button>
          <Button mode="primary" type="submit">
            Save
          </Button>
        </div>
      ) : null}
    </form>
  );
};

const FormItem: React.FunctionComponent<{ item: FormItem }> = ({ item }) => {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">
          {item.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          {item.description}
        </p>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        {item.content}
      </div>
    </div>
  );
};
