import React from 'react';
import { Message, Agent } from '../types';
import { User, Copy, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  agent?: Agent;
}

const CodeBlock = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match;
  
  if (isInline) {
    return <code className="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-pink-300">{children}</code>;
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400 lowercase font-mono">{match?.[1] || 'code'}</span>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(String(children))}
          className="text-gray-400 hover:text-white transition-colors"
          title="Copy code"
        >
          <Copy size={14} />
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-gray-300">
        <code className={className}>
          {children}
        </code>
      </div>
    </div>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, agent }) => {
  const isUser = message.agentId === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-8">
        <div className="max-w-[80%]">
          <div className="flex items-center justify-end space-x-2 mb-1">
            <span className="text-xs text-gray-400 font-mono">You</span>
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
          </div>
          <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Agent Message
  return (
    <div className="flex justify-start mb-8 animate-fadeIn">
      <div className="max-w-[90%] w-full">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-8 h-8 rounded-full border ${agent?.color} overflow-hidden`}>
            <img src={agent?.avatar} alt={agent?.name} className="w-full h-full object-cover" />
          </div>
          <span className={`text-sm font-bold ${agent?.color.split(' ')[0]}`}>{agent?.name}</span>
          <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">{agent?.role}</span>
          <span className="text-xs text-gray-600 ml-auto font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl rounded-tl-sm shadow-sm">
           {message.isThinking ? (
             <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
               <span className="text-sm font-mono ml-2">Thinking...</span>
             </div>
           ) : (
             <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code: CodeBlock as any
                  }}
                >
                  {message.content}
                </ReactMarkdown>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
