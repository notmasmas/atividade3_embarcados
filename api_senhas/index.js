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

app.post('/senhas', async (req, res) => {

    const apiData = await axios.get(`http:localhost:8081/quartos/${req.idQuarto}`);
    
    if (apiData?.idFechadura == null) {
        res.status(400).send('Está fechadura não existe');
    }

    valorSenha = req.valorSenha;
    idUsuario = req.idUsuario;

    if (req.inicioValidade > req.fimValidade) {
        res.status(400).send('Fim da validade não pode ser antes que o começo dela');
    }

        db.run("INSERT INTO senhas(valor_senha, id_usuario, id_fechadura, inicio_validade, fim_validade) VALUES (?, ?, ?, ?)", [valorSenha, idUsuario, idFechadura, inicioValidade, fimValidade], (err) => {
        if (err) {
            res.status(500).send("ERRO inserindo senha")
            throw err;
        } else {
            res.status(201).send("Senha cadastrada")
        }
    })
});

app.listen(8082, () => {
    console.log("Serviço de senhas is up!!");  
})

