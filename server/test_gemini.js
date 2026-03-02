"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function test() {
    const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const severitySchema = {
        type: genai_1.Type.OBJECT,
        properties: {
            severity: { type: genai_1.Type.STRING },
            confidence: { type: genai_1.Type.NUMBER },
            scores: {
                type: genai_1.Type.OBJECT,
                properties: {
                    critical: { type: genai_1.Type.NUMBER },
                    high: { type: genai_1.Type.NUMBER },
                    medium: { type: genai_1.Type.NUMBER },
                    low: { type: genai_1.Type.NUMBER },
                },
                required: ["critical", "high", "medium", "low"]
            },
            features: {
                type: genai_1.Type.ARRAY,
                items: { type: genai_1.Type.STRING }
            }
        },
        required: ["severity", "confidence", "scores", "features"]
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Title: Broken Login \n Description: Cannot log in',
            config: {
                responseMimeType: 'application/json',
                responseSchema: severitySchema,
            }
        });
        console.log(response.text);
    }
    catch (err) {
        console.error("FAIL:", err);
    }
}
test();
//# sourceMappingURL=test_gemini.js.map