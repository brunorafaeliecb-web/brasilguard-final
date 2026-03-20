const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('🚀 Nave-Mãe Brasilguard Online | Gemini 2.0 Pro Ativo'));

app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ sucesso: false, erro: "API Key ausente." });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // MODELO ESTÁVEL 2026 PARA CONTAS PRO: gemini-2.0-pro
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro" });

        const prompt = `Aja como técnico sênior da Brasilguard. Crie um relatório para o WhatsApp do cliente "${cliente}". Problema: ${problema}. Solução: ${servico}. Confirme que está 100% funcional. Seja direto.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ sucesso: true, relatorio: response.text() });
    } catch (error) {
        console.error("ERRO NO RENDER:", error.message);
        res.status(500).json({ sucesso: false, erro: "O motor da IA teve um soluço técnico." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Brasilguard Core rodando na porta ${PORT}`));