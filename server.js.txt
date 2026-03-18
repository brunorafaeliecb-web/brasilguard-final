const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Tenta carregar a chave do Firebase
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("Cofre Firebase Conectado!");
} catch (e) {
    console.log("Aguardando chave secreta do Render...");
}

const db = admin.firestore();

app.get('/', (req, res) => res.send("Nave-Mãe Online"));

app.post('/webhook/leads', (req, res) => {
    console.log("Lead recebido:", req.body);
    res.status(200).send({ status: "Sucesso", msg: "Lead na base!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));