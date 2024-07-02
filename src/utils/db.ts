import pg from "pg";

const postgresSingleton = () => {
  return new pg.Pool({
    host: "localhost",
    port: 5432,
    database: "dreamhacker",
    user: "dreamhacker-admin",
    password: "thuan286",
    query_timeout: 2000,
  });
};

declare global {
  var postgres: ReturnType<typeof postgresSingleton>;
}

const postgres = globalThis.postgres ?? postgresSingleton();

postgres.on("error", (err) => {
  console.log("Something bad happened with database!!!", err.stack);
});

export default postgres;

if (process.env.NODE_ENV !== "production") globalThis.postgres = postgres;
