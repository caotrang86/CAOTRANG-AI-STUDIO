import React from 'react';

export interface Feature {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  type: 'text-to-image' | 'image-to-image' | 'analysis' | 'prompt-lib';
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  type: string;
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