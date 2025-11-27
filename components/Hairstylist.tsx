import React, { useState, useRef } from 'react';
import { generateHairstylistConsultancy, editHairImage } from '../services/geminiService';
import { saveToLibrary, compressImageForStorage } from '../services/libraryService';
import { jsPDF } from "jspdf";
import { addWatermark } from '../utils/imageUtils';

interface GeneratedImages {
    front: string | null;
    side: string | null;
    back: string | null;
}

interface HairstylistReport {
    visagismAnalysis: string;
    viabilityVerdict: string;
    preparation: string[];
    toolsAndAccessories: string[];
    diagram3d: string;
    products: string[];
    techniqueStepByStep: string[];
    finalizationSecrets: string[];
    postCutCare: string[];
    prompts: {
        front: string;
        side: string;
        back: string;
    };
}

const BRANDS = ["L'Oréal Professionnel", "Wella Professionals", "Schwarzkopf Professional", "Kérastase", "Redken", "Joico", "Truss Hair", "Braé", "Keune"];

export const Hairstylist: React.FC = () => {
    const [clientImage, setClientImage] = useState<string | null>(null);
    const [refImage, setRefImage] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [brand, setBrand] = useState(BRANDS[0]);
    
    const [report, setReport] = useState<HairstylistReport | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({ front: null, side: null, back: null });
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [sharing, setSharing] = useState(false);
    
    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
        const saved = localStorage.getItem('hairstylist_camera_mode');
        return (saved === 'user' || saved === 'environment') ? saved : 'user';
    });
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (setter: React.Dispatch<React.SetStateAction<string | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleResetClient = () => {
        setClientImage(null);
        setReport(null);
        setGeneratedImages({ front: null, side: null, back: null });
    };

    const handleResetRef = () => {
        setRefImage(null);
    };

    const handleProcess = async () => {
        if (!clientImage || !clientName.trim() || (!prompt.trim() && !refImage)) {
            alert("Preencha o nome da cliente e forneça a foto da cliente e uma descrição ou foto de referência.");
            return;
        }
        setLoading(true);
        setReport(null);
        setGeneratedImages({ front: null, side: null, back: null });
        try {
            setLoadingMessage('Analisando e criando plano de corte 5D...');
            const clientBase64 = clientImage.split(',')[1];
            const clientMime = clientImage.split(':')[1].split(';')[0];
            const refBase64 = refImage ? refImage.split(',')[1] : undefined;
            const refMime = refImage ? refImage.split(':')[1].split(';')[0] : undefined;
            
            const reportData = await generateHairstylistConsultancy(clientBase64, clientMime, prompt, brand, refBase64, refMime);
            setReport(reportData);

            setLoadingMessage('Gerando simulações (Frente, Lado, Costas)...');
            if (reportData.prompts) {
                const [frontRaw, sideRaw, backRaw] = await Promise.all([
                    editHairImage(clientBase64, clientMime, reportData.prompts.front),
                    editHairImage(clientBase64, clientMime, reportData.prompts.side),
                    editHairImage(clientBase64, clientMime, reportData.prompts.back),
                ]);
                
                const [front, side, back] = await Promise.all([
                    addWatermark(frontRaw),
                    addWatermark(sideRaw),
                    addWatermark(backRaw),
                ]);

                const images = { front, side, back };
                setGeneratedImages(images);

                // Save to library in background
                try {
                    const compressedThumbnail = await compressImageForStorage(clientImage, 512);
                    const compressedGenerated = await Promise.all(Object.values(images).map(img => compressImageForStorage(img!, 1024)));
                    
                    await saveToLibrary({
                        type: 'HAIRSTYLIST',
                        clientName: clientName,
                        thumbnail: compressedThumbnail,
                        brand: brand,
                        reportData: reportData,
                        generatedImages: compressedGenerated
                    });
                } catch (saveError) {
                    console.error("Failed to compress and save to library:", saveError);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao processar plano de corte.");
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const handleShareImage = async (imageDataUrl: string | null, view: string) => {
        if (!imageDataUrl || !clientName) return;
        try {
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], `4us_hairstylist_${clientName}_${view}.png`, { type: blob.type });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Simulação de Corte para ${clientName}`,
                    text: `Veja a simulação do corte (${view}) gerada pelo 4us! Smart Studio AI.`,
                });
            } else {
                const link = document.createElement('a');
                link.href = imageDataUrl;
                link.download = `4us_hairstylist_${clientName}_${view}.png`;
                link.click();
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            alert('Falha ao compartilhar. A imagem será baixada.');
            const link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = `4us_hairstylist_${clientName}_${view}.png`;
            link.click();
        }
    };
    
    // Camera Logic
    const startCamera = async (mode: 'user' | 'environment') => {
        setFacingMode(mode);
        localStorage.setItem('hairstylist_camera_mode', mode);
        setIsCameraOpen(true);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
                if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
            } catch (err) { console.error(err); setIsCameraOpen(false); }
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
                if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setClientImage(canvas.toDataURL('image/jpeg'));
                stopCamera();
            }
        }
    };

    const generatePDFDoc = () => {
      if (!report || !clientName) return null;

      const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let cursorY = 60;

      // --- Header ---
      doc.setFontSize(24);
      doc.setTextColor('#00FFFF'); // neon.cyan
      doc.text("4us! Smart Studio AI", pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 20;
      doc.setFontSize(16);
      doc.setTextColor(100);
      doc.text(`Plano de Corte 5D: ${clientName}`, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 40;

      // Helper for sections
      const addSection = (title: string, content: string | string[], isList = false) => {
          if (cursorY > pageHeight - margin * 2) { doc.addPage(); cursorY = margin; }
          doc.setFontSize(14);
          doc.setTextColor('#00FFFF');
          doc.text(title, margin, cursorY);
          cursorY += 20;

          doc.setFontSize(10);
          doc.setTextColor(80);
          
          if (Array.isArray(content)) {
            const listContent = content.map(item => `${isList ? '• ' : ''}${item}`).join('\n');
            const lines = doc.splitTextToSize(listContent, contentWidth);
            if (cursorY + lines.length * 12 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
            doc.text(lines, margin, cursorY);
            cursorY += lines.length * 12 + 15;
          } else {
            const lines = doc.splitTextToSize(content, contentWidth);
            if (cursorY + lines.length * 12 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
            doc.text(lines, margin, cursorY);
            cursorY += lines.length * 12 + 15;
          }
      };

      // --- Images ---
      try {
        const imgSize = (contentWidth - 10) / 2;
        if (cursorY + imgSize + 30 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Antes & Depois", margin, cursorY);
        cursorY += 15;

        clientImage && doc.addImage(clientImage, 'PNG', margin, cursorY, imgSize, imgSize);
        generatedImages.front && doc.addImage(generatedImages.front, 'PNG', margin + imgSize + 10, cursorY, imgSize, imgSize);
        cursorY += imgSize + 10;
        
        if (cursorY + imgSize > pageHeight - margin) { doc.addPage(); cursorY = margin; }
        generatedImages.side && doc.addImage(generatedImages.side, 'PNG', margin, cursorY, imgSize, imgSize);
        generatedImages.back && doc.addImage(generatedImages.back, 'PNG', margin + imgSize + 10, cursorY, imgSize, imgSize);
        cursorY += imgSize + 20;

      } catch(e) { console.error("Error adding images to PDF:", e); }

      // --- Report Sections ---
      addSection("Análise Visagista", report.visagismAnalysis);
      addSection("Veredito e Viabilidade", report.viabilityVerdict);
      addSection("Preparação do Cabelo", report.preparation, true);
      addSection("Ferramentas e Acessórios", report.toolsAndAccessories.join(', '));
      addSection("Diagrama 3D (Descrição)", report.diagram3d);
      addSection("Passo a Passo Técnico", report.techniqueStepByStep.map((s, i) => `${i + 1}. ${s}`));
      addSection("Segredos de Finalização", report.finalizationSecrets, true);
      addSection("Cuidados Pós-Corte", report.postCutCare, true);
      
      return doc;
  };

    const handleSavePDF = () => { 
        const doc = generatePDFDoc(); 
        if(doc) doc.save(`plano_corte_5d_${clientName.replace(/\s+/g, '_')}.pdf`); 
    };

    const handleSharePDF = async () => {
        const doc = generatePDFDoc();
        if (!doc) return;
        setSharing(true);
        try {
            const blob = doc.output('blob');
            const file = new File([blob], `plano_corte_5d_${clientName.replace(/\s+/g, '_')}.pdf`, { type: "application/pdf" });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Plano de Corte 5D para ${clientName}`,
                    text: `Plano de Corte 5D gerado pelo 4us! Smart Studio AI.`
                });
            } else {
                doc.save(`plano_corte_5d_${clientName.replace(/\s+/g, '_')}.pdf`);
            }
        } catch (e) {
            console.error("Share error:", e);
            doc.save(`plano_corte_5d_${clientName.replace(/\s+/g, '_')}.pdf`);
        } finally {
            setSharing(false);
        }
    };


    const ReportSection: React.FC<{title: string; children: React.ReactNode;}> = ({title, children}) => (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold text-cyan-400 mb-2">{title}</h4>
            <div className="text-sm text-gray-300 space-y-2 prose prose-sm prose-invert max-w-none">
                {children}
            </div>
        </div>
    );

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg">
                    <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-purple-400">Hairstylist Visagista 5D</h2>
                    
                    <div className="space-y-4">
                        <div>
                             <label className="text-sm font-bold text-gray-400 block mb-2">Nome da Cliente</label>
                             <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-studio-bg border border-gray-700 rounded-lg p-3 text-white outline-none" placeholder="Nome Completo" />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-2">1. Foto da Cliente</label>
                            <div className="relative group h-64 border-2 border-dashed border-gray-600 rounded-xl p-4 flex justify-center items-center bg-black/30">
                                {!clientImage && <input type="file" accept="image/*" onChange={handleFileChange(setClientImage)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />}
                                {clientImage ? <img src={clientImage} className="max-h-full rounded-lg" /> : <p className="text-gray-400">Arraste ou clique</p>}
                            </div>
                            {!clientImage && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <button onClick={() => startCamera('user')} className="py-2 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg text-sm">Selfie</button>
                                    <button onClick={() => startCamera('environment')} className="py-2 rounded-lg font-bold text-gray-300 bg-studio-card border border-gray-600 text-sm">Câmera Traseira</button>
                                </div>
                            )}
                            {clientImage && <button onClick={handleResetClient} className="w-full text-center text-xs text-gray-500 hover:text-red-400 mt-2">Nova Foto Cliente</button>}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-2">2. Referência (Opcional)</label>
                            <div className="h-48 border-2 border-dashed border-gray-600 rounded-xl p-4 flex justify-center items-center bg-black/30 relative">
                                {!refImage && <input type="file" accept="image/*" onChange={handleFileChange(setRefImage)} className="absolute inset-0 w-full h-full opacity-0 z-10" />}
                                {refImage ? <img src={refImage} className="max-h-full rounded-lg" /> : <p className="text-gray-400">Enviar Referência</p>}
                            </div>
                             {refImage && <button onClick={handleResetRef} className="w-full text-center text-xs text-gray-500 hover:text-red-400 mt-2">Nova Referência</button>}
                        </div>

                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Corte Desejado (Opcional com Referência)" className="w-full h-24 bg-studio-bg border border-gray-700 rounded-lg p-3 text-white" />
                        
                        <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full bg-studio-bg border border-gray-700 rounded-lg p-3 text-white">
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <button onClick={handleProcess} disabled={!clientImage || !clientName || loading} className="w-full mt-6 py-4 rounded-xl font-bold bg-gradient-to-r from-neon-cyan to-blue-600 text-white disabled:opacity-50">
                        {loading ? loadingMessage : 'Gerar Plano de Corte 5D'}
                    </button>
                </div>
            </div>

            <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg flex flex-col h-full">
                 <h3 className="text-xl font-bold mb-4 text-neon-cyan">Resultado: {clientName}</h3>
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 {report ? (
                     <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1 relative group"><img src={clientImage!} className="w-full aspect-square object-contain bg-black/30 rounded-lg" /><p className="text-center text-xs text-gray-400">Antes</p></div>
                             
                             {(['front', 'side', 'back'] as const).map(view => (
                                 <div key={view} className="space-y-1 relative group">
                                     <div className="w-full aspect-square bg-black/30 rounded-lg flex items-center justify-center">
                                         {generatedImages[view] ? 
                                             <img src={generatedImages[view]} className="w-full h-full object-contain"/> : 
                                             <p className="text-xs animate-pulse">Gerando...</p>
                                         }
                                     </div>
                                     <p className="text-center text-xs text-gray-400">Depois ({view.charAt(0).toUpperCase() + view.slice(1)})</p>
                                      {generatedImages[view] && (
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleShareImage(generatedImages[view], view)} className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 text-xs rounded-full border border-white/20">Compartilhar</button>
                                        </div>
                                      )}
                                 </div>
                             ))}
                         </div>
                         
                        <ReportSection title="Análise Visagista">
                            <p>{report.visagismAnalysis}</p>
                        </ReportSection>
                        
                        <ReportSection title="Veredito e Viabilidade">
                            <p>{report.viabilityVerdict}</p>
                        </ReportSection>

                        <ReportSection title="Preparação do Cabelo">
                            <ul className="list-disc list-inside">
                                {report.preparation?.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </ReportSection>

                        <ReportSection title="Ferramentas e Acessórios">
                            <p>{report.toolsAndAccessories?.join(', ')}</p>
                        </ReportSection>
                        
                        <ReportSection title="Diagrama 3D (Descrição)">
                            <p>{report.diagram3d}</p>
                        </ReportSection>

                        <ReportSection title="Passo a Passo Técnico">
                            <ol className="list-decimal list-inside space-y-2">
                                {report.techniqueStepByStep?.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        </ReportSection>

                         <ReportSection title="Segredos de Finalização">
                            <ul className="list-disc list-inside">
                                {report.finalizationSecrets?.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </ReportSection>

                        <ReportSection title="Cuidados Pós-Corte">
                            <ul className="list-disc list-inside">
                                {report.postCutCare?.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </ReportSection>
                         
                         <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-700">
                             <button onClick={handleSavePDF} className="bg-studio-bg hover:bg-gray-800 text-gray-300 py-3 rounded-xl text-sm border border-gray-700">Salvar PDF</button>
                             <button onClick={handleSharePDF} disabled={sharing} className="bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 text-sm">
                                {sharing ? 'Gerando...' : 'Compartilhar PDF'}
                             </button>
                         </div>
                     </div>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-600">
                        {loading ? <p>Gerando relatório...</p> : <p>O plano de corte aparecerá aqui.</p>}
                    </div>
                 )}
                 </div>
            </div>

             {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                    <video ref={videoRef} className="max-w-full max-h-[80vh] rounded-lg" autoPlay playsInline muted></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute top-4 left-4">
                        <button onClick={handleSwitchCamera} className="p-3 bg-white/10 rounded-full text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-black/50 ring-4 ring-white/50 hover:ring-neon-violet"></button>
                        <button onClick={stopCamera} className="absolute bottom-10 right-10 px-4 py-2 bg-gray-800/50 text-white rounded-full text-sm">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};