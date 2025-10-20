"use strict";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../../constants.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../../errorMessages.js";
import InventoryRepository from "../repositories/inventory.repository.js";
import pkg from "helper-utils-library";
const { logger, failureResponse, successResponse, BadRequest, Unauthorized, ResourceNotFound, InternalServerError } = pkg;

export default class InventoryController {
    constructor() {
        this.inventoryRepository = new InventoryRepository();
    }

    /** List all products stocks */
    async getAllProductsStock(req, res, next) {
        try {
            let { stock, limit = DEFAULT_LIMIT, page = DEFAULT_PAGE, minStock, maxStock } = req.query;
            limit = parseInt(limit);
            page = parseInt(page);
            if (isNaN(limit) || limit <= 0) limit = DEFAULT_LIMIT;
            if (isNaN(page) || page <= 0) page = DEFAULT_PAGE;
            if (stock !== undefined) stock = parseInt(stock);
            if (minStock !== undefined) minStock = parseInt(minStock);
            if (maxStock !== undefined) maxStock = parseInt(maxStock);
            if ((stock !== undefined && isNaN(stock)) || (minStock !== undefined && isNaN(minStock)) || (maxStock !== undefined && isNaN(maxStock))) {
                return failureResponse(res, ERROR_MESSAGES.INVALID_STOCK_VALUE, 400);
            }
            const response = await this.inventoryRepository.getAllProductsStockFromDb({ stock, limit, page, minStock, maxStock });
            return successResponse(res, response, 200, { page, limit });
        } catch (error) {
            logger.error(`Error fetching products: ${error}`);
            next(error);
        }
    }

    /** Get stock details of a specific product by ID */
    async getProductStock(req, res, next) {
        try {
            const productId = req.params.productId;
            if (!productId) {
                return failureResponse(res, ERROR_MESSAGES.PRODUCT_ID_REQUIRED, 400);
            }
            const response = await this.inventoryRepository.getProductStockFromDb({ productId });
            if (response.length === 0) {
                return failureResponse(res, new ResourceNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
            }
            return successResponse(res, response[0]);
        } catch (error) {
            logger.error(`Error fetching product: ${error}`);
            next(error);
        }
    }

    /** Update stock details of a specific product by ID */
    async updateProductStock(req, res, next) {
        try {
            const productId = req.params.productId;
            const { stock, reservedStock } = req.body;
            if (!productId) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.PRODUCT_ID_REQUIRED), 400);
            }
            if (stock && isNaN(parseInt(stock)) && parseInt(stock) < 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.INVALID_STOCK_OR_RESERVED_STOCK), 400);
            }

            if (reservedStock && isNaN(parseInt(reservedStock)) && parseInt(reservedStock) < 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.INVALID_STOCK_OR_RESERVED_STOCK), 400);
            }

            if (!stock && !reservedStock) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.STOCK_OR_RESERVED_STOCK_REQUIRED), 400);
            }

            const response = await this.inventoryRepository.updateProductStockFromDb({ productId, stock: parseInt(stock), reservedStock: parseInt(reservedStock) });
            if (response.affectedRows === 0) {
                return failureResponse(res, ERROR_MESSAGES.FAILED_TO_UPDATE_PRODUCT, 500);
            }
            const productRes = await this.inventoryRepository.getProductStockFromDb({ productId });
            return successResponse(res, productRes[0], 200);
        } catch (error) {
            logger.error(`Error updating product: ${error}`);
            next(error);
        }
    }

    /** Add new product stock details */
    async addNewProduct(req, res, next) {
        try {
            const { productId, stock, reservedStock = 0 } = req.body;
            if (!productId || stock === undefined || isNaN(parseInt(stock)) || parseInt(stock) < 0 || isNaN(parseInt(reservedStock)) || parseInt(reservedStock) < 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.INVALID_PRODUCT_DATA), 400);
            }
            const response = await this.inventoryRepository.addNewProductFromDb({ productId, stock: parseInt(stock), reservedStock: parseInt(reservedStock) });
            if (response?.affectedRows === 0) {
                failureResponse(res, new InternalServerError(ERROR_MESSAGES.FAILED_TO_ADD_PRODUCT), 500);
            }
            const productRes = await this.inventoryRepository.getProductStockFromDb({ productId });
            if (productRes.length === 0) {
                return failureResponse(res, new ResourceNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
            }
            return successResponse(res, productRes[0], 201);
        } catch (error) {
            logger.error(`Error adding product: ${error}`);
            next(error);
        }
    }

    /** Delete product stock details */
    async deleteProduct(req, res, next) {
        try {
            const productId = req.params.productId;
            if (!productId) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.PRODUCT_ID_REQUIRED), 400);
            }
            const response = await this.inventoryRepository.deleteProductFromDb({ productId });
            if (response.affectedRows === 0) {
                return failureResponse(res, new InternalServerError(ERROR_MESSAGES.FAILED_TO_DELETE_PRODUCT), 500);
            }
            return successResponse(res, {}, 204);
        } catch (error) {
            logger.error(`Error deleting product: ${error}`);
            next(error);
        }
    }

    /** Release reserved stock*/
    async releaseReservedStock(req, res, next) {
        try {
            const productId = req.params.productId;
            if (!productId) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.PRODUCT_ID_REQUIRED_LOWERCASE), 400);
            }
            const userId = req.userId; // Assuming userId is available in req object
            if (!userId) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.USER_ID_REQUIRED_RELEASE), 400);
            }

            // Check if product exists
            const product = await this.inventoryRepository.getProductStockFromDb({ productId });
            if (product.length === 0) {
                return failureResponse(res, new ResourceNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
            }

            const response = await this.inventoryRepository.releaseReservedStockFromDb({ userId, productId });
            if (response.affectedRows === 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.FAILED_TO_RELEASE_RESERVED_STOCK), 400);
            }
            return successResponse(res, { status: SUCCESS_MESSAGES.RESERVED_STOCK_RELEASED, success: true }, 200);
        } catch (error) {
            logger.error(`Error releasing reserved stock: ${error}`);
            next(error);
        }
    }

    /** Reserve stock */
    async reserveStock(req, res, next) {
        try {
            const { quantity } = req.body;
            const productId = req.params.productId;
            const userId = req.userId; // Assuming userId is available in req object
            if (!productId || quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.INVALID_PRODUCT_ID_OR_QUANTITY), 400);
            }
            // Check if product exists
            const product = await this.inventoryRepository.getProductStockFromDb({ productId });
            if (product.length === 0) {
                return failureResponse(res, new ResourceNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
            }
            const response = await this.inventoryRepository.reserveStockFromDb({ productId, quantity: parseInt(quantity), userId });
            if (response.affectedRows === 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.FAILED_TO_RESERVE_STOCK), 400);
            }
            return successResponse(res, { status: SUCCESS_MESSAGES.STOCK_RESERVED, success: true }, 201);
        } catch (error) {
            logger.error(`Error reserving stock: ${error}`);
            next(error);
        }
    }

    /** Deduct stock */
    async deductStock(req, res, next) {
        try {
            const productId = req.params.productId;
            if (!productId) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.PRODUCT_ID_REQUIRED_LOWERCASE), 400);
            }

            const userId = req.userI; // Assuming userId is available in req object
            if (!userId) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.USER_ID_REQUIRED_DEDUCT), 400);
            }

            // Check if product exists
            const product = await this.inventoryRepository.getProductStockFromDb({ productId });
            if (product.length === 0) {
                return failureResponse(res, new ResourceNotFound(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
            }
            const response = await this.inventoryRepository.deductStockFromDb({ userId, productId });
            if (response.affectedRows === 0) {
                return failureResponse(res, new BadRequest(ERROR_MESSAGES.FAILED_TO_DEDUCT_STOCK), 400);
            }
            return successResponse(res, { status: SUCCESS_MESSAGES.STOCK_DEDUCTED, success: true }, 200);
        } catch (error) {
            logger.error(`Error deducting stock: ${error}`);
            next(error);
        }
    }

    /** Cron job to release expired reservations */
    async cronQuery(req, res, next) {
        try {
            const response = await this.inventoryRepository.cronJobToReleaseExpiredReservations();
            return successResponse(res, { status: SUCCESS_MESSAGES.CRON_JOB_EXECUTED, success: true, details: response });
        } catch (error) {
            logger.error(`Error executing cron job: ${error}`);
            next(error);
        }
    }

    /** Bulk operations */
    async updateBulkStock(req, res, next) {
        return failureResponse(res, ERROR_MESSAGES.NOT_IMPLEMENTED, 500);
    }

    async addBulkStock(req, res, next) {
        return failureResponse(res, ERROR_MESSAGES.NOT_IMPLEMENTED, 500);
    }

    async deleteBulkStock(req, res, next) {
        return failureResponse(res, ERROR_MESSAGES.NOT_IMPLEMENTED, 500);
    }
}
