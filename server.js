const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa o Gemini com a sua chave do .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================================
// ROTAS DO HUNTER (VENDAS E LEADS)
// =================================================================

app.post('/webhook/leads', (req, res) => {
    // Aqui o seu aspirador de leads vai jogar os dados depois
    res.status(200).send({ sucesso: true, mensagem: "Lead recebido" });
});

app.get('/api/leads', (req, res) => {
    // Retorna os leads do cliente (conectado ao Firebase depois)
    res.json([]); 
});

app.post('/api/hunter/treinar', (req, res) => {
    // Salva a personalidade da IA
    res.json({ sucesso: true });
});

app.get('/api/hunter/memoria', (req, res) => {
    // Retorna a personalidade da IA
    res.json({ texto: "" });
});

// =================================================================
// NOVA ROTA: GERAR RELATÓRIO DE O.S. COM IA (SERVICE DESK)
// =================================================================

app.post('/api/hunter/gerar-os', async (req, res) => {
    try {
        const { cliente, problema, servico } = req.body;

        const promptTexto = `Aja como um técnico sênior e cordial da empresa Brasilguard Sistemas.
        Escreva uma mensagem executiva, curta e profissional para enviar no WhatsApp do cliente "${cliente}".
        
        O cliente relatou este problema: "${problema}".
        A nossa equipe executou esta solução: "${servico}".
        
        A mensagem deve ser educada, confirmar que o sistema está novamente 100% operante e homologado, e agradecer a confiança. Pode usar alguns emojis profissionais. Não inclua espaços para assinar, assine apenas como "Equipe Técnica - Brasilguard".`;

        // Chama o cérebro da IA (Gemini)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(promptTexto);
        const respostaIA = await result.response.text();

        res.json({ sucesso: true, relatorio: respostaIA });

    } catch (error) {
        console.error("Erro ao gerar OS com IA:", error);
        res.status(500).json({ sucesso: false, erro: "Falha na comunicação com a IA." });
    }
});

// =================================================================
// INICIA O SERVIDOR
// =================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nave-Mãe Brasilguard rodando na porta ${PORT}`));