import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";

export default function TestLoginSimple() {
  const [message, setMessage] = useState("Aguardando clique...");

  // Teste 1: Função simples onclick
  const handleButtonClick = () => {
    console.log("🟢 BOTÃO CLICADO!");
    setMessage("✅ Botão funcionou! Clique detectado.");
  };

  // Teste 2: Form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 FORM SUBMETIDO!");
    setMessage("✅ Formulário funcionou! Submit detectado.");
  };

  // Teste 3: Button type=submit dentro de form
  const handleFormSubmit2 = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 FORM 2 SUBMETIDO (com button type=submit)!");
    setMessage("✅ Formulário 2 funcionou! Submit detectado.");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">🧪 Teste de Botões e Formulários</h1>
          
          <div className="bg-white p-8 rounded-lg shadow-md space-y-8">
            {/* Status */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-lg font-semibold text-blue-900">{message}</p>
            </div>

            {/* Teste 1: Botão simples com onClick */}
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Teste 1: Botão Simples (onClick)</h2>
              <button
                onClick={handleButtonClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clique Aqui (Teste 1)
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Deve aparecer no console: 🟢 BOTÃO CLICADO!
              </p>
            </div>

            {/* Teste 2: Form com onSubmit */}
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Teste 2: Form com onSubmit</h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Digite algo..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                />
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submeter Form (Teste 2)
                </button>
              </form>
              <p className="text-sm text-gray-600 mt-2">
                Deve aparecer no console: 🟢 FORM SUBMETIDO!
              </p>
            </div>

            {/* Teste 3: Form com button type=submit (como na página de login) */}
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Teste 3: Form + Button type=submit</h2>
              <form onSubmit={handleFormSubmit2} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email..."
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                />
                <input
                  type="password"
                  placeholder="Password..."
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                />
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Entrar (Teste 3)
                </button>
              </form>
              <p className="text-sm text-gray-600 mt-2">
                Deve aparecer no console: 🟢 FORM 2 SUBMETIDO (com button type=submit)!
              </p>
            </div>

            {/* Instruções */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-yellow-900 mb-2">📋 Instruções:</h3>
              <ol className="list-decimal list-inside space-y-2 text-yellow-900">
                <li>Abra o console do navegador (F12 → Console)</li>
                <li>Teste cada botão/formulário acima</li>
                <li>Verifique se aparecem as mensagens no console</li>
                <li>Reporte qual teste funciona e qual não funciona</li>
              </ol>
            </div>

            {/* Diagnóstico */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="font-bold text-red-900 mb-2">🔍 Diagnóstico:</h3>
              <ul className="space-y-2 text-red-900 text-sm">
                <li><strong>Se NENHUM teste funcionar:</strong> Problema no JavaScript ou Next.js</li>
                <li><strong>Se Teste 1 funciona mas Teste 2/3 não:</strong> Problema com formulários</li>
                <li><strong>Se Teste 1 e 2 funcionam mas Teste 3 não:</strong> Problema com button type=submit</li>
                <li><strong>Se TODOS funcionam:</strong> Problema específico na página de login</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}