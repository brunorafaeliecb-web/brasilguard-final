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

// Rota para receber os leads do Plugin
app.post('/webhook/leads', (req, res) => {
    console.log("NOVO LEAD RECEBIDO:", req.body);
    // Aqui no futuro vamos salvar no db.collection('leads')
    res.status(200).send({ status: "Sucesso", mensagem: "Lead entregue ao comando central!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));