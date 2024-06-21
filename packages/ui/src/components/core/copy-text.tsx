import { useState, useEffect } from "react";

export const CopyText: React.FunctionComponent<{ text: string }> = ({
  text,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  useEffect(() => {
    if (text !== copiedText) {
      setCopied(false);
    }
  }, [text, copiedText]);
  return (
    <div>
      <div
        className={`hw-rounded hw-h-6 hw-leading-6 hw-cursor-pointer hw-px-1 hw-inline-block hw-transition ${
          copied
            ? "hw-text-white hw-bg-primary"
            : "hw-text-teal-900 hw-bg-gray-200 hover:hw-bg-gray-300"
        }`}
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setCopiedText(text);
        }}
      >
        <div className="hw-flex hw-items-center">
          <svg
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="hw-w-5 hw-h-5 hw-mr-1"
          >
            <path
              d={`${
                copied
                  ? "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  : "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              }`}
            ></path>
          </svg>
          {text}
        </div>
      </div>
    </div>
  );
};
