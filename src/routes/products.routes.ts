import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";

const productsRouter = Router();

productsRouter.get("/", async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json(products);
});

export default productsRouter;