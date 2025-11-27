import React, { useState, useRef } from 'react';
import { fileToGenerativePart, createLookGenerationPrompt, generateLookImage } from '../services/geminiService';
import { addWatermark } from '../utils/imageUtils';

export const LookCreator: React.FC = () => {
    const [clientImage, setClientImage] = useState<string | null>(null);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
        const saved = localStorage.getItem('lookcreator_camera_mode');
        return (saved === 'user' || saved === 'environment') ? saved : 'user';
    });
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    const handleClientUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToGenerativePart(file);
            setClientImage(`data:${file.type};base64,${base64}`);
            setGeneratedImage(null);
        }
    };

    const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToGenerativePart(file);
            setRefImage(`data:${file.type};base64,${base64}`);
        }
    };

    const handleResetClient = () => {
        setClientImage(null);
        setGeneratedImage(null);
    };

    // Camera Functions
    const startCamera = async (mode: 'user' | 'environment') => {
        setFacingMode(mode);
        localStorage.setItem('lookcreator_camera_mode', mode);
        setIsCameraOpen(true);
        
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Não foi possível acessar a câmera. Verifique as permissões.");
                setIsCameraOpen(false);
            }
        }, 100);
    };

    const handleSwitchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        startCamera(newMode);
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setClientImage(dataUrl);
                setGeneratedImage(null);
                stopCamera();
            }
        }
    };

    const handleGenerate = async () => {
        if (!clientImage || (!prompt && !refImage)) {
            alert("Por favor, envie a foto do cliente e um prompt ou imagem de referência.");
            return;
        }
        setLoading(true);
        setGeneratedImage(null);
        try {
            const clientBase64 = clientImage.split(',')[1];
            const clientMime = clientImage.split(':')[1].split(';')[0];
            const refBase64 = refImage ? refImage.split(',')[1] : undefined;
            const refMime = refImage ? refImage.split(':')[1].split(';')[0] : undefined;

            setLoadingStep("Analisando rosto e criando prompt técnico...");
            const technicalPrompt = await createLookGenerationPrompt(clientBase64, clientMime, prompt, refBase64, refMime);
            
            setLoadingStep("Gerando imagem do look...");
            const finalImageRaw = await generateLookImage(technicalPrompt || "", clientBase64, clientMime);
            const finalImage = await addWatermark(finalImageRaw);
            
            setGeneratedImage(finalImage);

        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao gerar o look.");
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = '4us_look_criado.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShareImage = async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const file = new File([blob], '4us_look_criado.png', { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Meu Look 4us! AI',
                    text: 'Confira o look incrível que criei com o 4us! Smart Studio AI!',
                });
            } else {
                handleDownloadImage();
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            alert('Não foi possível compartilhar a imagem. O download será iniciado.');
            handleDownloadImage();
        }
    };


    return (
        <div className="max-w-7xl mx-auto h-full grid lg:grid-cols-2 gap-8">
            {/* Left Column: Inputs */}
            <div className="space-y-6">
                <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg">
                    <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neon-violet to-purple-400">Criador de Look</h2>
                    <p className="text-gray-400 mb-6">Gere um look completo de corpo inteiro a partir de uma foto do rosto, uma referência ou uma ideia.</p>

                    {/* Step 1: Client Photo */}
                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-bold text-gray-400 block">1. Foto do Rosto</label>
                        <div className="relative group h-48 border-2 border-dashed border-gray-600 rounded-xl p-2 text-center hover:border-neon-violet transition-colors flex items-center justify-center bg-black/30 overflow-hidden">
                            {!clientImage && <input type="file" accept="image/*" onChange={handleClientUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />}
                            {clientImage ? (
                                <img src={clientImage} alt="Rosto do Cliente" className="max-h-full mx-auto rounded-md object-contain" />
                            ) : (
                                <span className="text-gray-500 text-sm">Clique ou arraste a foto do rosto</span>
                            )}
                        </div>
                         {!clientImage && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <button 
                                    onClick={() => startCamera('user')}
                                    className="py-2 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Selfie
                                </button>
                                <button 
                                    onClick={() => startCamera('environment')}
                                    className="py-2 rounded-lg font-bold text-gray-300 bg-studio-accent hover:border-neon-cyan hover:text-neon-cyan transition-all text-sm flex items-center justify-center gap-2"
                                >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Traseira
                                </button>
                            </div>
                        )}
                        {clientImage && (
                            <button
                                onClick={handleResetClient}
                                className="w-full mt-2 py-2 text-sm rounded-lg text-gray-400 border border-gray-700 hover:border-neon-violet hover:text-neon-violet transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Nova Foto
                            </button>
                        )}
                    </div>

                    {/* Step 2: Reference Image */}
                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-bold text-gray-400 block">2. Imagem de Referência (Opcional)</label>
                         <div className="relative group h-48 border-2 border-dashed border-gray-600 rounded-xl p-2 text-center hover:border-neon-cyan transition-colors flex items-center justify-center bg-black/30 overflow-hidden">
                            <input type="file" accept="image/*" onChange={handleRefUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            {refImage ? (
                                <img src={refImage} alt="Referência" className="max-h-full mx-auto rounded-md object-contain" />
                            ) : (
                                <span className="text-gray-500 text-sm">Clique ou arraste a inspiração</span>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 block">3. Descreva o Look</label>
                         <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: 'Um vestido de gala preto, elegante, para um evento noturno em Paris, com cabelo preso e maquiagem marcante.'"
                            className="w-full h-28 bg-studio-bg border border-gray-700 rounded-lg px-4 py-3 focus:border-neon-purple outline-none resize-none"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !clientImage}
                        className="w-full mt-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-violet to-neon-purple text-white hover:shadow-[0_0_20px_rgba(138,43,226,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Criando Mágica...' : 'Gerar Look Completo'}
                    </button>
                </div>
            </div>

            {/* Right Column: Output */}
            <div className="bg-studio-card rounded-2xl border border-studio-accent/50 shadow-lg flex flex-col p-6 h-[80vh]">
                 <h3 className="text-xl font-bold mb-4 text-neon-cyan">Visual Gerado</h3>
                 <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-800">
                    {loading && (
                        <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
                            <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-neon-cyan animate-pulse">{loadingStep}</p>
                            <p className="text-gray-500 text-sm mt-2">Aguarde, isso pode levar alguns instantes.</p>
                        </div>
                    )}

                    {generatedImage ? (
                        <>
                            <img 
                                src={generatedImage}
                                alt="Look Gerado"
                                className="h-full w-full object-contain animate-in fade-in duration-500"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <button
                                    onClick={handleDownloadImage}
                                    className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors border border-white/20"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Salvar
                                </button>
                                <button
                                    onClick={handleShareImage}
                                    className="flex items-center gap-2 px-4 py-2 bg-neon-violet text-white rounded-full hover:opacity-90 transition-opacity font-bold"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                    Compartilhar
                                </button>
                            </div>
                        </>
                    ) : (
                         <div className="text-center p-8 opacity-30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> </svg>
                            <p>A imagem do seu look aparecerá aqui.</p>
                        </div>
                    )}
                 </div>
            </div>

             {/* Camera Modal Overlay */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                    <video ref={videoRef} className="max-w-full max-h-[80vh] rounded-lg" autoPlay playsInline muted></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    {/* Camera Controls */}
                    <div className="absolute top-4 left-4">
                        <button 
                            onClick={handleSwitchCamera} 
                            className="p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                            title="Virar Câmera"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-black/50 ring-4 ring-white/50 hover:ring-neon-violet transition-all"></button>
                        <button onClick={stopCamera} className="absolute bottom-10 right-10 px-4 py-2 bg-gray-800/50 text-white rounded-full text-sm">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};