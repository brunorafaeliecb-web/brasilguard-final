const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Configurações de Segurança e Dados
app.use(cors());
app.use(express.json());

// Rota de Teste (Health Check)
app.get('/', (req, res) => {
    res.send('🚀 Nave-Mãe Brasilguard Online | Gemini 3 Pro Ativo');
});

// Rota do Hunter: Gerador de O.S. com IA
app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            console.error("ERRO: Chave API ausente no Render!");
            return res.status(500).json({ sucesso: false, erro: "Configuração de API pendente." });
        }

        // Inicializa a IA com o motor de 2026
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // MODELO TOP DE LINHA PARA CONTAS PRO: gemini-3-pro
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-pro",
            generationConfig: { temperature: 0.7 } 
        });

        const prompt = `Aja como o técnico principal da Brasilguard Sistemas. 
        Crie uma mensagem profissional para o WhatsApp do cliente "${cliente}". 
        Relato do Problema: ${problema}. 
        Serviço Realizado: ${servico}. 
        Garanta ao cliente que o sistema foi testado e está 100% operacional. 
        Use um tom técnico, mas acessível. Sem introduções, vá direto ao texto da mensagem.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textoIA = response.text();

        console.log(`✅ O.S. gerada com sucesso para: ${cliente}`);
        res.json({ sucesso: true, relatorio: textoIA });

    } catch (error) {
        console.error("❌ ERRO NO MOTOR IA:", error.message);
        res.status(500).json({ sucesso: false, erro: "O motor da IA teve um soluço. Verifique os logs." });
    }
});

// Porta padrão do Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Brasilguard Core rodando na porta ${PORT}`);
    console.log(`🧠 Inteligência Ativa: Gemini 3 Pro`);
});