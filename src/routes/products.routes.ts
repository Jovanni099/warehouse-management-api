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

productsRouter.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return res.status(404).json({
      message: "product not found",
    });
  }

  return res.status(200).json(product);
});

productsRouter.post("/", async (req: Request, res: Response) => {
  const { name, sku, description } = req.body;

  if (!name || !sku) {
    return res.status(400).json({
      message: "name and sku are required",
    });
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      sku,
    },
  });

  if (existingProduct) {
    return res.status(409).json({
      message: "product with this sku already exists",
    });
  }

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      description,
    },
  });

  return res.status(201).json(product);
});

productsRouter.put("/:id", async (req: Request<{id:string}>, res: Response) => {
  const { id } = req.params;
  const { name, sku, description } = req.body;

  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    return res.status(404).json({
      message: "product not found",
    });
  }

  if (!name || !sku) {
    return res.status(400).json({
      message: "name and sku are required",
    });
  }

  const productWithSameSku = await prisma.product.findUnique({
    where: {
      sku,
    },
  });

  if (productWithSameSku && productWithSameSku.id !== id) {
    return res.status(409).json({
      message: "product with this sku already exists",
    });
  }

  const updatedProduct = await prisma.product.update({
    where: {
      id,
    },
    data: {
      name,
      sku,
      description,
    },
  });

  return res.status(200).json(updatedProduct);
});


export default productsRouter;