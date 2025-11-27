import React, { useEffect, useState } from "react";
import { AppView } from "../types";
import { getQuickBeautyTip } from "../services/geminiService";

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [tip, setTip] = useState<string>("Carregando dica diária...");

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const text = await getQuickBeautyTip();
        setTip(text || "Permaneça linda!");
      } catch (e) {
        setTip("A beleza é poder; um sorriso é sua espada.");
      }
    };
    fetchTip();
  }, []);

  const FEATURES = [
    {
      id: AppView.VISAGISMO,
      title: "Visagismo AI",
      desc: "Análise facial e recomendações",
      color: "from-violet-500 to-purple-500",
      icon: "👤",
    },
    {
      id: AppView.COLORISTA,
      title: "Colorista Expert",
      desc: "Experimente novas cores instantaneamente",
      color: "from-purple-500 to-indigo-500",
      icon: "🎨",
    },
    {
      id: AppView.HAIRSTYLIST,
      title: "Hairstylist Visagista",
      desc: "Plano de corte completo com simulação",
      color: "from-cyan-500 to-blue-500",
      icon: "✂️",
    },
    {
      id: AppView.LOOK_CREATOR,
      title: "Criador de Look",
      desc: "Gere um look completo a partir de uma foto",
      color: "from-emerald-500 to-teal-500",
      icon: "🪄",
    },
    {
      id: AppView.HAIR_THERAPIST,
      title: "Terapeuta Capilar",
      desc: "Diagnóstico e tratamentos personalizados",
      color: "from-red-500 to-orange-500",
      icon: "❤️",
    },
    {
      id: AppView.CHATBOT,
      title: "Assistente Smart",
      desc: "Chatbot especialista para dúvidas rápidas",
      color: "from-violet-600 to-purple-600",
      icon: "💬",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-studio-card to-studio-accent border border-studio-accent p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
            Seja Bem-vindo ao{" "}
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan">
              4us! Smart Studio AI
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Seu companheiro de estúdio inteligente futurista. Eleve sua
            experiência de salão com a inteligência 4us!.
          </p>

          <div className="mt-8 inline-block bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-neon-cyan text-sm font-bold uppercase tracking-wider">
                Dica Diária de IA (Flash Lite)
              </span>
              <svg
                className="w-4 h-4 text-neon-cyan animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-white italic">"{tip}"</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/20 rounded-full blur-[100px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Promotional Banner */}
      <div
        onClick={() => onNavigate(AppView.SUBSCRIPTION)}
        className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-800 p-6 flex items-center justify-between border border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20 transition-all"
      >
        <div className="relative z-10 text-white">
          <h3 className="text-2xl font-bold mb-1">Teste Grátis por 2 Dias</h3>
          <p className="opacity-90">
            Desbloqueie todo o potencial da IA com nosso plano PRO.
          </p>
        </div>
        <div className="relative z-10">
          <button className="bg-white text-yellow-800 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors">
            Ver Plano
          </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onNavigate(feature.id)}
            className="group relative overflow-hidden rounded-2xl bg-studio-card border border-studio-accent p-6 text-left hover:border-neon-purple/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(189,0,255,0.1)]"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-bl-full transition-transform group-hover:scale-150 duration-500`}
            ></div>
            <span className="text-4xl mb-4 block">{feature.icon}</span>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-purple transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm">{feature.desc}</p>
            <div className="mt-4 flex items-center text-neon-purple opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
              Abrir Ferramenta{" "}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
