import pg from "pg";

class Database {
  private maxPoolQuantity = 50;

  constructor() {
    this.maxPoolQuantity = parseInt(process.env.DB_POOL_QUANTITY || "50");
  }

  public async warmUp(dbPool: pg.Pool): Promise<void> {
    const connectionsArray = Array.from(
      {
        length: this.maxPoolQuantity,
      },
      () => dbPool.connect()
    );

    const connections = await Promise.all(connectionsArray);

    await connections.forEach((connection) => connection.release());
  }

  public getPool(): pg.Pool {
    return new pg.Pool({
      user: "admin",
      password: "123",
      database: "rinha",
      host: process.env.DB_HOSTNAME || "127.0.0.1",
      port: 5432,
      idleTimeoutMillis: 0,
      max: this.maxPoolQuantity,
    });
  }
}

export default Database;
