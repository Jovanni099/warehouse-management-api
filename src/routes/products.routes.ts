import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";

const productsRouter = Router();

type ProductParams = {
  id: string;
};

const productBodySchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  sku: z.string().trim().min(1, "sku is required"),
  description: z.string().trim().optional(),
});

type ProductBody = z.infer<typeof productBodySchema>;

productsRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.get(
  "/:id",
  async (req: Request<ProductParams>, res: Response, next: NextFunction) => {
    try {
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
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.post(
  "/",
  async (
    req: Request<{}, {}, ProductBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = productBodySchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "validation error",
          errors: parsed.error.issues,
        });
      }

      const { name, sku, description } = parsed.data;

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
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.put(
  "/:id",
  async (
    req: Request<ProductParams, {}, ProductBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const parsed = productBodySchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "validation error",
          errors: parsed.error.issues,
        });
      }

      const { name, sku, description } = parsed.data;

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
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.delete(
  "/:id",
  async (req: Request<ProductParams>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

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

      const stockMovementsCount = await prisma.stockMovement.count({
        where: {
          productId: id,
        },
      });

      if (stockMovementsCount > 0) {
        return res.status(409).json({
          message: "cannot delete product with stock movements",
        });
      }

      await prisma.product.delete({
        where: {
          id,
        },
      });

      return res.status(200).json({
        message: "product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default productsRouter;
