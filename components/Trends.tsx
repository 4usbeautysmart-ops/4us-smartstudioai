import React, { useState } from 'react';
import { searchTrends, searchPlaces } from '../services/geminiService';

export const Trends: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'global' | 'local'>('global');
  const [results, setResults] = useState<{text: string | undefined, chunks: any[]} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResults(null);
    try {
        if (mode === 'global') {
            const res = await searchTrends(query);
            setResults(res);
        } else {
            // Get simple location
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const res = await searchPlaces(query, pos.coords.latitude, pos.coords.longitude);
                setResults(res);
                setLoading(false);
            }, (err) => {
                alert("Localização necessária para busca local");
                setLoading(false);
            });
            return; // Early return to wait for callback
        }
    } catch (e) {
        console.error(e);
        alert("A busca falhou");
    } finally {
        if (mode === 'global') setLoading(false);
    }
  };

  // Helper to render sources
  const renderSources = () => {
    if (!results?.chunks) return null;
    
    if (mode === 'global') {
        // Web chunks
        return results.chunks.map((chunk: any, i: number) => (
             chunk.web ? (
                 <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm mb-2 border-l-2 border-neon-cyan">
                    <div className="font-bold text-neon-cyan">{chunk.web.title}</div>
                    <div className="text-gray-400 truncate">{chunk.web.uri}</div>
                 </a>
             ) : null
        ));
    } else {
        // Map chunks
        return results.chunks.map((chunk: any, i: number) => {
             if (chunk.web) {
                // Sometimes maps results return as web chunks in grounding
                 return (
                    <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm mb-2 border-l-2 border-neon-pink">
                        <div className="font-bold text-neon-pink">{chunk.web.title}</div>
                        <div className="text-xs text-gray-400">Resultado do Mapa</div>
                    </a>
                 );
             }
             return null;
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
        <h2 className="text-3xl font-bold mb-6 text-white">Radar de Tendências & Fornecedores</h2>
        
        <div className="bg-studio-card p-4 rounded-2xl border border-studio-accent mb-6 flex flex-col md:flex-row gap-4 shadow-lg">
             <div className="flex rounded-lg bg-studio-bg p-1 border border-gray-700 shrink-0">
                <button 
                    onClick={() => setMode('global')}
                    className={`px-4 py-2 rounded-md transition-colors ${mode === 'global' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                    Tendências Globais
                </button>
                <button 
                    onClick={() => setMode('local')}
                    className={`px-4 py-2 rounded-md transition-colors ${mode === 'local' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                    Fornecedores Locais
                </button>
             </div>
             <div className="flex-1 flex gap-2">
                <input 
                    className="flex-1 bg-studio-bg border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-neon-purple outline-none transition-colors"
                    placeholder={mode === 'global' ? "Busque por 'Tendências de Cabelo Verão 2025'..." : "Busque por 'Fornecedores de Shampoo Orgânico'..."}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                    }}
                />
                <button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-neon-purple text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
             </div>
        </div>

        <div className="flex-1 grid md:grid-cols-3 gap-6 overflow-hidden">
            {/* Main Content */}
            <div className="md:col-span-2 bg-studio-card rounded-2xl border border-studio-accent p-6 overflow-y-auto shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                    {mode === 'global' ? 'Análise de Tendências' : 'Insights Locais'}
                </h3>
                {results ? (
                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 whitespace-pre-line leading-relaxed">{results.text}</p>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 flex-col">
                        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <p>Digite uma busca para explorar {mode === 'global' ? 'a web' : 'lugares próximos'}.</p>
                    </div>
                )}
            </div>

            {/* Sources / Grounding */}
            <div className="bg-studio-card rounded-2xl border border-studio-accent p-6 overflow-y-auto shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-400 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    Fontes
                </h3>
                {results?.chunks && results.chunks.length > 0 ? (
                    <div className="space-y-2">
                        {renderSources()}
                    </div>
                ) : (
                    <p className="text-gray-600 text-sm">Nenhuma citação disponível.</p>
                )}
            </div>
        </div>
    </div>
  );
};