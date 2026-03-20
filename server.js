const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota de Boas-vindas
app.get('/', (req, res) => res.send('🚀 Nave-Mãe Brasilguard Online | Gemini 3 Pro Ativo'));

// Rota da IA (Agente Hunter)
app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ sucesso: false, erro: "Chave API não configurada." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // ID ESTÁVEL 2026: gemini-3-pro
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro" });

        const prompt = `Aja como o Diretor Técnico da Brasilguard Sistemas. 
        Crie um relatório de serviço impecável para o WhatsApp do cliente "${cliente}". 
        PROBLEMA: ${problema} 
        SOLUÇÃO: ${servico}
        O texto deve ser profissional, direto e confirmar que o sistema está 100% operacional. 
        Não use introduções, envie apenas a mensagem pronta para copiar.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ sucesso: true, relatorio: response.text() });

    } catch (error) {
        console.error("ERRO NO RENDER:", error.message);
        res.status(500).json({ sucesso: false, erro: "Motor 3 Pro teve um soluço técnico." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Brasilguard Core rodando com Gemini 3 Pro`));