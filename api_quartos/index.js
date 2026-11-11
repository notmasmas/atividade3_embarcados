const express = require('express');
const sqlite3 = require('sqlite3');
app = express();

var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log("ERRO BD de quartos");
        throw err;
    }
    console.log("BD de quartos conectado!");
})

db.run("CREATE TABLE IF NOT EXISTS quartos (id INTEGER PRIMARY KEY AUTOINCREMENT, id_fechadura INTEGER NOT NULL UNIQUE, numero INTEGER NOT NULL UNIQUE, andar INTEGER NOT NULL)", [], (err) => {
    if (err) {
        console.log("ERRO criar table BD quartos");
        throw err;
    }
})

app.use(express.json());

app.get('/quartos', (req, res) => {
    db.all("SELECT * FROM quartos", [], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("ERRO procurando todas os quartos");
        } else if (result.length == 0) {
            res.status(404).send("Não tem quartos vey...");
        } else {
            res.status(200).json(result);
        }
    })
})

app.get('/quartos/:id', (req, res) => {

    db.get("SELECT * FROM quartos WHERE id=?", req.params.id, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("ERRO procurando quarto");
        } else if (result == null) {
            res.status(404).send("Quarto não encontrado");
        } else {
            res.status(200).json(result);
        }
    })
})

app.post('/quartos', (req, res) => {
    const {id_fechadura, numero, andar} = req.body;

    db.run("INSERT INTO quartos(id_fechadura, numero, andar) VALUES (?, ?, ?)", [id_fechadura, numero, andar], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("ERRO inserindo quarto")
        } else {
            res.status(201).send("Quarto cadastrado")
        }
    })
})

app.patch('/quartos/:id', (req, res) => {
    const {id_fechadura, numero, andar} = req.body;

    db.run("UPDATE quartos SET id_fechadura=COALESCE(?, id_fechadura), numero=COALESCE(?, numero), andar=COALESCE(?, andar) WHERE id=?", [id_fechadura, numero, andar, req.params.id], function(err) {
        if (err) {
            console.error(err);
            res.status(500).send("ERRO atualizando quarto");
        } else if (this.changes == 0) {
            res.status(404).send("Quarto não foi encontrado");
        } else {
            res.status(200).send("Quarto atualizado");
        }
    })
})

app.delete('/quartos/:id', (req, res) => {
    db.run("DELETE FROM quartos WHERE id=?", req.params.id, function(err) {
        if (err) {
            console.error(err);
            res.status(500).send("ERRO deletando quarto");
        } else if (this.changes == 0) {
            res.status(404).send("Quarto não foi encontrado");
        } else {
            res.status(200).send("Quarto deletado");
        }
    })
})

app.get('/quartos/fechadura/:id_fechadura', (req, res) => {
    db.all("SELECT * FROM quartos WHERE id_fechadura=?",
        [req.params.id_fechadura],
        (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("ERRO procurando quarto pela fechadura");
        } else if (result.length == 0) {
            res.status(404).send("Nenhum quarto associado a essa fechadura... vixe");
        } else {
            res.status(200).json(result);
        }
    })
})

app.get('/quartos/numero/:numero', (req, res) => {
    db.get("SELECT * FROM quartos WHERE numero=?", [req.params.numero], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send("Erro procurando quarto pelo número");
        } else if (result == null) {
            res.status(404).send("Quarto não encontrado");
        } else {
            res.status(200).json(result);
        }
    })
})

app.listen(8081, () => {
    console.log("Serviço de quarto is up!!");  
})