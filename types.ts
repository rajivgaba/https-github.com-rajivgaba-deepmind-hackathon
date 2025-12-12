export enum AgentRole {
  LEAD = 'Lead Strategist',
  EDA = 'Data Detective',
  FEATURE = 'Feature Smith',
  MODEL = 'Model Architect',
  CRITIC = 'Code Optimizer'
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  color: string;
  description: string;
  systemPrompt: string;
}

export interface Message {
  id: string;
  agentId: string; // 'user' or agent.id
  content: string; // Markdown content
  timestamp: number;
  isThinking?: boolean;
}

export interface NotebookCell {
  cell_type: 'markdown' | 'code';
  metadata: Record<string, unknown>;
  source: string[];
  execution_count: number | null;
  outputs: string[];
}

export interface JupyterNotebook {
  cells: NotebookCell[];
  metadata: {
    kernelspec: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info: {
      codemirror_mode: {
        name: string;
        version: number;
      };
      file_extension: string;
      mimetype: string;
      name: string;
      nbconvert_exporter: string;
      pygments_lexer: string;
      version: string;
    };
  };
  nbformat: number;
  nbformat_minor: number;
}
