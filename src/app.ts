import express from "express";
import healthRouter from "./routes/health.routes.js";
import productsRouter from "./routes/products.routes.js";

const app = express();

app.use(express.json());
app.use(healthRouter);
app.use(productsRouter)

export default app;