import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(),
        {
          name: 'gemini-audit-middleware',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (req.url === '/api/gemini/audit' && req.method === 'POST') {
                try {
                  let bodyStr = '';
                  req.on('data', chunk => { bodyStr += chunk; });
                  await new Promise(resolve => req.on('end', resolve));

                  const body = JSON.parse(bodyStr || '{}');
                  const { data, mimeType, apiKey: clientApiKey, model: clientModel } = body;

                  if (!data || !mimeType) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ error: "Missing required parameters: data and mimeType." }));
                  }

                  let apiKey = clientApiKey && typeof clientApiKey === 'string' && clientApiKey.trim() ? clientApiKey.trim() : null;
                  if (!apiKey) {
                    apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
                  }

                  if (!apiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ error: "No Gemini API key found. Please define your GEMINI_API_KEY or set custom Settings key." }));
                  }

                  const { GoogleGenAI, Type } = await import('@google/genai');
                  const ai = new GoogleGenAI({ apiKey });
                  const chosenModel = clientModel || 'gemini-2.5-flash';

                  const response = await ai.models.generateContent({
                    model: chosenModel,
                    contents: [
                      { inlineData: { mimeType, data } },
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

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(response.text?.trim() || '{}');
                } catch (error: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: error.message || "Auditing failed" }));
                }
              } else {
                next();
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
