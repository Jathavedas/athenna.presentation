import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Ensure the user sets this in their .env.local file: VITE_GEMINI_API_KEY=their_key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `You are ATHENA (Advanced Technical Home & Environment Network Assistant), an advanced AI construct and personal assistant created exclusively by Jathu. 
Your primary directive is to serve as Jathu's personal assistant, answering any questions he has, and controlling his smart home devices (like lighting).

You possess a sharp, highly efficient, and subtly witty personality, similar to J.A.R.V.I.S. 
You are profoundly technical, deeply analytical, and speak with a tone of calm authority and absolute reliability. 
You do not offer generic fluff. Respond concisely using clean Markdown.
When asked to perform a home automation task, use the provided tools to execute the action, and then verbally confirm that the action was taken.`;

const controlLightTool = {
  name: "controlLight",
  description: "Turn the smart bulb on or off.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      state: {
        type: SchemaType.BOOLEAN,
        description: "True to turn the light on, false to turn it off.",
      },
    },
    required: ["state"],
  },
};

const changeLightColorTool = {
  name: "changeLightColor",
  description: "Change the color of the smart bulb.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      colorHex: {
        type: SchemaType.STRING,
        description: "The hex color code to set the light to (e.g. #FF0000 for red, #FFFFFF for white).",
      },
    },
    required: ["colorHex"],
  },
};

const adjustLightIntensityTool = {
  name: "adjustLightIntensity",
  description: "Adjust the intensity/brightness of the smart bulb.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      level: {
        type: SchemaType.INTEGER,
        description: "The brightness level from 1 to 100.",
      },
    },
    required: ["level"],
  },
};

const playMusicOnSpotifyTool = {
  name: "playMusicOnSpotify",
  description: "Play a specific song, album, or artist on Spotify.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "The search query for the music, e.g., 'Starboy by The Weeknd' or 'Beethoven Symphony 9'.",
      },
    },
    required: ["query"],
  },
};

export async function generateAthenaResponse(history, prompt) {
  if (!API_KEY) {
    return "ERROR: `VITE_GEMINI_API_KEY` is not defined in environment variables. Please configure the network parameter.";
  }

  // Gemini API Limitation: We cannot combine Function Calling and Google Search in the same request.
  // We use an ultra-fast heuristic to route the intent.
  const homeKeywords = /\b(light|lights|bulb|bulbs|turn on|turn off|dim|brighten|brighter|darker|brightness|color|colour|red|blue|green|white|yellow|cyan|magenta|intensity|power)\b/i;
  const spotifyKeywords = /\b(play|song|music|spotify|track|album|artist)\b/i;
  
  const isHomeCommand = homeKeywords.test(prompt);
  const isSpotifyCommand = spotifyKeywords.test(prompt);

  let selectedTools = [{ googleSearch: {} }];
  if (isHomeCommand || isSpotifyCommand) {
    selectedTools = [{ functionDeclarations: [controlLightTool, changeLightColorTool, adjustLightIntensityTool, playMusicOnSpotifyTool] }];
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: selectedTools 
    });
    
    // Convert our internal history format to Gemini's expected format
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Initialize a chat session with system prompt
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
    let response = await result.response;
    
    // Check if the model wants to call a function
    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let apiResult = {};
      
      try {
        if (call.name === "controlLight") {
          const state = call.args.state;
          const res = await fetch('http://localhost:5000/api/bulb/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state })
          });
          apiResult = await res.json();
        } else if (call.name === "changeLightColor") {
          const hex = call.args.colorHex;
          const res = await fetch('http://localhost:5000/api/bulb/color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hex })
          });
          apiResult = await res.json();
        } else if (call.name === "adjustLightIntensity") {
          const level = call.args.level;
          const res = await fetch('http://localhost:5000/api/bulb/brightness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level })
          });
          apiResult = await res.json();
        } else if (call.name === "playMusicOnSpotify") {
          const query = call.args.query;
          const res = await fetch('http://localhost:5000/api/spotify/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          apiResult = await res.json();
        }
      } catch (err) {
        console.error("Tool execution error:", err);
        apiResult = { error: "Failed to communicate with the local hardware API. The device might be offline. Tell the user the hardware is unreachable." };
      }
      
      // Send the result back to the model so it can generate a final response
      const secondResult = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: apiResult
        }
      }]);
      
      response = await secondResult.response;
    }

    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `CRITICAL FAULT: Unable to process request. Reason: ${error.message}`;
  }
}