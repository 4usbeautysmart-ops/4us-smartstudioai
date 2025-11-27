import React, { useState } from 'react';
import { fileToGenerativePart, generateVeoVideo } from '../services/geminiService';

export const VeoLook: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToGenerativePart(file);
      setImage(`data:${file.type};base64,${base64}`);
      setVideoUrl(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setProgress('Inicializando Veo-3...');
    
    try {
      let result;
      if (image) {
          setProgress('Enviando referência e Gerando...');
          const base64Data = image.split(',')[1];
          const mimeType = image.split(':')[1].split(';')[0];
          result = await generateVeoVideo(prompt, base64Data, mimeType);
      } else {
          setProgress('Gerando a partir do texto...');
          result = await generateVeoVideo(prompt);
      }
      setVideoUrl(result);
    } catch (error) {
      console.error(error);
      alert("A geração de vídeo falhou. Por favor, tente novamente.");
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Veo Motion Look</h2>
            <p className="text-gray-400 mt-2">Crie vídeos de revelação cinematográficos dos seus estilos usando Veo 3.1</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 flex-1">
            <div className="space-y-6">
                 <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">1. Imagem de Referência (Opcional)</h3>
                    <div className="relative h-48 bg-black/30 rounded-xl border-2 border-dashed border-gray-700 hover:border-neon-cyan transition-colors flex items-center justify-center cursor-pointer overflow-hidden">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {image ? (
                            <img src={image} alt="Reference" className="h-full w-full object-cover" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span>Enviar quadro inicial</span>
                            </div>
                        )}
                    </div>
                 </div>

                 <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">2. Prompt de Movimento</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Descreva o movimento do vídeo (ex: 'Panorâmica lenta ao redor da modelo mostrando a textura do cabelo, iluminação de estúdio, 4k')"
                        className="w-full h-32 bg-studio-bg border border-gray-700 rounded-xl p-4 text-white focus:border-neon-purple outline-none resize-none"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className={`w-full mt-4 py-4 rounded-xl font-bold uppercase tracking-widest transition-all
                            ${loading || !prompt
                                ? 'bg-gray-800 text-gray-600'
                                : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-[0_0_20px_rgba(189,0,255,0.5)]'
                            }`}
                    >
                        {loading ? 'Renderizando...' : 'Gerar Vídeo'}
                    </button>
                 </div>
            </div>

            <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent shadow-lg flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4">Saída</h3>
                <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-800">
                    {loading && (
                        <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-neon-purple animate-pulse">{progress}</p>
                            <p className="text-gray-500 text-sm mt-2">Isso pode levar um ou dois minutos.</p>
                        </div>
                    )}
                    
                    {videoUrl ? (
                        <video 
                            src={videoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            className="max-h-full max-w-full"
                        />
                    ) : (
                        <div className="text-center p-8 opacity-30">
                            <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            <p>O vídeo gerado tocará aqui</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};