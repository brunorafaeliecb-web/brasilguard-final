const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // ESSA LINHA É A CHAVE

const app = express();

// Configuração do CORS para aceitar conexões do seu Plugin
app.use(cors()); 
app.use(express.json());

// Tenta conectar ao Firebase
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Cofre Firebase Conectado!");
} catch (e) {
    console.log("Aguardando configuração de Secret File no Render...");
}

const db = admin.firestore();

// Rota de teste
app.get('/', (req, res) => {
    res.send("Nave-Mãe Online e com CORS liberado!");
});

// Rota para receber e SALVAR os leads do Plugin
app.post('/webhook/leads', async (req, res) => {
    console.log("LEADS RECEBIDOS:", req.body);
    
    try {
        const contatos = req.body.contatos || [];
        const origem = req.body.origem || "Google Maps";
        
        // Loop para salvar cada telefone como um documento novo no Firebase
        for (let telefone of contatos) {
            await db.collection('leads_capturados').add({
                telefone: telefone,
                origem: origem,
                status: "Novo", // Para o Hunter saber quem abordar depois
                data_captura: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(200).send({ sucesso: true, mensagem: "Leads trancados no Cofre!" });
    } catch (error) {
        console.error("Erro ao abrir o cofre:", error);
        res.status(500).send({ sucesso: false, erro: "Falha ao gravar no Firebase." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));