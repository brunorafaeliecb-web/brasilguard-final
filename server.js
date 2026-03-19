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

// --- NOVAS ROTAS DE PERSONALIZAÇÃO (A SUA CARA) ---

// Salvar o Treinamento da IA
app.post('/api/hunter/treinar', async (req, res) => {
    try {
        const { instrucoes, clienteId = "CLIENTE_MASTER_BRUNO" } = req.body;
        await db.collection('clientes_whitelabel').doc(clienteId)
                .collection('memoria_hunter').doc('personalidade')
                .set({ texto: instrucoes });
        res.json({ sucesso: true });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Ler o Treinamento Atual
app.get('/api/hunter/memoria', async (req, res) => {
    try {
        const clienteId = req.query.clienteId || "CLIENTE_MASTER_BRUNO";
        const doc = await db.collection('clientes_whitelabel').doc(clienteId)
                      .collection('memoria_hunter').doc('personalidade').get();
        res.json({ texto: doc.exists ? doc.data().texto : "" });
    } catch (e) { res.status(500).send(e.message); }
});

// ROTA DO HUNTER (IA) - AGORA 100% PERSONALIZÁVEL
app.post('/api/hunter/gerar', async (req, res) => {
    try {
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO";
        if (!apiKey) return res.status(500).json({ sucesso: false, erro: "Chave API ausente." });

        // Puxa exatamente o texto que você digitou no painel
        const doc = await db.collection('clientes_whitelabel').doc(clienteId)
                      .collection('memoria_hunter').doc('personalidade').get();
        
        let instrucoesDoCliente = doc.exists ? doc.data().texto : "Aja como um atendente educado. Crie uma saudação de 2 frases.";
        
        // A regra agora é definida por você!
        const promptText = `Você é uma IA de vendas. 
        INSTRUÇÕES DE PERSONALIDADE E TAREFA: ${instrucoesDoCliente}. 
        Aja apenas como instruído acima e devolva apenas o texto da mensagem pronta para o WhatsApp.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Erro no Google");

        const text = data.candidates[0].content.parts[0].text;
        res.json({ sucesso: true, mensagem: text });

    } catch (error) {
        console.error("❌ Erro Hunter:", error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nave-Mãe na porta ${PORT}`));