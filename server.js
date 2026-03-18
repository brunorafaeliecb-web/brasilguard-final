const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. Firebase
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Cofre Firebase Conectado!");
} catch (e) {
    console.log("⚠️ Aguardando chave do Firebase...");
}
const db = admin.firestore();

// 2. Inteligência Artificial (Gemini)
// LOG DE SEGURANÇA: Vamos ver se a chave existe (sem mostrar a chave toda)
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
    console.log("✅ Chave GEMINI_API_KEY detectada (Início: " + apiKey.substring(0, 5) + "...)");
} else {
    console.log("❌ ERRO: Chave GEMINI_API_KEY não encontrada no Environment do Render!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// --- ROTAS ---

app.get('/', (req, res) => res.send("Brasilguard Core Online!"));

// Rota do Radar
app.post('/webhook/leads', async (req, res) => {
    try {
        const { contatos, origem, clienteId = "CLIENTE_MASTER_BRUNO" } = req.body;
        const cofre = db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados');
        for (let tel of (contatos || [])) {
            await cofre.add({ telefone: tel, origem, status: "Novo", data_captura: admin.firestore.FieldValue.serverTimestamp() });
        }
        res.status(200).send({ sucesso: true });
    } catch (e) { res.status(500).send(e.message); }
});

// Rota do Painel
app.get('/api/leads', async (req, res) => {
    try {
        const clienteId = req.query.clienteId || "CLIENTE_MASTER_BRUNO";
        const snap = await db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados').get();
        const lista = [];
        snap.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        res.json(lista);
    } catch (e) { res.status(500).send(e.message); }
});

// ROTA DO HUNTER (IA) - AGORA COM LOGS DETALHADOS
app.post('/api/hunter/gerar', async (req, res) => {
    try {
        console.log("🤖 Hunter acionado! Buscando memória...");
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO";

        // Busca RAG (Memória)
        const memoriaRef = await db.collection('clientes_whitelabel').doc(clienteId).collection('memoria_hunter').get();
        let contexto = "";
        memoriaRef.forEach(doc => contexto += doc.data().texto + " ");
        
        if (!contexto) contexto = "Agência de tecnologia focada em automação.";

        console.log("🧠 Memória carregada. Chamando Gemini...");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Crie uma abordagem de venda curta (2 frases) para WhatsApp. 
        Contexto: ${contexto}. Seja natural e direto.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("✨ Mensagem gerada com sucesso!");
        res.json({ sucesso: true, mensagem: text });

    } catch (error) {
        console.error("❌ ERRO NO HUNTER:", error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nave-Mãe na porta ${PORT}`));