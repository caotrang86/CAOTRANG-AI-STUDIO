import { GoogleGenAI } from "@google/genai";

interface HandlerEvent {
  body: string;
  httpMethod: string;
}

interface HandlerResponse {
  statusCode: number;
  body: string;
  headers?: { [key: string]: string };
}

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '', headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      headers
    };
  }

  try {
    // Initialize GoogleGenAI with process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const { feature_id, prompt, image_base64 } = JSON.parse(event.body || '{}');

    // Determine model and task based on feature_id
    // Analysis (image-to-text) uses gemini-3-flash-preview
    // Image Generation/Editing uses gemini-2.5-flash-image
    let model = 'gemini-2.5-flash-image';
    let isAnalysis = false;

    if (feature_id === 'analyze') {
      model = 'gemini-3-flash-preview';
      isAnalysis = true;
    }

    // Construct contents
    const parts: any[] = [];

    // Handle image input (Data URL from frontend)
    if (image_base64) {
       const matches = image_base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
       if (matches) {
         parts.push({
           inlineData: {
             mimeType: matches[1],
             data: matches[2]
           }
         });
       }
    }

    // Handle text prompt
    if (prompt) {
      parts.push({ text: prompt });
    } else if (isAnalysis && parts.length > 0) {
      // Provide default prompt for analysis if missing
      parts.push({ text: "Describe this image in detail." });
    }

    if (parts.length === 0) {
      throw new Error("No valid input provided (prompt or image)");
    }

    // Call generateContent for both text and image tasks
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts }
    });

    // Process Response
    let responseData: any = {};

    if (isAnalysis) {
       // Text response for analysis
       responseData = {
         analysis_text: response.text
       };
    } else {
       // Image response for generation/editing
       // Iterate through parts to find the image part
       let imageUrl = null;
       const candidates = response.candidates;
       if (candidates) {
         for (const candidate of candidates) {
           if (candidate.content && candidate.content.parts) {
             for (const part of candidate.content.parts) {
               if (part.inlineData) {
                 // Convert inlineData back to Data URL for frontend
                 imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                 break;
               }
             }
           }
           if (imageUrl) break;
         }
       }
       
       if (!imageUrl) {
          // If no image generated, return text as error message or fallback
          throw new Error(response.text || "Failed to generate image.");
       }
       
       responseData = {
         image_url: imageUrl
       };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          request_id: Date.now().toString(),
          ...responseData
        }
      }),
      headers
    };

  } catch (error: any) {
    console.error("Backend Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error"
      }),
      headers
    };
  }
};