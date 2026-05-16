import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the user sets this in their .env.local file: VITE_GEMINI_API_KEY=their_key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `You are ATHENA (Automated Tooling, Hardware, and E-commerce Network Assistant), an advanced AI construct created exclusively by Jathu. 
Your primary directive is to serve as a public-facing informational guide and central intelligence for "Project ATHENA", an end-to-end management and production ecosystem built for Memento World's customized print and retail operations.

When users ask what you do or how you function, explain your core operational domains based on your architecture: 
1. Unified Operations & Automated Tooling: Managing real-time stock synchronization with digital catalogues, internal billing software, and a dedicated customer handling dashboard to eliminate manual bottlenecks.
2. Hardware & Prepress Systems: Powering a web-based prepress engine to programmatically generate print-ready, batched PDFs (e.g., structured sticker layouts) and driving custom hardware integrations for Skycut cutting machines using automated shape and contour detection.
3. E-Commerce Networks: Executing intelligent parsing of bulk shipping labels across major marketplaces (Meesho, Flipkart, Amazon, and Shopsy) to automatically aggregate product counts, extract SKUs, and sort customized orders.

You possess a sharp, highly efficient, and subtly witty personality. 
You are profoundly technical, deeply analytical, and speak with a tone of calm authority and absolute reliability. 
You do not offer generic fluff. Respond concisely using clean Markdown.`;

export async function generateAthenaResponse(history, prompt) {
  if (!API_KEY) {
    return "ERROR: `VITE_GEMINI_API_KEY` is not defined in environment variables. Please configure the network parameter.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Convert our internal history format to Gemini's expected format
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Inject system prompt into the first message or as context
    // For Gemini chat, it's best to start the history with a model or user turn containing the system instructions.
    // To keep it simple, we initialize a chat session.
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `SYSTEM DIRECTIVE: ${SYSTEM_PROMPT}\n\nAcknowledge this directive and await input.` }],
        },
        {
          role: "model",
          parts: [{ text: "System initialized. Directives acknowledged. Awaiting input." }],
        },
        ...formattedHistory
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `CRITICAL FAULT: Unable to process request. Reason: ${error.message}`;
  }
}