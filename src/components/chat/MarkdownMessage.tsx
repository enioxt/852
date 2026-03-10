'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-neutral-300">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-white mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold text-white mt-2 mb-1">{children}</h3>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 my-2 overflow-x-auto">
                <code className="text-xs font-mono text-neutral-300">{children}</code>
              </pre>
            );
          }
          return (
            <code className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-blue-500/50 pl-3 my-2 text-neutral-400 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            {children}
          </a>
        ),
        hr: () => <hr className="border-neutral-800 my-3" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-xs border border-neutral-800 rounded">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="px-3 py-1.5 bg-neutral-900 text-left font-semibold text-neutral-300 border-b border-neutral-800">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 border-b border-neutral-800/50 text-neutral-400">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
