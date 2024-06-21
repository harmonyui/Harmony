import { useState } from "react";
import { PhotoIcon } from "./icons";

export interface FileUploadAreaProps {
  onUpload: (files: FileList) => void;
}
export const FileUploadArea: React.FunctionComponent<FileUploadAreaProps> = ({
  onUpload,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    e.target.files && e.target.files.length > 0 && onUpload(e.target.files);
  };

  const handleDrag: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="flex items-center justify-center w-full relative"
      onDragEnter={handleDrag}
    >
      <label
        className={`flex flex-col items-center justify-center w-full h-32 border border-gray-300 border-dashed rounded-md cursor-pointer ${
          dragActive ? "bg-gray-50 dark:bg-gray-600" : "dark:bg-gray-700"
        } hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
        htmlFor="dropzone-file"
      >
        <PhotoIcon
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-gray-300"
        />

        <div className="flex flex-col items-center justify-center py-2">
          {/* <UploadIcon className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" /> */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-primary">Upload a file</span> or
            drag and drop
          </p>
        </div>
        <input
          className="hidden"
          id="dropzone-file"
          onChange={onChange}
          type="file"
          multiple
        />
      </label>
      {dragActive ? (
        <div
          className="absolute top-0 left-0 w-full h-full"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        />
      ) : null}
    </div>
  );
};
