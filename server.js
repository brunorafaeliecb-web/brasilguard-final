const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// 2. Conexão Inteligência Artificial
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// --- ROTAS DO SISTEMA ---

app.get('/', (req, res) => res.send("Brasilguard Core Online!"));

// Rota para receber Leads do Radar
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

// Rota para o Painel ler os Leads
app.get('/api/leads', async (req, res) => {
    try {
        const clienteId = req.query.clienteId || "CLIENTE_MASTER_BRUNO";
        const snapshot = await db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados').get();
        const lista = [];
        snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        res.json(lista);
    } catch (e) { res.status(500).send(e.message); }
});

// ROTA DO HUNTER (IA)
app.post('/api/hunter/gerar', async (req, res) => {
    try {
        console.log("🤖 Hunter pensando...");
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO";

        // Busca a memória (RAG)
        const memoriaRef = await db.collection('clientes_whitelabel').doc(clienteId).collection('memoria_hunter').get();
        let contexto = "";
        memoriaRef.forEach(doc => contexto += doc.data().texto + " ");
        
        if (!contexto) contexto = "Brasilguard Sistemas: Tecnologia em segurança e automação.";

        // SOLUÇÃO DO ERRO 404: Usando o modelo universal
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `Aja como um vendedor experiente. 
        Contexto do meu negócio: ${contexto}.
        Tarefa: Crie uma mensagem curta de 2 frases para o WhatsApp para abordar um lead do Google Maps. Seja direto e amigável. Não use placeholders como [Nome].`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ sucesso: true, mensagem: text });
    } catch (error) {
        console.error("Erro Hunter:", error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nave-Mãe na porta ${PORT}`));