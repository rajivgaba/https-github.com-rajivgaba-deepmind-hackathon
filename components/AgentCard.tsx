import React from 'react';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, isActive }) => {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${isActive ? 'bg-gray-800 border-gray-600 shadow-lg scale-105' : 'bg-gray-900 border-gray-800 opacity-70 hover:opacity-100'}`}>
      <div className="flex items-center space-x-3 mb-2">
        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${agent.color}`}>
          <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${agent.color.split(' ')[0]}`}>{agent.name}</h3>
          <p className="text-xs text-gray-400">{agent.role}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
        {agent.description}
      </p>
    </div>
  );
};

export default AgentCard;
