import { Router, Request, Response } from "express";

const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

export default healthRouter;