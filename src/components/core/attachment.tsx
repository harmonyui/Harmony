import { AttachmentIcon } from "./icons";

export interface AttachmentProps {
  label: string;
  link: string;
}
export const Attachment = ({ label, link }: AttachmentProps) => {
  return (
    <a
      href={link}
      className="relative mt-2 inline-flex items-center text-sm font-medium hover:text-teal-500 focus-visible:text-teal-500 dark:hover:text-teal-300 dark:focus-visible:text-teal-300"
      target="_blank"
      rel="noreferrer"
    >
      <AttachmentIcon className="mr-2 h-3 w-3" />
      <span>{label}</span>
    </a>
  );
};
