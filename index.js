"use strict";
import "dotenv/config";
import express from "express";
import cron from "node-cron";
import bodyParser from "body-parser";
import inventoryRouter from "./src/routes/inventory.routes.js";
import helmet from "helmet";
import expressRateLimiter from "express-rate-limit";
import pkg from "helper-utils";
import { requestContextMiddleware } from "./src/middlewares/requestContext.middleware.js";
const { logger, errorHandler } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(
    expressRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again later."
    })
);

app.use(requestContextMiddleware);

cron.schedule("*/15 * * * *", () => {
    fetch(`http://localhost:${PORT}/api/inventory/cron/release-expired`, {
        method: "POST"
    })
        .then(() => {
            logger.info(`Running released stocks every 15 minutes at ${new Date().toLocaleString()}`);
        })
        .catch(err => console.error("Error calling cron endpoint:", err));
});

app.use(bodyParser.json());

app.get("/api/inventory/health", (req, res, next) => {
    res.status(200).json({ status: "running", success: true });
});

app.use("/api/inventory", inventoryRouter);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

/** Error handler needs to be added here*/

app.use(errorHandler);
