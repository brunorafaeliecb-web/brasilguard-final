const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste para o link do Render
app.get('/', (req, res) => {
    res.send('🚀 Nave-Mãe Brasilguard está ONLINE!');
});

app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ sucesso: false, erro: "Falta a chave GEMINI_API_KEY no Render!" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const promptTexto = `Aja como um técnico sênior da empresa Brasilguard Sistemas. 
        Crie um relatório curto para WhatsApp para o cliente "${cliente}". 
        Problema: ${problema}. Solução: ${servico}. 
        Seja profissional e confirme que está tudo 100%.`;

        const result = await model.generateContent(promptTexto);
        const response = await result.response;
        
        res.json({ sucesso: true, relatorio: response.text() });
    } catch (error) {
        console.error("ERRO NA IA:", error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});