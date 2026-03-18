const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. Conexão com o Cofre (Firebase)
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("Cofre Firebase Conectado!");
} catch (e) {
    console.log("Aguardando chave do Render...");
}
const db = admin.firestore();

// 2. Conexão com a Inteligência Artificial (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "CHAVE_AUSENTE");

// --- ROTAS DO SISTEMA ---

app.get('/', (req, res) => res.send("Brasilguard Core + IA Online!"));

// ROTA A: O Radar envia os leads (Multi-Tenant isolado)
app.post('/webhook/leads', async (req, res) => {
    try {
        const contatos = req.body.contatos || [];
        const origem = req.body.origem || "Google Maps";
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO"; 

        const cofreDoCliente = db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados');

        for (let telefone of contatos) {
            await cofreDoCliente.add({
                telefone: telefone,
                origem: origem,
                status: "Novo",
                data_captura: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.status(200).send({ sucesso: true, mensagem: "Leads trancados no Cofre do Cliente!" });
    } catch (error) {
        console.error("Erro ao gravar:", error);
        res.status(500).send({ sucesso: false, erro: "Falha ao gravar no Firebase." });
    }
});

// ROTA B: O Painel puxa os leads para visualização
app.get('/api/leads', async (req, res) => {
    try {
        const clienteId = req.query.clienteId || "CLIENTE_MASTER_BRUNO";
        const snapshot = await db.collection('clientes_whitelabel').doc(clienteId).collection('leads_capturados').get();
        
        const listaDeLeads = [];
        snapshot.forEach(doc => listaDeLeads.push({ id: doc.id, ...doc.data() }));

        res.status(200).json(listaDeLeads);
    } catch (error) {
        console.error("Erro ao buscar leads:", error);
        res.status(500).send({ erro: "Falha ao buscar no banco." });
    }
});

// ROTA C: O Agente Hunter entra em ação (RAG + IA)
app.post('/api/hunter/gerar', async (req, res) => {
    try {
        const clienteId = req.body.clienteId || "CLIENTE_MASTER_BRUNO";

        // Passo 1: Puxa a memória individualizada do cliente no Firebase
        const memoriaRef = await db.collection('clientes_whitelabel').doc(clienteId).collection('memoria_hunter').get();
        let contextoCliente = "";
        memoriaRef.forEach(doc => { contextoCliente += doc.data().texto + " "; });

        if (!contextoCliente) {
            contextoCliente = "A Brasilguard Sistemas é um hub de tecnologia focado em captação inteligente e automação de processos.";
        }

        // Passo 2: O Prompt (A ordem para a IA)
        const prompt = `Você é um especialista em vendas pelo WhatsApp.
        Contexto do negócio: ${contextoCliente}
        Tarefa: Crie uma mensagem curta, persuasiva e muito natural (máximo 3 frases) para iniciar uma conversa com um lead capturado no Google Maps. Aja como um humano, não pareça um robô.`;

        // Passo 3: Geração da Mensagem
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const mensagemPronta = result.response.text();

        res.status(200).json({ sucesso: true, mensagem: mensagemPronta });
    } catch (error) {
        console.error("Erro no Hunter:", error);
        res.status(500).json({ sucesso: false, erro: "Falha na geração da IA" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));