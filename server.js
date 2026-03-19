const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa o Gemini (Certifique-se de configurar a GEMINI_API_KEY no Render!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================================
// ROTA PRINCIPAL: Só para você ver que está vivo!
// =================================================================
app.get('/', (req, res) => {
    res.send('🚀 Nave-Mãe Brasilguard está Online e Pronta para o Combate!');
});

// =================================================================
// ROTA: GERAR RELATÓRIO DE O.S. COM IA
// =================================================================
app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;

        const promptTexto = `Aja como um técnico sênior e cordial da empresa Brasilguard Sistemas.
        Escreva uma mensagem executiva, curta e profissional para enviar no WhatsApp do cliente "${cliente}".
        
        O cliente relatou este problema: "${problema}".
        A nossa equipe executou esta solução: "${servico}".
        
        A mensagem deve ser educada, confirmar que o sistema está novamente 100% operante e homologado, e agradecer a confiança. Use emojis profissionais. Assine como "Equipe Técnica - Brasilguard".`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(promptTexto);
        const respostaIA = await result.response.text();

        res.json({ sucesso: true, relatorio: respostaIA });

    } catch (error) {
        // Isso aqui vai mostrar o erro REAL no log do Render
        console.error("ERRO DETALHADO DA IA:", error.message);
        res.status(500).json({ 
            sucesso: false, 
            erro: error.message // Mandando o erro real pro painel
        });
    }

// Outras rotas do Hunter...
app.post('/api/hunter/treinar', (req, res) => res.json({ sucesso: true }));
app.get('/api/hunter/memoria', (req, res) => res.json({ texto: "" }));
app.get('/api/leads', (req, res) => res.json([]));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nave-Mãe rodando na porta ${PORT}`));