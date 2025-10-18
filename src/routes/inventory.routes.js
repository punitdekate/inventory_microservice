"use strict";
import express from "express";
import InventoryController from "../controllers/inventory.controller.js";

const inventoryRouter = express.Router();
const inventoryController = new InventoryController();

inventoryRouter.get("/", (req, res, next) => {
    inventoryController.getAllProductsStock(req, res, next);
});

inventoryRouter.get("/:productId", (req, res, next) => {
    inventoryController.getProductStock(req, res, next);
});

inventoryRouter.post("/", (req, res, next) => {
    inventoryController.addNewProduct(req, res, next);
});

inventoryRouter.put("/:productId", (req, res, next) => {
    inventoryController.updateProductStock(req, res, next);
});

inventoryRouter.delete("/:productId", (req, res, next) => {
    inventoryController.deleteProduct(req, res, next);
});

inventoryRouter.post("/:productId/reserve", (req, res, next) => {
    inventoryController.reserveStock(req, res, next);
});

inventoryRouter.post("/:productId/release", (req, res, next) => {
    inventoryController.releaseReservedStock(req, res, next);
});

inventoryRouter.post("/:productId/deduct", (req, res, next) => {
    inventoryController.deductStock(req, res, next);
});

inventoryRouter.post("/bulk", (req, res, next) => {
    inventoryController.addBulkStock(req, res, next);
});

inventoryRouter.put("/bulk", (req, res, next) => {
    inventoryController.updateBulkStock(req, res, next);
});

inventoryRouter.delete("/bulk", (req, res, next) => {
    inventoryController.deleteBulkStock(req, res, next);
});

inventoryRouter.post("/cron/release-expired", (req, res, next) => {
    inventoryController.cronQuery(req, res, next);
});

export default inventoryRouter;
