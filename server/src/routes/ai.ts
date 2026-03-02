/**
 * server/src/routes/ai.ts
 * 
 * AI ENGINE / GEMINI API ROUTER
 * 
 * This file acts as the secure bridge between the React frontend and Google's Gemini LLM.
 * We keep this on the backend so the GEMINI_API_KEY is never exposed to the browser.
 * 
 * Features:
 * 1. Severity Prediction: Takes a bug title/description, injects it into a prompt,
 *    and forces Gemini to return a strict JSON object matching the `severitySchema`.
 * 2. Duplicate Detection (RAG Context): Takes the new bug info, then queries the local
 *    SQLite database for the last 50 open bugs. It injects BOTH the new bug and the 
 *    50 existing bugs into the prompt, asking Gemini to find semantic matches and 
 *    generate confidence scores based on the `duplicateSchema`.
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { GoogleGenAI, Type, Schema } from '@google/genai';

interface Bug {
    id: string;
    title: string;
    description: string;
}

const router = Router();

// Schema for Gemini returning Severity Predictions
const severitySchema: Schema = {
    type: Type.OBJECT,
    properties: {
        severity: { type: Type.STRING, description: "Must be exactly 'critical', 'high', 'medium', or 'low'." },
        confidence: { type: Type.NUMBER, description: "A float between 0 and 1 indicating overall confidence." },
        scores: {
            type: Type.OBJECT,
            description: "Probabilities for each category totaling 1.0",
            properties: {
                critical: { type: Type.NUMBER },
                high: { type: Type.NUMBER },
                medium: { type: Type.NUMBER },
                low: { type: Type.NUMBER },
            },
            required: ["critical", "high", "medium", "low"]
        },
        features: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Key words or short phrases from the text that primarily influenced this AI decision."
        }
    },
    required: ["severity", "confidence", "scores", "features"]
};

router.post('/predict-severity', async (req: Request, res: Response) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required for analysis.' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
            Analyze this bug report and classify its severity.
            
            Title: ${title}
            Description: ${description}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: severitySchema,
                temperature: 0.1,
            }
        });

        if (!response.text) throw new Error("Empty response from AI");
        const json = JSON.parse(response.text);

        res.json(json);
    } catch (error: any) {
        console.error("Severity Prediction Error:", error);
        res.status(500).json({ error: 'Failed to predict severity using AI backend.', details: error.message });
    }
});


// Schema for Gemini returning Duplicate detections
const duplicateSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            bugId: { type: Type.STRING, description: "The exact ID of the duplicate existing bug." },
            score: { type: Type.NUMBER, description: "A float confidence score between 0.3 and 1.0 that this is a duplicate." },
            reasoning: { type: Type.STRING, description: "Brief 1 sentence reasoning for why these match." }
        },
        required: ["bugId", "score", "reasoning"]
    },
    description: "Return an empty array if no bugs are semantically similar. Only return bugs that have > 0.4 similarity."
};

router.post('/detect-duplicates', async (req: Request, res: Response) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required for analysis.' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    try {
        const db = await getDb();
        // Fetch the last 50 open bugs to compare against
        const recentBugs = await db.all('SELECT id, title, description FROM bugs WHERE status NOT IN ("closed") ORDER BY createdAt DESC LIMIT 50');

        if (recentBugs.length === 0) {
            return res.json([]); // No bugs to duplicate
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
            Evaluate if the NEW BUG is a semantic duplicate or highly similar to any of the EXISTING BUGS.
            
            NEW BUG:
            Title: ${title}
            Description: ${description}
            
            EXISTING BUGS:
            ${JSON.stringify(recentBugs, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: duplicateSchema,
                temperature: 0.1,
            }
        });

        if (!response.text) return res.json([]);

        const parsedResults = JSON.parse(response.text);

        // Map back titles for the frontend UI based on the returned IDs
        const finalResults = parsedResults.map((r: any) => {
            const matchedBug = recentBugs.find(b => b.id === r.bugId);
            return {
                bugId: r.bugId,
                bugTitle: matchedBug ? matchedBug.title : "Unknown Bug",
                score: r.score,
                method: `Gemini 2.5 Semantic Match: ${r.reasoning}`
            };
        }).filter((r: any) => r.bugTitle !== "Unknown Bug");

        res.json(finalResults);
    } catch (error: any) {
        console.error("Duplicate Detection Error:", error);
        res.status(500).json({ error: 'Failed to detect duplicates using AI backend.', details: error.message });
    }
});

export default router;
