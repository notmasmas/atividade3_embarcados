const express = require('express');
const sqlite3 = require('sqlite3');
const axios = require('axios');
app = express();

const URL_QUARTOS = 'http://localhost:8081';
const URL_SENHAS = 'http://localhost:8082';

var db = new sqlite3.Database('./dados.db', (err) => {
    if (err) {
        console.log("ERRO BD de acessos");
        throw err;
    }
    console.log("BD de acessos conectado!");
})

db.run(`CREATE TABLE IF NOT EXISTS acessos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_fechadura INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    andar INTEGER NOT NULL,
    data_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    status TEXT NOT NULL CHECK (status IN ('PERMITIDO', 'NEGADO'))
)`, [], (err) => {
    if (err) {
        console.log("ERRO criar table BD acessos");
        throw err;
    }
})

app.use(express.json());

// Função para que o insert esteja dentro de uma promise, para poder usar async/await
function registrarAcesso(idFechadura, numero, status) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO acessos(id_fechadura, numero, status) VALUES (?, ?, ?)",
            [idFechadura, numero, status],
            function (err) { // arrow function não tem this próprio, então usa function comum
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // entrega id que o sqlite gerou para a linha inserida
                }
            }
        )
    })
}

// Tentativa de acesso com o número do quarto e a senha digitada
app.post('/acessos', async (req, res) => {
    const { numero, senha } = req.body;

    if (numero == null || !senha) {
        return res.status(400).send("Número e senha são obrigatórios");
    }

    // 1 - Número do quarto -> fechadura
    let quarto;
    try {
        const resp = await axios.get(`${URL_QUARTOS}/quartos/numero/${numero}`);
        quarto = resp.data; // se der certo (200)
    } catch (err) {
        if (err.response && err.response.status === 404) { // se houve responsta e o status foi 404
            try {
                await registrarAcesso(null, numero, 'NEGADO'); // grava tentativa como negada
            } catch (e) {
                return res.status(500).send("Erro registrando acesso"); // gravação no banco falhou
            }
            return res.status(404).json({ status: 'NEGADO', motivo: 'Quarto não encontrado' }); // tentativa foi registrada, retorna que não deu certo
        }
        return res.status(502).send("Serviço de quartos indisponível"); // outro erro sem ser 404
    }

    // 2 - Tentativa de acesso de fechadura com senha
    let permitida;
    try {
        await axios.post(`${URL_SENHAS}/senhas/${quarto.id_fechadura}`, { valorSenha: senha });
        permitida = true;
    } catch (err) {
        if (err.response && err.response.status === 401) {
            permitida = false;
        } else {
            return res.status(502).send("Serviço de senhas indisponível");
        }
    }

    // 3 - Registra a tentativa e responde
    const status = permitida ? 'PERMITIDO' : 'NEGADO';
    try {
        await registrarAcesso(quarto.id_fechadura, quarto.numero, status);
    } catch (err) {
        return res.status(500).send("Erro registrando acesso");
    }

    res.status(permitida ? 200 : 403).json({ status, id_fechadura: quarto.id_fechadura }); // retorno do post, e fechadura decide se abre a porta só olhando o status 200/403 
})

// Histórico de tentativas
app.get('/acessos', (req, res) => {
    db.all("SELECT * FROM acessos ORDER BY id DESC", [], (err, result) => {
        if (err) {
            res.status(500).send("Erro procurando acessos");
        } else if (result.length == 0) {
            res.status(404).send("Nenhum acesso registrado");
        } else {
            res.status(200).json(result);
        }
    })
})

app.listen(8083, () => {
    console.log("Serviço de acessos is up!!");
})