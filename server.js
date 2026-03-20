const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota de Teste (Health Check)
app.get('/', (req, res) => res.send('🚀 Nave-Mãe Brasilguard Online | Gemini 2.5 Pro Ativo'));

// Rota do Hunter (Gerador de O.S.)
app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ sucesso: false, erro: "Chave API não configurada no Render." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // MODELO ATUALIZADO 2026: gemini-2.5-pro
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const prompt = `Aja como um técnico sênior da Brasilguard Sistemas. 
        Crie um relatório profissional para o WhatsApp do cliente "${cliente}". 
        Problema: ${problema}. 
        Serviço Realizado: ${servico}. 
        Confirme que o sistema está 100% testado e funcional. Seja direto e técnico.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ sucesso: true, relatorio: response.text() });

    } catch (error) {
        console.error("ERRO NO RENDER:", error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Brasilguard Core rodando na porta ${PORT}`);
    console.log(`🧠 Inteligência: Gemini 2.5 Pro`);
});