import express from "express";
import healthRouter from "./routes/health.routes.js";
import productsRouter from "./routes/products.routes.js";
import warehousesRouter from "./routes/warehouses.routes.js";
import stockMovementsRouter from "./routes/stock-movements.routes.js";

const app = express();

app.use(express.json());

app.use(healthRouter);
app.use("/products", productsRouter);
app.use("/warehouses", warehousesRouter);
app.use("/stock-movements", stockMovementsRouter);


export default app;