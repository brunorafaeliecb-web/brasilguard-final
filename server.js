const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. Firebase (Cofre)
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Cofre Firebase Conectado!");
} catch (e) {
    console.log("⚠️ Aguardando chave do Firebase no Render...");
}
const db = admin.firestore();

// 2. Inteligência Artificial (Gemini Pro)
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
    console.log("✅ Chave GEMINI_API_KEY detectada!");
} else {
    console.log("❌ ERRO: Chave GEMINI_API_KEY ausente no Render!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// --- ROTAS ---

app.get('/', (req, res) => res.send("Brasilguard Core Online!"));

// Rota do Radar (Captura de Leads)
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
    } catch (e) { 
        console.error("Erro no Webhook:", e.message);
        res.status(500).send(e.message); 
    }
});

// Rota do Painel (Listagem)
app.get('/api/leads', async (req, res) => {
    try {
        const clienteId = req.query.clienteId || "CLIENTE_MASTER_BRUNO";
        const snap = await db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados').get();
        const lista = [];
        snap.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        res.json(lista);
    } catch (e) { res.status(500).send(e.message); }
});

// ROTA DO HUNTER (IA RAG)
app.post('/api/hunter/gerar', async (req, res) => {
    try {
        console.log("🤖 Hunter acionado...");
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO";

        // Busca Memória do Cliente (RAG)
        const memoriaRef = await db.collection('clientes_whitelabel').doc(clienteId).collection('memoria_hunter').get();
        let contexto = "";
        memoriaRef.forEach(doc => contexto += doc.data().texto + " ");
        
        if (!contexto) contexto = "Brasilguard Sistemas: Soluções em tecnologia e automação.";

        // Chamada do Modelo Pro (Ajustado para evitar erro 404)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        const prompt = `Aja como um vendedor humano e natural. 
        Contexto do meu negócio: ${contexto}.
        Tarefa: Escreva uma saudação inicial de 2 frases para WhatsApp para um lead do Google Maps.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("✨ Mensagem gerada!");
        res.json({ sucesso: true, mensagem: text });

    } catch (error) {
        console.error("❌ ERRO NO HUNTER:", error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Brasilguard na porta ${PORT}`));