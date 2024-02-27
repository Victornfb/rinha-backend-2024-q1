import { Request, Response } from "express";
import pg from "pg";

class Statements {
  constructor(private readonly dbPool: pg.Pool) {}

  public async get(req: Request, res: Response): Promise<unknown> {
    if (!/^[1-5]$/.test(req.params.id)) {
      return res.status(404).send();
    }

    try {
      const [accountResult, transactions] = await Promise.all([
        this.dbPool.query("SELECT * FROM Account WHERE id = $1", [
          parseInt(req.params.id),
        ]),
        this.dbPool.query(
          "SELECT valor, tipo, descricao, realizada_em FROM Transaction WHERE account_id = $1 ORDER BY realizada_em DESC LIMIT 10",
          [parseInt(req.params.id)]
        ),
      ]);

      const account = accountResult.rows[0];

      return res.status(200).json({
        saldo: {
          total: account.saldo,
          data_extrato: new Date(),
          limite: account.limite,
        },
        ultimas_transacoes: transactions.rows,
      });
    } catch (err) {
      return res.status(500).send();
    }
  }
}

export default Statements;
