
import { GoogleGenAI } from "@google/genai";

interface GenerationOptions {
  aspectRatio: string;
  resolution: string;
  style: string;
}

interface HandlerEvent {
  body: string;
  httpMethod: string;
}

const STYLES_MAP: Record<string, string> = {
  photorealistic: 'photorealistic, 8k, highly detailed, professional photography, raw photo, realistic textures',
  anime: 'anime style, vivid colors, expressive features, clean lines, cell shaded',
  chibi: 'chibi style, cute, small proportions, simplified details, toy-like aesthetic',
  '3d-render': '3d render, high quality, octane render, cinematic lighting, material realism',
  painting: 'artistic painting, visible brushstrokes, canvas texture, oil painting style',
  flat: 'flat illustration, minimalist, vector art, graphic design style'
};

export const handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '', headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }), headers };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ success: false, error: 'Chưa cấu hình API Key trên server.' }) 
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Parse body safely
    let bodyData;
    try {
      bodyData = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON body' }) };
    }

    const { feature_id, prompt, face_ref, source_img, options } = bodyData as {
      feature_id: string;
      prompt: string;
      face_ref?: string;
      source_img?: string;
      options: GenerationOptions;
    };

    let resultData: any = {};

    // --- CASE 1: PHÂN TÍCH ẢNH (Image Analysis) ---
    if (feature_id === 'analyze') {
      const parts: any[] = [];
      
      // Nếu có ảnh upload lên để phân tích
      if (source_img) {
        const matches = source_img.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
           parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
        }
      } else if (face_ref) {
         // Fallback nếu user up nhầm vào ô face ref
         const matches = face_ref.match(/^data:([^;]+);base64,(.+)$/);
         if (matches) {
            parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
         }
      }

      parts.push({ text: prompt ? `Phân tích chi tiết và trả lời câu hỏi sau bằng tiếng Việt: ${prompt}` : "Mô tả chi tiết nội dung hình ảnh này bằng tiếng Việt." });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: { parts },
      });
      
      resultData = { analysis_text: response.text };

    } 
    // --- CASE 2: TẠO ẢNH / EDIT ẢNH (Image Generation) ---
    else {
      const parts: any[] = [];
      let finalPrompt = prompt;
      
      // Ghép Style
      const stylePrompt = STYLES_MAP[options?.style] || '';
      if (stylePrompt) {
        finalPrompt += `, style: ${stylePrompt}`;
      }
      
      // Ghép Aspect Ratio instructions vào prompt (phòng khi config không support tốt)
      finalPrompt += `, aspect ratio ${options?.aspectRatio || '1:1'}, high resolution ${options?.resolution || '1024x1024'}`;

      // Xử lý ảnh đầu vào
      // Ưu tiên Face Ref cho các task cần giữ mặt
      if (face_ref) {
          const matches = face_ref.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
             parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
             // Thêm chỉ dẫn mạnh mẽ vào prompt để giữ mặt
             finalPrompt = `(Input Image contains the REFERENCE FACE). Task: Create a new image based on the prompt: "${finalPrompt}". CRITICAL: You MUST preserve the facial identity, facial features, and skin tone of the person in the input image exactly. Blend the face naturally into the new context/outfit.`;
          }
      } else if (source_img) {
          // Các task img2img thông thường (không nhấn mạnh giữ mặt)
          const matches = source_img.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
             parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
             finalPrompt = `(Input Image provided). Modify this image based on prompt: "${finalPrompt}".`;
          }
      }

      parts.push({ text: finalPrompt });

      // Cấu hình Image Generation
      // Model `gemini-2.5-flash-image` là lựa chọn tốt cho tốc độ và chất lượng general
      // Model `gemini-3-pro-image-preview` nếu cần chất lượng rất cao (nhưng chậm hơn)
      
      // Map aspect ratio sang format config (nếu model support)
      // Lưu ý: SDK google/genai dùng `aspectRatio` string như "1:1", "16:9"
      const imageConfig = {
         aspectRatio: options?.aspectRatio || '1:1',
      };

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            // @ts-ignore - SDK typings might lag behind param support
            imageConfig: imageConfig
          }
        });

        // Trích xuất ảnh từ response
        let imageBase64 = '';
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
           for (const part of response.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                  imageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                  break;
              }
           }
        }

        if (!imageBase64) {
             // Nếu không có ảnh, có thể model từ chối hoặc trả về text lỗi
             const textPart = response.text;
             throw new Error(textPart || "AI không trả về hình ảnh. Có thể prompt vi phạm chính sách an toàn.");
        }

        resultData = { image_base64: imageBase64 };

      } catch (genError: any) {
         console.error("GenAI Error:", genError);
         throw new Error(`Lỗi tạo ảnh: ${genError.message}`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: resultData })
    };

  } catch (error: any) {
    console.error("Handler Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || "Đã có lỗi xảy ra phía server." 
      })
    };
  }
};
