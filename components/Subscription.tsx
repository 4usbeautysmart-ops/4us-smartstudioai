import React, { useState } from "react";

// --- Simulação de uma chamada para a Cloud Function ---
// Em um projeto real, isso seria uma chamada real usando o SDK do Firebase.
const callCreateSubscriptionFunction = async (planType: "MENSAL") => {
  const userEmail = localStorage.getItem("4us_user_email") || "teste@4us.ai";
  const uid = "mock-uid-" + Date.now(); // UID simulado

  console.log(
    `[FRONTEND] Simulando chamada para a Cloud Function 'createMercadoPagoSubscription'`
  );
  console.log(`[FRONTEND] Enviando dados:`, {
    email: userEmail,
    uid,
    planType,
  });

  // Simula a espera da resposta do backend
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Simula a resposta que a sua Cloud Function retornaria
  const mockResponse = {
    init_point: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=mock-preapproval-id-for-${planType.toLowerCase()}`,
    id: `mock-id-${Date.now()}`,
  };

  console.log(
    `[FRONTEND] Resposta simulada recebida do backend:`,
    mockResponse
  );
  return mockResponse;
};

export const Subscription: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false); // Mantido para UI pós-redirect

  const handleSelectPlan = (plan: "monthly") => {
    setSelectedPlan(plan);
    setShowCheckout(true);
    setSuccess(false);
  };

  const handlePay = async () => {
    setProcessing(true);

    const userEmail = localStorage.getItem("4us_user_email") || "teste@4us.ai";
    const uid = "mock-uid-" + Date.now();

    const dadosDoPlano = {
      userId: uid,
      userEmail: userEmail,
      planType: "MENSAL",
    };

    try {
      const resposta = await fetch("/api/createSubscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosDoPlano),
      });

      if (!resposta.ok) {
        const errorData = await resposta.json();
        throw new Error(
          errorData.error || "Falha ao comunicar com o servidor."
        );
      }

      const resultado = await resposta.json();

      if (resultado.checkoutUrl) {
        window.location.href = resultado.checkoutUrl;
      } else {
        alert("Falha ao gerar o link de pagamento.");
      }
    } catch (erro) {
      console.error("Erro ao conectar com o Back-End:", erro);
      alert(`Erro ao iniciar assinatura: ${(erro as Error).message}`);
    }
  };

  const getPrice = () => {
    return "498,00";
  };

  const getPlanName = () => {
    return "Plano Mensal PRO";
  };

  // Calculate trial end date (7 days from now)
  const getTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="text-center space-y-4">
        <span className="bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
          Experimente Sem Compromisso
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan">
          Teste Grátis por 2 Dias
        </h2>
        <p className="text-xl text-gray-400">
          Desbloqueie todo o poder da Inteligência Artificial do 4us!. Cancele a
          qualquer momento durante o teste.
        </p>
      </div>

      {!showCheckout ? (
        <div className="mt-12 flex justify-center">
          {/* Monthly Plan Only */}
          <div className="w-full max-w-md bg-studio-card border-2 border-neon-purple rounded-3xl p-8 shadow-[0_0_30px_rgba(189,0,255,0.15)] flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-neon-purple text-white px-4 py-2 rounded-bl-xl rounded-tr-2xl text-sm font-bold shadow-lg">
              PLANO PRO
            </div>
            <div className="mb-4 flex justify-between items-start">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-500/50">
                2 Dias Grátis
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Mensal</h3>
            <div className="my-6">
              <span className="text-gray-500 line-through text-lg">
                R$ 798,00
              </span>
              <div className="flex items-end gap-1">
                <span className="text-gray-400 text-2xl font-bold">R$</span>
                <span className="text-white text-5xl font-bold">498</span>
                <span className="text-gray-400 mb-1">/mês</span>
              </div>
              <p className="text-neon-cyan text-sm mt-2 font-medium">
                Cobrança inicia apenas após 2 dias
              </p>
            </div>
            <ul className="space-y-4 mb-8 text-white flex-1 font-medium">
              <li className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-neon-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>{" "}
                Acesso a todas as ferramentas AI
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-neon-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>{" "}
                Consultorias ilimitadas
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-neon-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>{" "}
                Geração de PDF e Imagens
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-neon-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>{" "}
                Suporte prioritário
              </li>
            </ul>
            <button
              onClick={() => handlePay()}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-purple to-neon-violet text-white shadow-lg hover:shadow-neon-purple/50 transition-all transform hover:scale-105"
            >
              PAGAR
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white text-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
          {!success ? (
            <>
              {/* Mercado Pago Simulated Header */}
              <div className="bg-[#009EE3] p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <span className="font-bold text-lg">Mercado Pago</span>
                </div>
                <div className="text-sm font-medium opacity-90">
                  Ambiente Seguro
                </div>
              </div>

              <div className="p-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-green-800 text-sm">
                      Teste Grátis de 7 Dias Ativado
                    </h4>
                    <p className="text-green-700 text-xs mt-1">
                      Você não será cobrado hoje. O valor de{" "}
                      <strong>R$ {getPrice()}</strong> será debitado
                      automaticamente apenas em{" "}
                      <strong>{getTrialEndDate()}</strong>, caso você não
                      cancele antes.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">Plano Selecionado</p>
                    <h3 className="text-xl font-bold text-gray-800">
                      {getPlanName()}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 line-through">
                      Total hoje: R$ {getPrice()}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      Total hoje: R$ 0,00
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-bold text-gray-700">
                    Dados para ativação do teste
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === "card"
                          ? "border-[#009EE3] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span className="font-medium text-sm">
                        Cartão de Crédito
                      </span>
                    </button>
                    <button
                      disabled
                      className="p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed bg-gray-50"
                    >
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                      <span className="font-medium text-sm text-gray-400">
                        Pix (Indisponível para Trial)
                      </span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Número do cartão"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-[#009EE3] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Validade (MM/AA)"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-[#009EE3] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-[#009EE3] outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Nome do titular"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-[#009EE3] outline-none"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Seus dados estão protegidos. Nenhuma cobrança será feita
                      agora.
                    </p>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="w-1/3 py-3 rounded-lg font-bold text-[#009EE3] hover:bg-blue-50 transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handlePay}
                      disabled={processing}
                      className="w-2/3 py-3 rounded-lg font-bold text-white bg-[#009EE3] hover:bg-[#008CC9] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30"
                    >
                      {processing ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Redirecionando...
                        </>
                      ) : (
                        `Iniciar Teste Grátis`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                Teste Grátis Ativado!
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Bem-vindo ao 4us! PRO. Você tem <strong>7 dias</strong> de
                acesso total gratuito. Sua primeira cobrança está agendada para{" "}
                <strong>{getTrialEndDate()}</strong>.
              </p>
              <button
                onClick={() => setShowCheckout(false)}
                className="bg-neon-purple text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-purple-600 transition-all"
              >
                Começar a Criar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
