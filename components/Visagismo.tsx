import React, { useState, useRef } from 'react';
import { fileToGenerativePart, analyzeFace, editHairImage } from '../services/geminiService';
import { saveToLibrary, compressImageForStorage } from '../services/libraryService';
import { jsPDF } from "jspdf";
import { addWatermark } from '../utils/imageUtils';

interface CutSuggestion {
    name: string;
    description: string;
    technicalPrompt: string;
    generatedImage?: string; 
}

interface AnalysisResult {
  consultancy: string;
  palette: Array<{
    hex: string;
    name: string;
  }>;
  cuts: CutSuggestion[];
}

export const Visagismo: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingCuts, setGeneratingCuts] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
      const saved = localStorage.getItem('visagismo_camera_mode');
      return (saved === 'user' || saved === 'environment') ? saved : 'user';
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysisData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !clientName.trim()) {
        alert("Por favor, insira o nome da cliente e a foto.");
        return;
    }
    setLoading(true);
    setAnalysisData(null);
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(':')[1].split(';')[0];
      
      const result = await analyzeFace(base64Data, mimeType, deepAnalysis);
      setAnalysisData(result); // Display text report immediately
      setLoading(false);

      let finalReportData = { ...result };

      if (result.cuts && result.cuts.length > 0) {
          setGeneratingCuts(true);
          const updatedCuts = [...result.cuts];
          const imagePromises = updatedCuts.map(async (cut, index) => {
              try {
                  const genImg = await editHairImage(base64Data, mimeType, cut.technicalPrompt);
                  const watermarkedImg = await addWatermark(genImg);
                  updatedCuts[index].generatedImage = watermarkedImg;
              } catch (err) {
                  console.error(`Failed to gen image for ${cut.name}`, err);
              }
          });

          await Promise.all(imagePromises);
          
          finalReportData = { ...result, cuts: updatedCuts };
          setAnalysisData(finalReportData); // Update UI with generated images
          setGeneratingCuts(false);
      }

      // Save everything compressed in the background
      try {
        const compressedThumbnail = await compressImageForStorage(image, 512); // Smaller thumbnail
        const compressedCuts = await Promise.all(
            finalReportData.cuts.map(async (cut) => {
                if (cut.generatedImage) {
                    const compressed = await compressImageForStorage(cut.generatedImage, 1024); // Larger result image
                    return { ...cut, generatedImage: compressed };
                }
                return cut;
            })
        );
        
        await saveToLibrary({
            type: 'VISAGISMO',
            clientName: clientName,
            thumbnail: compressedThumbnail,
            reportData: { ...finalReportData, cuts: compressedCuts }
        });
      } catch (saveError) {
        console.error("Failed to compress and save to library:", saveError);
        // Do not alert, UI already updated.
      }


    } catch (error) {
      console.error(error);
      alert("Erro ao analisar o rosto. Por favor, tente novamente.");
      setLoading(false);
      setGeneratingCuts(false);
    }
  };

  const handleCloseResult = () => {
    setAnalysisData(null);
  };

  const handleReset = () => {
    setImage(null);
    setAnalysisData(null);
    setSharing(false);
    setGeneratingCuts(false);
    setClientName('');
  };

  // Camera Logic (Reusing existing)
  const startCamera = async (mode: 'user' | 'environment') => {
    setFacingMode(mode);
    localStorage.setItem('visagismo_camera_mode', mode);
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
            setImage(canvas.toDataURL('image/jpeg'));
            setAnalysisData(null);
            stopCamera();
        }
    }
  };

  const generatePDFDoc = () => {
    if (!analysisData || !clientName) return null;

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = 60;

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor('#8A2BE2'); // neon.violet
    doc.text("4us! Smart Studio AI", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 20;

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(`Consultoria de Visagismo: ${clientName}`, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 40;

    // Helper to add a section title and manage page breaks
    const addSection = (title: string) => {
        if (cursorY + 30 > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
        doc.setFontSize(14);
        doc.setTextColor('#8A2BE2');
        doc.text(title, margin, cursorY);
        cursorY += 20;
    };
    
    // --- Consultancy Text ---
    addSection("Análise e Consultoria");
    doc.setFontSize(10);
    doc.setTextColor(80);
    const consultancyLines = doc.splitTextToSize(analysisData.consultancy, contentWidth);
    
    // Check for page break before adding text
    if (cursorY + (consultancyLines.length * 12) > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
    }
    doc.text(consultancyLines, margin, cursorY);
    cursorY += consultancyLines.length * 12 + 30; // Add space after text

    // --- Color Palette ---
    addSection("Paleta de Cores Recomendada");
    const palette = analysisData.palette || [];
    const circleRadius = 15;
    const circleDiameter = circleRadius * 2;
    const gap = 15;
    const itemsPerRow = 5;
    const rowWidth = itemsPerRow * circleDiameter + (itemsPerRow - 1) * gap;
    let startX = (pageWidth - rowWidth) / 2;
    let currentX = startX;

    palette.forEach((color, index) => {
        if (index > 0 && index % itemsPerRow === 0) {
            cursorY += circleDiameter + 30; // Move to next row
            currentX = startX;
        }
        
        if (cursorY + circleDiameter + 30 > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
            addSection("Paleta de Cores (continuação)"); // Add title again on new page
        }

        doc.setFillColor(color.hex);
        doc.circle(currentX + circleRadius, cursorY + circleRadius, circleRadius, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(color.name, currentX + circleRadius, cursorY + circleDiameter + 10, { align: 'center', maxWidth: circleDiameter + 10 });

        currentX += circleDiameter + gap;
    });
    cursorY += circleDiameter + 40; // Space after palette

    // --- Haircut Suggestions ---
    addSection("Sugestões de Cortes");
    const cuts = analysisData.cuts || [];
    
    cuts.forEach((cut, index) => {
        const estimatedHeight = 20 + 50 + 200 + 40; // title + desc + image + spacing
        if (cursorY + estimatedHeight > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }

        doc.setFontSize(12);
        doc.setTextColor(80);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${cut.name}`, margin, cursorY);
        cursorY += 18;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(cut.description, contentWidth);
        doc.text(descLines, margin, cursorY);
        cursorY += descLines.length * 12 + 10;

        if (cut.generatedImage) {
            try {
                const imgWidth = 200;
                const imgHeight = 200;
                const imgX = (pageWidth - imgWidth) / 2;

                if (cursorY + imgHeight + 20 > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }
                
                doc.addImage(cut.generatedImage, 'PNG', imgX, cursorY, imgWidth, imgHeight);
                cursorY += imgHeight + 30;
            } catch (e) {
                console.error("Error adding image to PDF:", e);
                doc.text("[Erro ao carregar imagem da simulação]", margin, cursorY);
                cursorY += 20;
            }
        }
    });

    return doc;
  };

  const handleSavePDF = () => {
    const doc = generatePDFDoc();
    if (doc) doc.save(`4us_visagismo_${clientName}.pdf`);
  };

  const handleShare = async () => {
    const doc = generatePDFDoc();
    if (!doc) return;
    setSharing(true);
    try {
        const blob = doc.output('blob');
        const file = new File([blob], `4us_${clientName}.pdf`, { type: "application/pdf" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Consultoria 4us!', text: `Consultoria de ${clientName}` });
        } else {
            doc.save(`4us_${clientName}.pdf`);
        }
    } catch (e) { console.error(e); doc.save(`4us_${clientName}.pdf`); } 
    finally { setSharing(false); }
  };

  const handleDownloadImage = (imageDataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `4us_${clientName}_${fileName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neon-violet to-purple-400">Análise de Visagismo</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-bold text-gray-400 mb-1">Nome da Cliente</label>
                <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Ana Silva"
                    className="w-full bg-studio-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neon-violet outline-none"
                />
            </div>

            <div className={`
              relative group border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-500
              ${loading || generatingCuts ? 'border-neon-violet/80 animate-pulse-slow' : 'border-gray-600'}
              ${!image && !loading ? 'hover:border-neon-cyan cursor-pointer' : ''}
            `}>
                {!image && (
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                )}
                {!image ? (
                    <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p>Arraste a foto aqui</p>
                    </div>
                ) : (
                    <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg object-cover group-hover:scale-105 transition-transform" />
                )}
            </div>
            
            {!image && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button onClick={() => startCamera('user')} className="py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg text-sm">Selfie</button>
                    <button onClick={() => startCamera('environment')} className="py-3 rounded-xl font-bold text-gray-300 bg-studio-card border border-gray-600 text-sm">Câmera Traseira</button>
                </div>
            )}

            <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={deepAnalysis} onChange={(e) => setDeepAnalysis(e.target.checked)} className="form-checkbox h-5 w-5 text-neon-violet rounded border-gray-600 bg-gray-700" />
                    <span className="text-gray-300">Análise Profunda (Thinking)</span>
                </label>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!image || loading || !clientName.trim()}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg tracking-wide transition-all
                    ${!image || loading || !clientName.trim()
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-neon-violet to-neon-purple text-white hover:shadow-neon'
                    }`}
            >
                {loading ? 'Analisando...' : 'Iniciar Consultoria'}
            </button>

            {image && !analysisData && (
                <button onClick={handleReset} className="w-full mt-3 py-3 rounded-xl font-medium text-gray-400 border border-gray-700 hover:border-neon-cyan hover:text-neon-cyan">Nova Foto</button>
            )}
        </div>
      </div>

      <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg overflow-hidden flex flex-col h-[600px]">
        {/* Result Area */}
        <h3 className="text-xl font-bold mb-4 text-neon-cyan flex items-center justify-between shrink-0">
            <span>Resultado: {clientName}</span>
            <div className="flex items-center gap-2">
                 {analysisData && (
                    <button onClick={handleCloseResult} title="Fechar Resultado" className="text-gray-500 hover:text-red-500 transition-colors p-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>
        </h3>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {analysisData ? (
                 <div className="space-y-8 pb-4">
                    {/* Palette */}
                    {analysisData.palette && (
                        <div className="bg-black/30 p-6 rounded-xl border border-gray-800">
                            <h4 className="text-sm uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-700 pb-2">Paleta</h4>
                            <div className="flex flex-wrap gap-6 justify-center">
                                {analysisData.palette.map((color, idx) => (
                                    <div key={idx} className="flex flex-col items-center space-y-2">
                                        <div className="w-14 h-14 rounded-full shadow-lg border-2 border-white/10" style={{ backgroundColor: color.hex }}></div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 text-center w-20 leading-tight">{color.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Cuts */}
                    {analysisData.cuts && (
                         <div className="space-y-4">
                            <h4 className="text-lg font-bold text-neon-violet border-l-4 border-neon-violet pl-3">Sugestões de Cortes</h4>
                            <div className="grid gap-4">
                                {analysisData.cuts.map((cut, idx) => (
                                    <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex flex-col">
                                        <h5 className="font-bold text-white text-lg">{cut.name}</h5>
                                        <p className="text-sm text-gray-400 mb-4">{cut.description}</p>
                                        <div className="relative group w-full h-64 bg-black/50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-800">
                                            {cut.generatedImage ? (
                                                <img src={cut.generatedImage} className="w-full h-full object-cover animate-fade-in" alt={`Simulação de ${cut.name}`} />
                                            ) : (
                                                <span className="text-xs animate-pulse">Gerando...</span>
                                            )}
                                        </div>
                                        {cut.generatedImage && (
                                            <button
                                                onClick={() => handleDownloadImage(cut.generatedImage!, cut.name)}
                                                className="mt-4 w-full bg-studio-bg hover:bg-gray-800 text-gray-300 py-2 rounded-xl text-sm border border-gray-700 transition-colors flex items-center justify-center gap-2"
                                                title="Salvar Simulação"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Salvar Simulação
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="prose prose-invert prose-p:text-gray-300 max-w-none">
                        <div className="whitespace-pre-line leading-relaxed">{analysisData.consultancy}</div>
                    </div>
                 </div>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-600 flex-col">
                    <p>A análise completa aparecerá aqui.</p>
                </div>
            )}
        </div>

        {analysisData && (
            <div className="mt-4 pt-4 border-t border-studio-accent shrink-0">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSavePDF} className="bg-studio-bg hover:bg-gray-800 text-gray-300 py-3 rounded-xl text-sm border border-gray-700">Salvar PDF</button>
                    <button onClick={handleShare} disabled={sharing} className="bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 text-sm">{sharing ? 'Gerando...' : 'Compartilhar'}</button>
                </div>
                 <button 
                    onClick={handleReset}
                    className="w-full mt-3 py-4 rounded-xl font-bold bg-gradient-to-r from-neon-cyan to-blue-600 text-white hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Capturar Nova Foto</span>
                </button>
            </div>
        )}
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