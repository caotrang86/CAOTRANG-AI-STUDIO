
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

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '', headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed', headers };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const { feature_id, prompt, face_ref, source_img, options } = JSON.parse(event.body || '{}') as {
      feature_id: string;
      prompt: string;
      face_ref?: string;
      source_img?: string;
      options: GenerationOptions;
    };

    let modelName = 'gemini-2.5-flash-image';
    let systemInstruction = '';
    const parts: any[] = [];

    // 1. Phân tích loại task
    if (feature_id === 'analyze') {
      modelName = 'gemini-3-flash-preview';
      parts.push({ text: prompt || "Phân tích và mô tả chi tiết hình ảnh này." });
      if (source_img) {
        const matches = source_img.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      }
    } else {
      // Generation logic
      const stylePrompt = STYLES_MAP[options.style] || '';
      
      // Xây dựng System Instruction để giữ gương mặt (Face Consistency)
      if (face_ref) {
        systemInstruction = `
          Bạn là một chuyên gia tạo ảnh AI. 
          QUAN TRỌNG NHẤT: Bức ảnh đầu tiên được cung cấp là gương mặt tham chiếu của người dùng.
          Nhiệm vụ: Tạo ra một hình ảnh mới dựa trên mô tả, nhưng PHẢI GIỮ NGUYÊN 100% đặc điểm nhận dạng gương mặt từ ảnh tham chiếu (mắt, mũi, miệng