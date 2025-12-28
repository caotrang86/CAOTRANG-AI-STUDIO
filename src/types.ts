
import React from 'react';

export type FeatureType = 'text-to-image' | 'image-to-image' | 'analysis' | 'prompt-lib' | 'face-consistency';

export interface Feature {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  type: FeatureType;
  requiresFaceRef?: boolean; // Yêu cầu ảnh tham chiếu mặt
}

export interface GenerationOptions {
  aspectRatio: '1:1' | '9:16' | '16:9' | '3:4' | '4:3';
  resolution: '512x512' | '768x768' | '1024x1024';
  style: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  type: string;
  originalUrl?: string; // Để so sánh trước/sau
}

export interface ApiResponse {
  success: boolean;
  data?: {
    image_url?: string;
    image_base64?: string;
    analysis_text?: string;
    request_id: string;
  };
  error?: string;
}

export interface PromptSample {
  id: string;
  category: string;
  title: string;
  content: string;
}
