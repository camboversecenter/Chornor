import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Coach
  app.post("/api/coach/analyze", async (req, res) => {
    try {
      const { profile, workouts, promptMode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      // Initialize GoogleGenAI SDK safely
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let contentPrompt = "";
      if (promptMode === 'chat') {
        const chatHistory = req.body.messages || [];
        contentPrompt = `You are "Coach Gemini", a certified personal AI athletic coach & sports scientist.
User Profile:
- Age: ${profile.age} years old (Max Estimated HR: ${220 - profile.age} bpm)
- Weight: ${profile.weight} kg
- Resting HR: ${profile.restingHR} bpm
- Gender: ${profile.gender}
- Weekly Goals: ${profile.weeklyTargetSessions} workouts, ${profile.weeklyTargetCalories} calories

Recent Exercise Logs:
${JSON.stringify(workouts, null, 2)}

Chat History so far:
${chatHistory.map((m: any) => `${m.role === 'user' ? 'Client' : 'Coach'}: ${m.content}`).join('\n')}

Latest User Message: "${req.body.message}"

Please respond as their friendly, encouraging, and science-grounded personal AI fitness trainer in a short, practical, and highly motivational paragraph (max 4 sentences). Give actionable athletic or recovery advice, and be specific about their heart rate zones (e.g. Aerobic, Threshold, Recovery) if relevant to their request.`;
      } else {
        // Dashboard automated review report
        contentPrompt = `You are a certified professional AI athletic coach & sports scientist.
Please analyze the following athlete's exercise and physiological data to provide professional insight, identifying heart rate zones, recovery suggestions, and safety concerns:

User Profile:
- Age: ${profile.age} years old (Estimated Max HR: ${220 - profile.age} bpm)
- Weight: ${profile.weight} kg
- Resting HR: ${profile.restingHR} bpm
- Gender: ${profile.gender}
- Weekly Goals: ${profile.weeklyTargetSessions} workouts/week, ${profile.weeklyTargetCalories} kcal burned/week

Recent Workouts:
${JSON.stringify(workouts, null, 2)}

Provide a structured, inspiring report formatted as a single JSON object. The structure MUST be exactly:
{
  "summary": "1-2 sentence overall athletic summary explaining their current performance trajectory.",
  "achievements": ["Achievement 1 (e.g. 'Consistent fat burn zone mastery')", "Achievement 2 (e.g. 'Strong average active heart recovery rates')"],
  "zoneAnalysis": "A 2-3 sentence analysis of their workout cardiac intensities (Rest vs Cardio vs Anaerobic) based on average/max HR.",
  "recommendations": ["Recovery / hydration recommendation", "Target performance progression rule for next week"],
  "estimatedFitnessAge": "A short sentence estimate with motivational reason (e.g., '27 (Heart rate variability suggests high active efficiency)')"
}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentPrompt,
        config: promptMode === 'chat' ? {} : {
          responseMimeType: "application/json"
        },
      });

      const responseText = response.text || "";
      res.json({ result: responseText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "An error occurred calling Gemini API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
