import express from "express";
import healthRouter from "./routes/health.routes.js";
import productsRouter from "./routes/products.routes.js";
import warehousesRouter from "./routes/warehouses.routes.js";
import stockMovementsRouter from "./routes/stock-movements.routes.js";
import stockBalanceRouter from "./routes/stock-balance.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

app.use(express.json());

app.use(healthRouter);
app.use("/products", productsRouter);
app.use("/warehouses", warehousesRouter);
app.use("/stock-movements", stockMovementsRouter)
app.use("/stock-balance", stockBalanceRouter);
app.use(errorHandler)

export default app;