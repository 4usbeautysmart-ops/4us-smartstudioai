import React, { useState, useRef, useEffect } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createChatSession } from '../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'model', text: 'Olá! Eu sou o assistente inteligente do 4us! Smart Studio AI. Como posso ajudar você hoje com dúvidas de beleza, estilo ou produtos?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize chat session on mount
        if (!chatSession.current) {
            chatSession.current = createChatSession();
        }
    }, []);

    useEffect(() => {
        // Auto scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatSession.current) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Send message and get response
            const response: GenerateContentResponse = await chatSession.current.sendMessage({ message: userMsg.text });
            const botMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: response.text || "Desculpe, não consegui processar sua mensagem." 
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: "Ocorreu um erro na comunicação. Por favor, tente novamente." 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[85vh] flex flex-col bg-studio-card rounded-2xl border border-studio-accent shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-studio-accent/50 p-4 border-b border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Assistente Smart 4us!</h2>
                    <p className="text-xs text-neon-purple flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse"></span>
                        Online • Gemini 3.0 Pro
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 custom-scrollbar">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-lg
                            ${msg.role === 'user' 
                                ? 'bg-gradient-to-r from-neon-purple to-purple-700 text-white rounded-tr-none' 
                                : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-none px-5 py-4 flex gap-2">
                            <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-studio-card border-t border-studio-accent">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua dúvida aqui..."
                        disabled={isLoading}
                        className="flex-1 bg-studio-bg border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all placeholder-gray-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-neon-purple hover:bg-purple-600 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3rem]"
                    >
                        <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-2">
                    O assistente pode cometer erros. Verifique informações importantes.
                </p>
            </div>
        </div>
    );
};