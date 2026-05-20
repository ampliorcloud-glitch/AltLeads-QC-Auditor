import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parsing with a large limit for base64 audio data
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // API endpoint for auditing recordings via Gemini API
  app.post("/api/gemini/audit", async (req, res) => {
    try {
      const { data, mimeType, apiKey: clientApiKey, model: clientModel } = req.body;

      if (!data || !mimeType) {
        return res.status(400).json({ error: "Missing required parameters: data and mimeType are required." });
      }

      let apiKey = clientApiKey && typeof clientApiKey === 'string' && clientApiKey.trim() ? clientApiKey.trim() : null;
      
      if (!apiKey) {
        try {
          const configPath = path.join(process.cwd(), "firebase-applet-config.json");
          if (fs.existsSync(configPath)) {
            const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
            const { initializeApp: serverInitApp } = await import("firebase/app");
            const { getFirestore: serverGetFirestore, doc: serverDoc, getDoc: serverGetDoc } = await import("firebase/firestore");
            
            const appInstance = serverInitApp(firebaseConfig);
            const firestoredb = serverGetFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
            
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error("Firestore lookup timed out")), 2000)
            );
            
            const getDocWithTimeout = async () => {
              return await serverGetDoc(serverDoc(firestoredb, "settings", "workspace"));
            };
            
            const settingsSnap = await Promise.race([getDocWithTimeout(), timeoutPromise]) as any;
            
            if (settingsSnap && settingsSnap.exists()) {
              const settingsData = settingsSnap.data();
              if (settingsData && settingsData.geminiApiKey && settingsData.geminiApiKey.trim()) {
                apiKey = settingsData.geminiApiKey.trim();
                console.log("Found shared custom Gemini API Key in workspace settings document. Utilizing for call audit.");
              }
            }
          }
        } catch (dbError) {
          console.warn("Could not query settings workspace document for custom API key. Defaulting to server env keys.", dbError);
        }
      }

      if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      }

      if (!apiKey) {
        console.error("No valid Gemini API key found (neither custom Settings key nor server environment variable).");
        return res.status(500).json({ 
          error: "API key is missing. Please define your custom Gemini Key in Settings, or add GEMINI_API_KEY as a workspace secret." 
        });
      }

      let chosenModel = clientModel && typeof clientModel === 'string' && clientModel.trim() ? clientModel.trim() : 'gemini-3.5-flash';
      console.log(`Instructing Gemini to analyze call with model: ${chosenModel}, mimeType: ${mimeType}`);

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: chosenModel,
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: `You are an expert sales manager auditing a lead generation call. 
            1. Transcribe the audio exactly, identifying two speakers: the 'Agent' and the 'Prospect'. Identify their roles based on who is greeting/selling (Agent) and who is responding (Prospect).
            2. Score the agent's performance from 1 to 10 on: greeting, discovery, valueProp, objectionHandling, and closing.
            3. Provide an executive summary written from the Agent's (caller's) perspective. It must be a concise narrative detailing: who I connected with, services/trainings discussed, their interest/needs, confirmation of key probing questions asked, stated next steps, and any important information for my senior.
            4. Provide 3 actionable feedback points for improvement.
            Return the response in valid JSON format.`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING, enum: ['Agent', 'Prospect'] },
                    text: { type: Type.STRING }
                  },
                  required: ['speaker', 'text']
                }
              },
              scores: {
                type: Type.OBJECT,
                properties: {
                  greeting: { type: Type.NUMBER },
                  discovery: { type: Type.NUMBER },
                  valueProp: { type: Type.NUMBER },
                  objectionHandling: { type: Type.NUMBER },
                  closing: { type: Type.NUMBER }
                },
                required: ['greeting', 'discovery', 'valueProp', 'objectionHandling', 'closing']
              },
              summary: { type: Type.STRING },
              feedback: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['transcript', 'scores', 'summary', 'feedback']
          }
        }
      });

      if (!response.text) {
        throw new Error("Gemini returned an empty response.");
      }

      const result = JSON.parse(response.text.trim());
      return res.json(result);

    } catch (error: any) {
      console.error("Gemini API call or parsing failed:", error);
      try {
        fs.writeFileSync(path.join(process.cwd(), "api_error.log"), `${new Date().toISOString()} - ${error.stack || error.message || error}\n`, "utf8");
      } catch (err) {
        console.error("Failed to write to api_error.log", err);
      }
      return res.status(500).json({ 
        error: error.message || "An unexpected error occurred while analyzing the audio file." 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite integration middleware for dev / static serving for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
