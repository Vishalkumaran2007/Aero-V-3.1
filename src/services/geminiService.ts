import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const geminiService = {
  async processLog(input: string) {
    // ... rest of prompt ...
    const prompt = `
      You are an expert Aviation Maintenance Data Scientist.
      Convert the following technician input into a structured aircraft maintenance log.
      
      INPUT: "${input}"
      
      REQUIRED JSON FORMAT:
      {
        "aircraft_id": "Extract tail number (e.g. N123AB), use 'UNKNOWN' if missing",
        "ata_chapter": "Infer the 2-digit ATA chapter number (e.g. 24 for Electrical, 32 for Landing Gear)",
        "component": "The specific part involved (e.g. Starter Generator, Main Tire)",
        "issue": "Concise description of the problem",
        "action": "What was done to fix it (e.g. Replaced, Inspected, Rigged)",
        "compliance_status": "Determine if enough info is present to be 'valid' or if it is 'pending'"
      }
      
      Respond ONLY with the JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini Error:", error);
      toast.error('AI Synthesis Failed', { 
        description: 'The intelligence engine could not process your input. Please check your data and try again.' 
      });
      throw error;
    }
  }
};
