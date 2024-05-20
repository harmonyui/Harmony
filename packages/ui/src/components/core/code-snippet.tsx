import { useRef, useState } from "react";
import { ClipboardIcon } from "./icons"; // Make sure to import the ClipboardIcon from Heroicons
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // Choose the theme you prefer

interface CodeSnippetProps {
  language: string;
  code: string;
  showLineNumbers?: boolean
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, code, showLineNumbers=false }) => {
  const codeContainerRef = useRef<HTMLPreElement | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
  };

  return (
    <div className="hw-rounded-lg hw-shadow-md hw-overflow-hidden hw-text-sm">
      <div className="hw-flex hw-justify-between hw-bg-gray-700 hw-p-4 hw-items-center hw-text-white">
        <h2 className="hw-font-semibold hw-uppercase">{language}</h2>
        {copied ? <span className="">Copied!</span> : <button
          onClick={copyCodeToClipboard}
          className="hw-flex hw-items-center hw-p-1 hw-bg-primary hw-rounded-md hover:hw-bg-primary/80 focus:hw-outline-none focus:hw-ring focus:hw-border-blue-300"
        >
          <ClipboardIcon className="hw-w-5 hw-h-5 " />
          <span className="hw-ml-2 ">Copy code</span>
        </button>}
      </div>
      {/* <pre
        ref={codeContainerRef}
        className="hw-overflow-x-auto hw-max-h-48 hw-text-white hw-p-4"
      >
        <code>{code}</code>
      </pre> */}
      <SyntaxHighlighter showLineNumbers={showLineNumbers} language={language} style={atomDark} customStyle={{margin: "0", borderRadius: "0"}}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeSnippet;
