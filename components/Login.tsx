import React, { useState } from 'react';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simple mock authentication/registration
        if (email && password) {
            localStorage.setItem('4us_user_session', 'active');
            localStorage.setItem('4us_user_email', email);
            
            if (isRegistering) {
                 // Start trial logic on registration
                 const startDate = new Date();
                 localStorage.setItem('trial_start_date', startDate.toISOString());
                 if (name) localStorage.setItem('4us_user_name', name);
            }
            
            onLoginSuccess();
        }
    };

    return (
        <div className="min-h-screen bg-studio-bg flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            
            <div className="relative z-10 w-full max-w-md bg-studio-card border border-studio-accent p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan mb-2">
                        4us!
                    </h1>
                    <p className="text-gray-400">Smart Studio AI</p>
                </div>

                <div className="flex gap-2 mb-6 p-1 bg-gray-800 rounded-lg">
                    <button 
                        onClick={() => setIsRegistering(false)}
                        className={`flex-1 py-2 rounded-md font-medium transition-all ${!isRegistering ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Entrar
                    </button>
                    <button 
                        onClick={() => setIsRegistering(true)}
                        className={`flex-1 py-2 rounded-md font-medium transition-all ${isRegistering ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Criar Conta
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Salão/Profissional</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-studio-bg border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-neon-purple outline-none"
                                placeholder="Seu Nome"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-studio-bg border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-neon-purple outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-studio-bg border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-neon-purple outline-none pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-[0_0_20px_rgba(189,0,255,0.4)] transition-all transform hover:scale-[1.02] mt-4"
                    >
                        {isRegistering ? 'Começar Teste Grátis' : 'Acessar Studio'}
                    </button>
                </form>

                {isRegistering && (
                    <p className="text-center text-xs text-gray-500 mt-4">
                        Ao criar conta, você ganha 7 dias de acesso total gratuito.
                    </p>
                )}
            </div>
        </div>
    );
};