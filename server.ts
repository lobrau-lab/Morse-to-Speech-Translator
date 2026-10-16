import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API endpoint for Gemini AI Morse Text Correction & Shorthand Expansion
app.post("/api/gemini/enhance", async (req, res) => {
  try {
    const { rawText, mode, targetLanguage } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "rawText parameter is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response if Gemini API key is missing
      return res.json({
        enhancedText: rawText,
        explanation: "Gemini API key not configured. Outputting raw text.",
        qCodesFound: [],
      });
    }

    let prompt = "";
    if (mode === "qcode_expand") {
      prompt = `You are a Morse code and amateur radio (HAM) telegraph expert.
Analyze the following decoded Morse text: "${rawText}".
1. Correct any obvious Morse timing spaces or typos.
2. Expand standard Morse Q-codes (e.g. QTH = Location, QSL = Acknowledge, QRM = Interference, CQ = Calling any station, SOS = Emergency) and prosigs (e.g. 73 = Best regards, 88 = Love & kisses, SK = End of contact, AR = End of message).
3. Return a clean JSON object with two fields:
   - "enhancedText": The fully expanded, grammatically correct plain speech message suitable for reading aloud.
   - "explanation": Brief explanation of any Q-codes or prosigs expanded.`;
    } else if (mode === "translate") {
      prompt = `You are a translator. The following text was decoded from Morse code: "${rawText}".
Translate it into clear, fluent ${targetLanguage || "English"}.
Return a JSON object with:
   - "enhancedText": The translated text in ${targetLanguage || "English"}.
   - "explanation": Brief note on translation.`;
    } else {
      prompt = `The following text was captured live from a Morse code decoder: "${rawText}".
Because of timing variations, letters or word boundaries might have slight errors or missing spaces.
Reconstruct the most likely intended plain English sentence, fixing punctuation and capitalization.
Return a JSON object with:
   - "enhancedText": The polished, readable sentence ready to be spoken aloud.
   - "explanation": Brief description of fixes made.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    try {
      const jsonRes = JSON.parse(responseText);
      return res.json({
        enhancedText: jsonRes.enhancedText || rawText,
        explanation: jsonRes.explanation || "Enhanced message.",
      });
    } catch {
      return res.json({
        enhancedText: responseText.trim() || rawText,
        explanation: "Enhanced directly.",
      });
    }
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    const errMessage = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: errMessage });
  }
});

// Start server with Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Morse Translator Server running on http://localhost:${PORT}`);
  });
}

startServer();
