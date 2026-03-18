const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. Conexão Firebase
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Cofre Firebase Conectado!");
} catch (e) {
    console.log("⚠️ Aguardando chave do Firebase...");
}
const db = admin.firestore();

// 2. Chave da IA
const apiKey = process.env.GEMINI_API_KEY;

// --- ROTAS DO SISTEMA ---

app.get('/', (req, res) => res.send("Brasilguard Core Online!"));

// Rota do Radar
app.post('/webhook/leads', async (req, res) => {
    try {
        const { contatos, origem, clienteId = "CLIENTE_MASTER_BRUNO" } = req.body;
        const cofre = db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados');
        for (let tel of (contatos || [])) {
            await cofre.add({
                telefone: tel,
                origem: origem || "Google Maps",
                status: "Novo",
                data_captura: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.status(200).send({ sucesso: true });
    } catch (e) { res.status(500).send(e.message); }
});

// Rota do Painel
app.get('/api/leads', async (req, res) => {
    try {
        const clienteId = req.query.clienteId || "CLIENTE_MASTER_BRUNO";
        const snapshot = await db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados').get();
        const lista = [];
        snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        res.json(lista);
    } catch (e) { res.status(500).send(e.message); }
});

// ROTA DO HUNTER (IA) - VIA CONEXÃO DIRETA E NATIVA
app.post('/api/hunter/gerar', async (req, res) => {
    try {
        console.log("🤖 Hunter pensando via Bypass Nativo...");
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO";

        if (!apiKey) {
            return res.status(500).json({ sucesso: false, erro: "Chave API ausente no servidor." });
        }

        // Busca a memória (RAG)
        const memoriaRef = await db.collection('clientes_whitelabel').doc(clienteId).collection('memoria_hunter').get();
        let contexto = "";
        memoriaRef.forEach(doc => contexto += doc.data().texto + " ");
        
        if (!contexto) contexto = "Brasilguard Sistemas: Tecnologia em segurança e automação.";
        
        const promptText = `Aja como um vendedor experiente. Contexto: ${contexto}. Tarefa: Crie uma mensagem curta de 2 frases para WhatsApp para abordar um lead. Seja amigável e direto.`;

        // 🚀 O BYPASS: Conexão direta com a URL do Google (Modelo 1.5 Flash super rápido)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();

        // Se o Google reclamar de algo, vamos cuspir o erro real na tela
        if (!response.ok) {
            console.error("Erro Direto da API do Google:", data);
            throw new Error(data.error?.message || "Erro desconhecido na API do Google");
        }

        // Extrai o texto da resposta bruta
        const text = data.candidates[0].content.parts[0].text;
        res.json({ sucesso: true, mensagem: text });

    } catch (error) {
        console.error("❌ Erro Hunter:", error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nave-Mãe na porta ${PORT}`));