import React, { useState, useEffect } from 'react';
import { getLibraryItems, searchLibrary, deleteLibraryItem } from '../services/libraryService';
import { LibraryItem } from '../types';

export const Library: React.FC = () => {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

    useEffect(() => {
        setItems(getLibraryItems());
    }, []);

    const filteredItems = searchLibrary(searchQuery, items);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este relatório?")) {
            const updated = deleteLibraryItem(id);
            setItems(updated);
            if (selectedItem?.id === id) setSelectedItem(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'VISAGISMO': return 'bg-neon-violet text-white';
            case 'COLORISTA': return 'bg-neon-purple text-white';
            case 'HAIRSTYLIST': return 'bg-neon-cyan text-black';
            case 'THERAPIST': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'VISAGISMO': return 'Visagismo';
            case 'COLORISTA': return 'Colorista';
            case 'HAIRSTYLIST': return 'Hairstylist 5D';
            case 'THERAPIST': return 'Terapia Capilar';
            default: return type;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Biblioteca do Salão</h2>
                <p className="text-gray-400">Histórico de consultorias, planos de corte e tratamento.</p>
                
                <div className="mt-6 flex gap-4">
                    <div className="relative flex-1">
                        <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            type="text" 
                            placeholder="Buscar por nome da cliente, data (DD/MM/AAAA) ou tipo..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-studio-card border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-neon-purple outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden grid md:grid-cols-3 gap-6">
                {/* LIST */}
                <div className="md:col-span-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {filteredItems.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            <p>Nenhum item encontrado.</p>
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`bg-studio-card border rounded-xl p-4 cursor-pointer transition-all hover:bg-gray-800 flex gap-4
                                    ${selectedItem?.id === item.id ? 'border-neon-purple shadow-[0_0_15px_rgba(189,0,255,0.3)]' : 'border-gray-700'}
                                `}
                            >
                                <div className="w-16 h-16 bg-black rounded-lg overflow-hidden shrink-0">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 text-xs">Sem Foto</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white truncate">{item.clientName}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getTypeColor(item.type)}`}>
                                            {getTypeLabel(item.type)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(item.date).toLocaleDateString()} às {new Date(item.date).toLocaleTimeString().slice(0,5)}</p>
                                    {item.brand && <p className="text-xs text-gray-500 mt-1 truncate">{item.brand}</p>}
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="text-gray-600 hover:text-red-500 self-center"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* DETAIL VIEW */}
                <div className="md:col-span-2 bg-studio-card border border-studio-accent rounded-2xl overflow-hidden flex flex-col">
                    {selectedItem ? (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                                {selectedItem.thumbnail && (
                                    <img src={selectedItem.thumbnail} className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
                                )}
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{selectedItem.clientName}</h3>
                                    <p className="text-gray-400">{getTypeLabel(selectedItem.type)} • {new Date(selectedItem.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* DYNAMIC CONTENT BASED ON TYPE */}
                            {selectedItem.type === 'VISAGISMO' && (
                                <div className="space-y-6">
                                    <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30">
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{selectedItem.reportData.consultancy}</p>
                                    </div>
                                    {selectedItem.reportData.palette && (
                                        <div className="flex flex-wrap gap-4">
                                            {selectedItem.reportData.palette.map((c: any, i: number) => (
                                                <div key={i} className="flex flex-col items-center"><div className="w-10 h-10 rounded-full" style={{backgroundColor: c.hex}}></div><span className="text-xs mt-1 text-gray-500">{c.name}</span></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                             {selectedItem.type === 'COLORISTA' && (
                                <div className="space-y-6">
                                    <div className="flex gap-4 h-64">
                                        {selectedItem.thumbnail && <div className="w-1/2"><p className="text-xs text-center mb-1">Antes</p><img src={selectedItem.thumbnail} className="h-full w-full object-contain rounded-lg bg-black/50" /></div>}
                                        {selectedItem.generatedImages && selectedItem.generatedImages[0] && <div className="w-1/2"><p className="text-xs text-center mb-1">Depois</p><img src={selectedItem.generatedImages[0]} className="h-full w-full object-contain rounded-lg bg-black/50" /></div>}
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-lg"><h4 className="font-bold text-gray-400">Diagnóstico</h4><p className="text-sm">{selectedItem.reportData.diagnosis}</p></div>
                                    <div className="bg-neon-cyan/10 p-4 rounded-lg border border-neon-cyan/30">
                                        <h4 className="font-bold text-neon-cyan mb-2">Fórmula ({selectedItem.brand})</h4>
                                        <div className="space-y-3">
                                            {selectedItem.reportData.formula.primary && (
                                                <div>
                                                    <p className="text-xs text-cyan-200 uppercase font-bold">Principal:</p>
                                                    <p className="font-mono text-sm text-white">{selectedItem.reportData.formula.primary}</p>
                                                </div>
                                            )}
                                            {selectedItem.reportData.formula.toner && (
                                                <div>
                                                    <p className="text-xs text-cyan-200 uppercase font-bold">Tonalizante:</p>
                                                    <p className="font-mono text-sm text-white">{selectedItem.reportData.formula.toner}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {selectedItem.type === 'HAIRSTYLIST' && (
                                <div className="space-y-6">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1"><img src={selectedItem.thumbnail!} className="w-full aspect-square object-contain bg-black/30 rounded-lg" /><p className="text-center text-xs text-gray-400">Antes</p></div>
                                        {selectedItem.generatedImages?.map((img, i) => (
                                            <div key={i} className="space-y-1">
                                                <img src={img} className="w-full aspect-square object-contain bg-black/30 rounded-lg" />
                                                <p className="text-center text-xs text-gray-400">Depois ({['Frente', 'Lado', 'Costas'][i]})</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-lg"><h4 className="font-bold text-gray-400">Análise Visagista</h4><p className="text-sm">{selectedItem.reportData.visagismAnalysis}</p></div>
                                    <div className="bg-gray-800 p-4 rounded-lg"><h4 className="font-bold text-gray-400">Viabilidade</h4><p className="text-sm">{selectedItem.reportData.viabilityVerdict}</p></div>
                                </div>
                            )}

                            {selectedItem.type === 'THERAPIST' && (
                                <div className="space-y-6">
                                    <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                                        <h4 className="text-red-400 font-bold uppercase mb-2">Diagnóstico</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <p><strong>Dano:</strong> {selectedItem.reportData.diagnosis.damageLevel}</p>
                                            <p><strong>Porosidade:</strong> {selectedItem.reportData.diagnosis.porosity}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        <h4 className="font-bold text-white mb-2">Protocolo: {selectedItem.reportData.treatmentPlan.protocolName}</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-400">{selectedItem.reportData.treatmentPlan.products.map((p:string, i:number) => <li key={i}>{p}</li>)}</ul>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                            <svg className="w-20 h-20 opacity-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            <p>Selecione um item da biblioteca para visualizar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};