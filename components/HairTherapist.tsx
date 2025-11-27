import React, { useState, useRef } from 'react';
import { generateHairTherapyConsultancy } from '../services/geminiService';
import { saveToLibrary, compressImageForStorage } from '../services/libraryService';
import { jsPDF } from "jspdf";
import { AppView } from '../types';

interface Diagnosis {
    damageLevel: string;
    porosity: string;
    elasticity: string;
    scalpCondition: string;
    summary: string;
}

interface TreatmentPlan {
    protocolName: string;
    products: string[];
    stepByStep: string[];
    schedule: string[];
    lifestyleTips?: string[];
    expectedResults?: string;
}

interface TherapyReport {
    diagnosis: Diagnosis;
    treatmentPlan: TreatmentPlan;
}

const BRANDS = ["Kérastase", "L'Oréal Professionnel", "Wella Professionals", "Schwarzkopf Professional", "Truss Hair", "Davines", "Joico", "Redken", "Braé"];

interface HairTherapistProps {
    onNavigate: (view: AppView) => void;
}

export const HairTherapist: React.FC<HairTherapistProps> = ({ onNavigate }) => {
    const [image, setImage] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [description, setDescription] = useState('');
    const [brand, setBrand] = useState(BRANDS[0]);
    const [report, setReport] = useState<TherapyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
        const saved = localStorage.getItem('therapist_camera_mode');
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
                setReport(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!image || !description || !clientName.trim()) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        setLoading(true);
        setReport(null);
        try {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(':')[1].split(';')[0];
            
            // Show result immediately
            const result = await generateHairTherapyConsultancy(base64Data, mimeType, description, brand);
            setReport(result);
            
            // Save compressed version to library in the background
            try {
                const compressedThumbnail = await compressImageForStorage(image, 512);
                await saveToLibrary({
                    type: 'THERAPIST',
                    clientName: clientName,
                    thumbnail: compressedThumbnail,
                    brand: brand,
                    reportData: result
                });
            } catch (saveError) {
                console.error("Failed to compress and save to library:", saveError);
            }

        } catch (error) {
            console.error(error);
            alert("Erro na análise capilar.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => { setImage(null); setDescription(''); setReport(null); setClientName(''); };

    const startCamera = async (mode: 'user' | 'environment') => {
        setFacingMode(mode);
        localStorage.setItem('therapist_camera_mode', mode);
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
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
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
                setImage(canvas.toDataURL('image/jpeg'));
                setReport(null);
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

        doc.setFontSize(24);
        doc.setTextColor('#FF4500'); // OrangeRed for therapy
        doc.text("4us! Smart Studio AI", pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 20;

        doc.setFontSize(16);
        doc.setTextColor(100);
        doc.text(`Protocolo de Terapia Capilar: ${clientName}`, pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 40;

        const addSection = (title: string, content: string | string[], isList = false) => {
            if (cursorY > pageHeight - margin * 2) { doc.addPage(); cursorY = margin; }
            doc.setFontSize(14);
            doc.setTextColor('#FF4500');
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
              const lines = doc.splitTextToSize(String(content), contentWidth);
              if (cursorY + lines.length * 12 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
              doc.text(lines, margin, cursorY);
              cursorY += lines.length * 12 + 15;
            }
        };
        
        addSection("Diagnóstico Completo", `Nível de Dano: ${report.diagnosis.damageLevel}\nPorosidade: ${report.diagnosis.porosity}\nElasticidade: ${report.diagnosis.elasticity}\nCouro Cabeludo: ${report.diagnosis.scalpCondition}`);
        addSection("Resumo do Especialista", report.diagnosis.summary);
        
        addSection("Plano de Tratamento", report.treatmentPlan.protocolName);
        addSection("Produtos Recomendados", report.treatmentPlan.products, true);
        addSection("Passo a Passo da Aplicação", report.treatmentPlan.stepByStep.map((s, i) => `${i + 1}. ${s}`));
        addSection("Cronograma Capilar (4 Semanas)", Array.isArray(report.treatmentPlan.schedule) ? report.treatmentPlan.schedule.join('\n') : report.treatmentPlan.schedule);
        if (report.treatmentPlan.lifestyleTips) {
            addSection("Dicas de Estilo de Vida", report.treatmentPlan.lifestyleTips, true);
        }
        if (report.treatmentPlan.expectedResults) {
            addSection("Resultados Esperados", report.treatmentPlan.expectedResults);
        }
        
        return doc;
    };
    
    const handleSavePDF = () => { const doc = generatePDFDoc(); if(doc) doc.save(`terapia_${clientName.replace(/\s+/g, '_')}.pdf`); };
    const handleShare = async () => {
        const doc = generatePDFDoc();
        if (!doc) return;
        setSharing(true);
        try {
            const blob = doc.output('blob');
            const file = new File([blob], `terapia_capilar_${clientName.replace(/\s+/g, '_')}.pdf`, { type: "application/pdf" });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Protocolo Capilar para ${clientName}`,
                    text: `Protocolo gerado pelo 4us! Smart Studio AI.`
                });
            } else {
                doc.save(`terapia_capilar_${clientName.replace(/\s+/g, '_')}.pdf`);
            }
        } catch (e) {
            console.error("Share error:", e);
            doc.save(`terapia_capilar_${clientName.replace(/\s+/g, '_')}.pdf`);
        } finally {
            setSharing(false);
        }
    };

    const ReportSection: React.FC<{title: string; children: React.ReactNode; colorClass?: string;}> = ({title, children, colorClass = 'text-cyan-300'}) => (
        <div>
            <strong className={`block ${colorClass} mb-2`}>{title}:</strong>
            <div className="text-gray-300 space-y-1 text-sm">
                {children}
            </div>
        </div>
    );

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-full">
            {/* Input Column */}
            <div className="space-y-6">
                <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg relative">
                     <button onClick={() => onNavigate(AppView.DASHBOARD)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Terapeuta Capilar</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-2">Nome da Cliente</label>
                            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-studio-bg border border-gray-700 rounded-lg p-3 text-white outline-none" placeholder="Nome Completo" />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-2">1. Foto do Cabelo</label>
                            <div className="relative group h-48 border-2 border-dashed border-gray-600 rounded-xl p-4 flex items-center justify-center bg-black/30 hover:border-red-500 transition-colors">
                                {!image && <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />}
                                {image ? <img src={image} className="max-h-full object-contain" /> : <p className="text-gray-400">Enviar foto</p>}
                            </div>
                            {!image && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <button onClick={() => startCamera('user')} className="py-2 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg text-sm">Selfie</button>
                                    <button onClick={() => startCamera('environment')} className="py-2 rounded-lg font-bold text-gray-300 bg-studio-card border border-gray-600 text-sm">Câmera Traseira</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-400 block mb-2">2. Marca</label>
                            <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full bg-studio-bg border border-gray-700 rounded-lg p-3 text-white outline-none">
                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Queixa do cliente (ex: Cabelo quebradiço, sem brilho)" className="w-full h-24 bg-studio-bg border border-gray-700 rounded-lg p-3 text-white outline-none" />

                        <button onClick={handleAnalyze} disabled={!image || !description || !clientName || loading} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-orange-600 text-white disabled:opacity-50">
                            {loading ? 'Diagnosticando...' : 'Gerar Protocolo'}
                        </button>
                         {image && <button onClick={handleReset} className="w-full text-center text-xs text-gray-500 hover:text-red-400 mt-2">Nova Análise</button>}
                    </div>
                </div>
            </div>

            {/* Output Column */}
            <div className="bg-studio-card p-6 rounded-2xl border border-studio-accent/50 shadow-lg flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4 text-white shrink-0">Prontuário: {clientName}</h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {report ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30">
                                <h4 className="text-xl font-bold text-red-400 mb-4">Diagnóstico Completo</h4>
                                <div className="space-y-4 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <ReportSection title="Nível de Dano" colorClass="text-red-300">{report.diagnosis.damageLevel}</ReportSection>
                                        <ReportSection title="Porosidade" colorClass="text-red-300">{report.diagnosis.porosity}</ReportSection>
                                        <ReportSection title="Elasticidade" colorClass="text-red-300">{report.diagnosis.elasticity}</ReportSection>
                                        <ReportSection title="Couro Cabeludo" colorClass="text-red-300">{report.diagnosis.scalpCondition}</ReportSection>
                                    </div>
                                    <ReportSection title="Resumo do Especialista" colorClass="text-red-300">
                                        <p className="leading-relaxed">{report.diagnosis.summary}</p>
                                    </ReportSection>
                                </div>
                            </div>

                            <div className="bg-studio-accent/50 p-6 rounded-2xl border border-gray-700">
                                <h4 className="text-xl font-bold text-neon-cyan mb-2">{report.treatmentPlan.protocolName}</h4>
                                <p className="text-sm text-gray-400 mb-4">Protocolo de tratamento com <span className="font-bold">{brand}</span></p>

                                <div className="space-y-4">
                                    <ReportSection title="Produtos Recomendados">
                                        <ul className="list-disc list-inside space-y-1">
                                            {report.treatmentPlan.products.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </ReportSection>
                                    <ReportSection title="Passo a Passo da Aplicação">
                                        <ol className="list-decimal list-inside space-y-1">
                                            {report.treatmentPlan.stepByStep.map((s, i) => <li key={i}>{s}</li>)}
                                        </ol>
                                    </ReportSection>
                                     <ReportSection title="Cronograma Capilar (4 Semanas)">
                                         <div className="whitespace-pre-line">
                                            {Array.isArray(report.treatmentPlan.schedule) ? report.treatmentPlan.schedule.join('\n') : report.treatmentPlan.schedule}
                                        </div>
                                    </ReportSection>
                                    {report.treatmentPlan.lifestyleTips && (
                                        <ReportSection title="Dicas Adicionais (Estilo de Vida)">
                                            <ul className="list-disc list-inside space-y-1">
                                                {report.treatmentPlan.lifestyleTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                            </ul>
                                        </ReportSection>
                                    )}
                                     {report.treatmentPlan.expectedResults && (
                                        <ReportSection title="Resultados Esperados">
                                            <p>{report.treatmentPlan.expectedResults}</p>
                                        </ReportSection>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-700">
                                 <button onClick={handleSavePDF} className="bg-studio-bg hover:bg-gray-800 text-gray-300 py-3 rounded-xl text-sm border border-gray-700">Salvar PDF</button>
                                 <button onClick={handleShare} disabled={sharing} className="bg-gradient-to-r from-neon-cyan to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 text-sm">{sharing ? 'Gerando...' : 'Compartilhar'}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                             <p>O resultado do diagnóstico aparecerá aqui.</p>
                        </div>
                    )}
                </div>
            </div>

            {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                    <video ref={videoRef} className="max-w-full max-h-[80vh] rounded-lg" autoPlay playsInline muted></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute top-4 left-4">
                        <button onClick={handleSwitchCamera} className="p-3 bg-white/10 rounded-full text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 G- 01-15.357-2m15.357 2H15" /></svg></button>
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