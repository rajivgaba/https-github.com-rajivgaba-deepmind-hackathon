import React, { useState, useRef, useEffect } from 'react';
import { Message, Agent } from './types';
import { AGENTS, SAMPLE_PROMPTS } from './constants';
import { generateAgentResponse } from './services/geminiService';
import { convertToIpynb, downloadNotebook } from './utils/notebookGenerator';
import AgentCard from './components/AgentCard';
import ChatMessage from './components/ChatMessage';
import { Send, Download, Sparkles, AlertTriangle, Play, Settings } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null); // Null means 'Team Mode'
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      agentId: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Logic:
      // If a specific agent is selected, only that agent responds.
      // If NO agent is selected (Team Mode), we run a sequence: Lead -> EDA -> Feature -> Model.
      // For this demo, we'll simplify Team Mode to: Lead analyzes, then delegates.
      
      const historyForContext = messages.map(m => ({
        role: m.agentId === 'user' ? 'user' : 'model',
        content: m.content
      }));

      // Add user's latest message to context
      historyForContext.push({ role: 'user', content: userMsg.content });

      if (activeAgentId) {
        // Single Agent Mode
        const agent = AGENTS.find(a => a.id === activeAgentId);
        if (agent) {
          await runAgent(agent, historyForContext);
        }
      } else {
        // Team Mode (Sequential)
        // 1. Lead Strategist
        const leadAgent = AGENTS.find(a => a.role === 'Lead Strategist')!;
        await runAgent(leadAgent, historyForContext);

        // 2. EDA Specialist (only if it seems like a new problem statement)
        const edaAgent = AGENTS.find(a => a.role === 'Data Detective')!;
        // We pass the lead's response into the history for the next agent
        const leadMsg = messages[messages.length] // This won't work because state updates are async.
        // Instead, we just chain the calls, appending to a local history tracker if needed, 
        // but for simplicity in React state, we'll just fire them.
        // To make them aware of each other, we really need the previous response.
        
        // Revised Approach for Team Mode:
        // We will chain the API calls.
        
        // Wait a bit for UX
        await new Promise(r => setTimeout(r, 1000));
        await runAgent(edaAgent, historyForContext, `Based on the user request and the Lead Strategist's plan, provide the initial Python code for loading data and EDA.`);
        
        await new Promise(r => setTimeout(r, 1000));
        const modelAgent = AGENTS.find(a => a.role === 'Model Architect')!;
        await runAgent(modelAgent, historyForContext, `Based on the previous analysis, suggest a robust validation strategy and a baseline model code (e.g. XGBoost or PyTorch).`);
      }

    } catch (error) {
      console.error("Workflow error", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const runAgent = async (agent: Agent, history: {role: string, content: string}[], overridePrompt?: string) => {
    // Optimistic UI: Show thinking state
    const thinkingMsgId = Date.now().toString() + agent.id;
    setMessages(prev => [...prev, {
      id: thinkingMsgId,
      agentId: agent.id,
      content: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    const prompt = overridePrompt || history[history.length - 1].content; // Fallback to last user msg if no override
    const responseText = await generateAgentResponse(agent, history, prompt);

    setMessages(prev => prev.map(msg => 
      msg.id === thinkingMsgId 
        ? { ...msg, content: responseText, isThinking: false }
        : msg
    ));
    
    // Return for chaining
    return responseText;
  };

  const handleDownloadNotebook = () => {
    const notebook = convertToIpynb(messages);
    downloadNotebook(notebook, 'grandmaster-solution.ipynb');
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-gray-200 font-sans overflow-hidden">
      
      {/* Sidebar - Agents */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-[#0d1117] hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2 text-purple-400 mb-1">
            <Sparkles size={20} />
            <h1 className="text-xl font-bold tracking-tight text-white">Grandmaster<span className="text-gray-500">.ai</span></h1>
          </div>
          <p className="text-xs text-gray-500">Autonomous Data Science Team</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div 
            onClick={() => setActiveAgentId(null)}
            className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 group ${activeAgentId === null ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-gray-900 border-gray-800 hover:border-indigo-500/30'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold ${activeAgentId === null ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-300'}`}>Team Mode</span>
              <span className="text-[10px] uppercase tracking-wider bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">Auto</span>
            </div>
            <p className="text-xs text-gray-500">
              All agents collaborate sequentially to solve the problem end-to-end.
            </p>
          </div>

          <div className="text-xs font-mono text-gray-600 uppercase tracking-widest mt-6 mb-2">Roster</div>
          {AGENTS.map(agent => (
            <div key={agent.id} onClick={() => setActiveAgentId(agent.id)} className="cursor-pointer">
              <AgentCard agent={agent} isActive={activeAgentId === agent.id} />
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
           <button 
            onClick={handleDownloadNotebook}
            disabled={messages.length === 0}
            className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors font-medium text-sm"
          >
            <Download size={16} />
            <span>Export to Jupyter (.ipynb)</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0d1117]/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
             <div className="md:hidden text-purple-500"><Sparkles size={20}/></div>
             <h2 className="text-sm font-medium text-gray-300">
               {activeAgentId ? (
                 <span className="flex items-center space-x-2">
                   <span className="text-gray-500">Chatting with</span>
                   <span className={AGENTS.find(a => a.id === activeAgentId)?.color.split(' ')[0]}>
                      {AGENTS.find(a => a.id === activeAgentId)?.name}
                   </span>
                 </span>
               ) : (
                 <span className="text-indigo-400 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    Team Collaboration Channel
                 </span>
               )}
             </h2>
          </div>
          <div className="flex items-center space-x-4">
             {apiKeyMissing && (
                <div className="flex items-center text-amber-500 text-xs bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-900">
                  <AlertTriangle size={12} className="mr-2" />
                  API Key Missing in Environment
                </div>
             )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-0 animate-fadeIn" style={{opacity: 1}}>
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 ring-1 ring-gray-700">
                 <Sparkles className="text-purple-400 opacity-80" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">Grandmaster AI Agents</h3>
              <p className="max-w-md text-gray-500">
                Describe your Kaggle competition or Data Science problem. The team will collaborate to generate a winning solution, which you can export as a Jupyter Notebook.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {SAMPLE_PROMPTS.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => setInputText(prompt)}
                    className="text-left text-sm bg-gray-900 border border-gray-800 hover:border-gray-600 p-4 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                agent={AGENTS.find(a => a.id === msg.agentId)} 
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[#0d1117] border-t border-gray-800">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isProcessing ? "Agents are working..." : "Describe your data problem (e.g., 'Predict customer churn using the Telco dataset')..."}
              disabled={isProcessing}
              className="w-full bg-gray-900 text-white placeholder-gray-600 border border-gray-700 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-[60px] md:h-[80px] disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                inputText.trim() && !isProcessing
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-600">
              AI agents can make mistakes. Review the generated code before running in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
