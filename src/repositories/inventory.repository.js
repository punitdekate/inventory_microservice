"use strict";
import {
    addInventoryReservationsQuery,
    addProductQuery,
    cronQuery,
    deductReservedStockQuery,
    deleteProductByIdQuery,
    getAllProductsQuery,
    getProductByIdQuery,
    getReservedStockForProductAndUserIdQuery,
    releaseReservedStockQuery,
    reserveStockQuery,
    updateProductByIdQuery
} from "../models/inventory.schema.js";
import getDbConnection from "../config/connectMysql.js";
import pkg from "helper-utils";
const { logger } = pkg;

export default class InventoryRepository {
    constructor() {}
    /** List all products stocks */
    async getAllProductsStockFromDb({ stock, limit, page, minStock, maxStock }) {
        let connection;
        try {
            const { query, params } = getAllProductsQuery(stock, minStock, maxStock, (limit = 100), (page = 1));
            connection = await getDbConnection();
            const [rows] = await connection.execute(query, params);
            return rows;
        } catch (error) {
            logger.error(`Error fetching products: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Get stock details of a specific product by ID */
    async getProductStockFromDb({ productId }) {
        let connection;
        try {
            const query = getProductByIdQuery();
            connection = await getDbConnection();
            const [rows] = await connection.execute(query, [productId]);
            return rows;
        } catch (error) {
            logger.error(`Error fetching product: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Update stock details of a specific product by ID */
    async updateProductStockFromDb({ productId, stock, reservedStock }) {
        let connection;
        try {
            const ingeredParams = [];
            if (stock !== undefined && stock !== null && !isNaN(stock) && stock >= 0) ingeredParams.push(stock);
            if (isNaN(reservedStock) === false && reservedStock !== undefined && reservedStock !== null && reservedStock >= 0) ingeredParams.push(reservedStock);
            ingeredParams.push(productId);

            const query = updateProductByIdQuery(productId, stock, reservedStock);

            connection = await getDbConnection();

            await connection.beginTransaction();
            const [rows] = await connection.execute(query, ingeredParams);
            await connection.commit();

            return rows;
        } catch (error) {
            connection.rollback();
            logger.error(`Error updating product: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Add new product stock details */
    async addNewProductFromDb({ productId, stock, reservedStock = 0 }) {
        let connection;
        try {
            const query = addProductQuery();
            connection = await getDbConnection();
            const [rows] = await connection.execute(query, [productId, stock, reservedStock]);
            return rows;
        } catch (error) {
            logger.error(`Error adding product: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Delete product stock details */
    async deleteProductFromDb({ productId }) {
        let connection;
        try {
            const query = deleteProductByIdQuery();
            connection = await getDbConnection();
            await connection.beginTransaction();
            const [rows] = await connection.execute(query, [productId]);
            await connection.commit();
            return rows;
        } catch (error) {
            connection.rollback();
            logger.error(`Error adding product: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Reserve stock */
    async reserveStockFromDb({ productId, quantity, userId }) {
        let connection;
        try {
            const query = reserveStockQuery();
            const addReservationQuery = addInventoryReservationsQuery();

            connection = await getDbConnection();
            connection.beginTransaction();
            const [rows] = await connection.execute(query, [quantity, productId]);
            await connection.execute(addReservationQuery, [productId, userId, quantity]);
            await connection.commit();
            return rows;
        } catch (error) {
            connection.rollback();
            logger.error(`Error reserving stock: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Release reserved stock */
    async releaseReservedStockFromDb({ userId, productId }) {
        let connection;
        try {
            const query = releaseReservedStockQuery();
            connection = await getDbConnection();
            connection.beginTransaction();
            const [rows] = await connection.execute(query, [userId, productId]);
            await connection.commit();
            return rows;
        } catch (error) {
            connection.rollback();
            logger.error(`Error releasing reserved stock: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Deduct stock */
    async deductStockFromDb({ userId, productId }) {
        let connection;
        try {
            const query = deductReservedStockQuery();
            connection = await getDbConnection();
            connection.beginTransaction();
            const [rows] = await connection.execute(query, [userId, productId]);
            await connection.commit();
            return rows;
        } catch (error) {
            connection.rollback();
            logger.error(`Error deducting stock: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getReservedStockForProductAndUserIdFromDb({ productId, userId }) {
        let connection;
        try {
            const query = getReservedStockForProductAndUserIdQuery();
            connection = await getDbConnection();
            const [rows] = await connection.execute(query, [userId, productId]);
            return rows;
        } catch (error) {
            logger.error(`Error fetching reserved stock for product and user: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Cron job to release expired reservations */

    async cronJobToReleaseExpiredReservations() {
        let connection;
        try {
            const query = cronQuery;
            connection = await getDbConnection();
            const [rows] = await connection.execute(query);
            return rows;
        } catch (error) {
            logger.error(`Error in cron job to release expired reservations: ${error}`);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /** Bulk operations */
    updateBulkStockFromDb() {}
    addBulkStockFromDb() {}
    deleteBulkStockFromDb() {}
}
