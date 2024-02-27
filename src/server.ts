import express, { Router } from "express";

import Database from "./db";
import Statements from "./statement";
import Transactions from "./transaction";

async function bootstrap() {
  const app = express();

  const route = Router();

  app.use(express.json());

  app.use(route);

  const database = new Database();
  const dbPool = database.getPool();
  await database.warmUp(dbPool);

  const transactions = new Transactions(dbPool);
  const statements = new Statements(dbPool);

  route.post(
    "/clientes/:id/transacoes",
    transactions.create.bind(transactions)
  );

  route.get("/clientes/:id/extrato", statements.get.bind(statements));

  app.listen(3333, () => {
    console.log("Server running on port 3333");
  });
}

bootstrap();
