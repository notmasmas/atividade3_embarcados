const express = require('express');
const sqlite3 = require('sqlite3');
app = express();

var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log("ERRO BD de pessoas");
        throw err;
    }
    console.log("BD de pessoas conectado!");
})

db.run("CREATE TABLE IF NOT EXISTS pessoas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT NOT NULL, cpf TEXT NOT NULL UNIQUE)", [], (err) => {
    if (err) {
        console.log("ERRO criar table BD pessoas");
        throw err;
    }
})

app.use(express.json());

app.get('/pessoas', (req, res) => {
    db.all("SELECT * FROM pessoas", [], (err, result) => {
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

app.get('/pessoas/:id', (req, res) => {

    db.get("SELECT * FROM pessoas WHERE id=?", req.params.id, (err, result) => {
        if (err) {
            res.status(500).send("ERRO procurando pessoa");
            throw err
        } else if (result == null) {
            res.status(404).send("Pessoa não encontrada");
        } else {
            res.status(200).json(result);
        }
    })
})

app.post('/pessoas', (req, res) => {
    const {nome, email, cpf} = req.body;

    db.run("INSERT INTO pessoas(nome, email, cpf) VALUES (?, ?, ?)", [nome, email, cpf], (err) => {
        if (err) {
            res.status(500).send("ERRO inserindo pessoa")
            throw err;
        } else {
            res.status(201).send("Pessoa cadastrada")
        }
    })
})

app.patch('/pessoas/:id', (req, res) => {
    const {nome, email} = req.body;

    db.run("UPDATE pessoas SET nome=COALESCE(?, nome), email=COALESCE(?, email) WHERE id=?", [nome, email, req.params.id], function(err) {
        if (err) {
            res.status(500).send("ERRO atualizando pessoa");
            throw err;
        } else if (this.changes == 0) {
            res.status(404).send("Pessoa não foi encontrada");
        } else {
            res.status(200).send("Pessoa atualizada");
        }
    })
})

app.delete('/pessoas/:id', (req, res) => {
    db.run("DELETE FROM pessoas WHERE id=?", req.params.id, function(err) {
        if (err) {
            res.status(500).send("ERRO deletando pessoa");
            throw err;
        } else if (this.changes == 0) {
            res.status(404).send("Pessoa não foi encontrada");
        } else {
            res.status(200).send("Pessoa deletada");
        }
    })
})

app.listen(8080, () => {
    console.log("Serviço de pessoas is up!!");  
})