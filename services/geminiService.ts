import { GoogleGenAI } from "@google/genai";
import { Agent } from "../types";

// Initialize the client.
// Note: In a real production app, ensure API_KEY is set in environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAgentResponse = async (
  agent: Agent,
  history: { role: string; content: string }[],
  userMessage: string
): Promise<string> => {
  try {
    const modelId = 'gemini-3-pro-preview'; // Using the recommended model for complex tasks
    
    // Construct the full prompt context
    // We treat the "history" as the context of the team meeting so far.
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Create a new chat session for this interaction to maintain context but enforce the persona
    // The "systemInstruction" is crucial for the agent to stay in character.
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: agent.systemPrompt,
        temperature: 0.7, // Balance between creativity and precision
      },
      history: chatHistory
    });

    const response = await chat.sendMessage({ message: userMessage });
    
    if (response.text) {
      return response.text;
    }
    
    return "I'm deep in thought but couldn't articulate a response. Please check the data feed.";
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `**System Error**: ${agent.name} encountered a connection issue. Please check your API Key or try again.`;
  }
};
