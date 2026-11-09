const express = require('express');
const sqlite3 = require('sqlite3');
const axios = require('axios');
app = express();

var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log("ERRO BD de senhas");
        throw err;
    }
    console.log("BD de senhas conectado!");
})

db.run("CREATE TABLE IF NOT EXISTS senhas (id INTEGER PRIMARY KEY AUTOINCREMENT, valor_senha INTEGER NOT NULL, id_pessoa INTEGER NOT NULL, id_fechadura INTEGER NOT NULL, inicio_validade DATETIME NOT NULL , fim_validade DATETIME NOT NULL)", [], (err) => {
    if (err) {
        console.log("ERRO criar table BD senhas");
        throw err;
    }
})

app.use(express.json());

// Esse endpoint é utilizado para cadastrar senhas no aplicativo
// Por se tratar do aplicativo, é mais plausível ter o ID/número dos quartos de fácil acesso do que o ID da fechadura
app.post('/senhas', async (req, res) => {
    
    const apiData = await axios.get(`http://localhost:8081/quartos/${req.body?.numeroQuarto}`); // Se comunicando com o serviço de quartos pra pegar o ID da fechadura
    
    if (apiData.data?.id_fechadura == null) {
        res.status(400).send('Está fechadura não existe');
    }

    const idFechadura = apiData.data?.id_fechadura;
    const valorSenha = req.body?.valorSenha;
    const idPessoa = req.body?.idPessoa;
    const inicioValidade = req.body?.inicioValidade;
    const fimValidade = req.body?.fimValidade;

    if (inicioValidade > fimValidade) {
        res.status(400).send('Fim da validade não pode ser antes que o começo dela');
    }

        db.run("INSERT INTO senhas(valor_senha, id_pessoa, id_fechadura, inicio_validade, fim_validade) VALUES (?, ?, ?, ?, ?)", [valorSenha, idPessoa, idFechadura, inicioValidade, fimValidade], (err) => {
        if (err) {
            res.status(500).send("ERRO inserindo senha")
            throw err;
        } else {
            res.status(201).send("Senha cadastrada")
        }
    })
});

app.delete('/senhas/:numeroQuarto', async (req, res) => {

    const apiData = await axios.get(`http://localhost:8081/quartos/${req.body?.numeroQuarto}`); // Se comunicando com o serviço de quartos pra pegar o ID da fechadura

    const idFechadura = apiData?.data.id_fechadura;
    const idPessoa = req.body?.idPessoa;

    db.all("DELETE FROM senhas WHERE id_fechadura = ? AND id_pessoa = ?", [idFechadura, idPessoa], (err, result) => {
    if (err) {
        res.status(500).send("ERRO deletando senha");
        throw err;
    } else if (result.length == 0) {
        res.status(401).send("Nenhuma senha desta pessoa cadastrada para esta fechadura!");
    } else {
        res.status(200).send("Senha(s) deletada(s)");
    }
    })
})

// Esse endpoint aqui é utilizado quando alguém quer entrar em um quarto. A fechadura manda o seu próprio ID com a senha que a pessoa escreveu
// Uma decisão que a gente fez é de receber o ID da fechadura em vez do quarto, já que a senha é inserida na própria fechadura, que deve saber seu ID
app.post('/senhas/:idFechadura', async (req, res) => {

    const idFechadura = req.params.idFechadura;
    const valorSenha = req.body?.valorSenha;
    const hoje = 

    db.all("SELECT id FROM senhas WHERE valor_senha = ? AND id_fechadura = ? AND datetime(inicio_validade) <= datetime('now') AND datetime(fim_validade) >= datetime('now')", [valorSenha, idFechadura], (err, result) => {
    if (err) {
        res.status(500).send("ERRO procurando senha");
        throw err;
    } else if (result.length == 0) {
        res.status(401).send("Senha não autorizada ou expirada");
    } else {
        res.status(200).send("Senha autorizada");
    }
    })
})

app.get('/senhas/', async (req, res) => {
    db.all("SELECT * FROM senhas", [], (err, result) => {

        if (err) {
            res.status(500).send("ERRO procurando todas as pessoas");
            throw err;
        } else if (result == 0) {
            res.status(404).send("Não tem pessoas mano");
        } else {
            res.status(200).json(result);
        }
    })
})

app.listen(8082, () => {
    console.log("Serviço de senhas is up!!");  
})

