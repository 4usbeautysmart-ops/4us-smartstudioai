import React from 'react';

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  VISAGISMO = 'VISAGISMO',
  COLORISTA = 'COLORISTA',
  HAIRSTYLIST = 'HAIRSTYLIST',
  LOOK_CREATOR = 'LOOK_CREATOR',
  HAIR_THERAPIST = 'HAIR_THERAPIST',
  CHATBOT = 'CHATBOT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  LIBRARY = 'LIBRARY'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

export interface LibraryItem {
    id: string;
    type: 'VISAGISMO' | 'COLORISTA' | 'HAIRSTYLIST' | 'THERAPIST';
    clientName: string;
    date: string;
    thumbnail: string | null;
    brand?: string;
    reportData: any; // Stores the specific report JSON
    generatedImages?: string[] | null; // Stores multiple result images for Hairstylist 5D
}