import "dotenv/config";
import express from "express";
import cors from "cors";

import { conectarBanco, chamadosCollection } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    mensagem: "API de chamados ativa.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/api/chamados", async (_req, res) => {
  try {
    const chamados = await chamadosCollection()
      .find({}, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .toArray();

    res.json(chamados);
  } catch {
    res.status(500).json({
      erro: "Erro ao listar chamados.",
    });
  }
});

app.get("/api/chamados/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({
      erro: "ID inválido.",
    });
  }

  const chamado = await chamadosCollection().findOne(
    { id },
    { projection: { _id: 0 } },
  );

  if (!chamado) {
    return res.status(404).json({
      erro: "Chamado não encontrado.",
    });
  }

  res.json(chamado);
});

app.post("/api/chamados", async (req, res) => {
  const { titulo, descricao, prioridade, status, responsavel } = req.body;

  if (!titulo || !descricao || !prioridade || !status) {
    return res.status(400).json({
      erro: "Dados obrigatórios ausentes.",
    });
  }

  const novoChamado = {
    id: Date.now(),
    titulo,
    descricao,
    prioridade,
    status,
    responsavel,
    criadoEm: new Date().toISOString().slice(0, 10),
  };

  await chamadosCollection().insertOne(novoChamado);
  res.status(201).json(novoChamado);
});

const PORT = Number(process.env.PORT) || 3000;

await conectarBanco();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API em http://localhost:${PORT}`);
});
