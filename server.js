const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// --- LINHA DE DEBUG ADICIONADA ABAIXO ---
console.log("MINHA CHAVE É:", process.env.GEMINI_API_KEY ? "ENCONTRADA" : "NÃO ENCONTRADA");
// -----------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('🚀 Nave-Mãe Brasilguard Online | Gemini 1.5 Flash Ativo'));

app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ sucesso: false, erro: "API Key ausente." });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // MOTOR ATUALIZADO: gemini-1.5-flash (Estável e Rápido)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Aja como técnico sênior da Brasilguard Sistemas. Crie um relatório para o WhatsApp do cliente "${cliente}". 
        Problema: ${problema}. 
        Solução técnica: ${servico}. 
        Confirme que o sistema está 100% operacional e testado. Seja direto e profissional.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ sucesso: true, relatorio: response.text() });
    } catch (error) {
        console.error("ERRO NO RENDER:", error.message);
        res.status(500).json({ sucesso: false, erro: "O motor Gemini teve um soluço." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Brasilguard Core rodando com Gemini 1.5 Flash`));