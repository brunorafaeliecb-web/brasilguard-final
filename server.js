const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Configurações Iniciais
app.use(cors());
app.use(express.json());

// Rota de Verificação (Health Check)
app.get('/', (req, res) => {
    res.send('🚀 Nave-Mãe Brasilguard Online | Gemini 3.1 Pro Ativo');
});

// Rota Principal: Inteligência de O.S. (Hunter)
app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Chave GEMINI_API_KEY não encontrada no Environment.");
        }

        // Inicializa a IA com a Série 3.1 (Estado da arte em 2026)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-pro-preview",
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
            }
        });

        // Prompt de Engenharia Reversa para Relatório Técnico
        const prompt = `
            CONTEXTO: Você é um Agente de Elite da Brasilguard Sistemas, especialista em Segurança Eletrônica e TI.
            TAREFA: Gerar um relatório técnico de encerramento de chamado para envio via WhatsApp.
            DADOS DO CHAMADO:
            - Cliente: ${cliente}
            - Problema Detectado: ${problema}
            - Solução Aplicada: ${servico}
            
            REQUISITOS DA RESPOSTA:
            1. Use um tom profissional, porém direto.
            2. Confirme que os testes foram realizados e o sistema está 100% operacional.
            3. Finalize com uma saudação padrão da Brasilguard.
            4. Não use introduções como "Aqui está o relatório", vá direto à mensagem.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textoGerado = response.text();

        console.log(`✅ Relatório gerado para: ${cliente}`);
        
        res.json({ 
            sucesso: true, 
            relatorio: textoGerado 
        });

    } catch (error) {
        // Log detalhado no console do Render para debug
        console.error("❌ FALHA NO MOTOR GEMINI 3.1:", error.message);
        
        res.status(500).json({ 
            sucesso: false, 
            erro: "A IA teve um soluço técnico. Verifique os logs do Render.",
            detalhes: error.message 
        });
    }
});

// Inicialização do Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Brasilguard Core rodando na porta ${PORT}`);
    console.log(`🧠 Inteligência: Gemini 3.1 Pro Preview`);
});