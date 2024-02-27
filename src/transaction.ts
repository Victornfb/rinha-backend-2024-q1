import { Request, Response } from "express";
import pg from "pg";

class Transactions {
  constructor(private readonly dbPool: pg.Pool) {}

  private isBodyInvalid(valor: any, tipo: any, descricao: any): boolean {
    return (
      !Number.isInteger(valor) ||
      valor < 1 ||
      !["c", "d"].includes(tipo) ||
      descricao === null ||
      descricao.length < 1 ||
      descricao.length > 10
    );
  }

  public async create(req: Request, res: Response): Promise<Response> {
    if (!/^[1-5]$/.test(req.params.id)) {
      return res.status(404).send();
    }

    const { valor, tipo, descricao } = req.body;

    if (this.isBodyInvalid(valor, tipo, descricao)) {
      return res.status(422).send();
    }

    const dbClient = await this.dbPool.connect();

    try {
      await dbClient.query("BEGIN");

      const account = (
        await dbClient.query("SELECT * FROM Account WHERE id = $1 FOR UPDATE", [
          parseInt(req.params.id),
        ])
      ).rows[0];

      if (tipo === "d" && account.saldo - valor < -account.limite) {
        await dbClient.query("ROLLBACK");
        dbClient.release();
        return res.status(422).send();
      }

      const newBalance =
        tipo === "d" ? account.saldo - valor : account.saldo + valor;

      await Promise.all([
        await dbClient.query("UPDATE Account SET saldo = $1 WHERE id = $2", [
          newBalance,
          account.id,
        ]),
        await dbClient.query(
          "INSERT INTO Transaction (account_id, valor, tipo, descricao) VALUES ($1, $2, $3, $4)",
          [account.id, valor, tipo, descricao]
        ),
      ]);

      await dbClient.query("COMMIT");

      dbClient.release();

      return res.status(200).json({
        limite: account.limite,
        saldo: newBalance,
      });
    } catch (err) {
      await dbClient.query("ROLLBACK");
      dbClient.release();
      return res.status(500).send();
    }
  }
}

export default Transactions;
