import "dotenv/config";
import express from "express";
import cors from "cors";

import { conectarBanco, livrosCollection } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    mensagem: "API de livros ativa.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/api/livros", async (_req, res) => {
  try {
    const livros = await livrosCollection()
      .find({}, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .toArray();

    res.json(livros);
  } catch {
    res.status(500).json({
      erro: "Erro ao listar livros.",
    });
  }
});

app.get("/api/livros/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({
      erro: "ID inválido.",
    });
  }

  try {
    const livro = await livrosCollection().findOne(
      { id },
      { projection: { _id: 0 } },
    );

    if (!livro) {
      return res.status(404).json({
        erro: "Livro não encontrado.",
      });
    }

    res.json(livro);
  } catch {
    res.status(500).json({
      erro: "Erro ao buscar livro.",
    });
  }
});

app.post("/api/livros", async (req, res) => {
  const { titulo, autor, categoria, ano, status, descricao } = req.body;

  if (!titulo || !autor || !categoria || !ano || !status) {
    return res.status(400).json({
      erro: "Dados obrigatórios ausentes.",
    });
  }

  const novoLivro = {
    id: Date.now(),
    titulo,
    autor,
    categoria,
    ano,
    status,
    descricao,
  };

  try {
    await livrosCollection().insertOne(novoLivro);
    res.status(201).json(novoLivro);
  } catch {
    res.status(500).json({
      erro: "Erro ao criar livro.",
    });
  }
});

app.patch("/api/livros/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({
      erro: "ID inválido.",
    });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      erro: "Status é obrigatório.",
    });
  }

  try {
    const resultado = await livrosCollection().findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after", projection: { _id: 0 } },
    );

    if (!resultado) {
      return res.status(404).json({
        erro: "Livro não encontrado.",
      });
    }

    res.json(resultado);
  } catch {
    res.status(500).json({
      erro: "Erro ao atualizar livro.",
    });
  }
});

app.delete("/api/livros/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({
      erro: "ID inválido.",
    });
  }

  try {
    const resultado = await livrosCollection().deleteOne({ id });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({
        erro: "Livro não encontrado.",
      });
    }

    res.status(204).send();
  } catch {
    res.status(500).json({
      erro: "Erro ao excluir livro.",
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

await conectarBanco();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API em http://localhost:${PORT}`);
});