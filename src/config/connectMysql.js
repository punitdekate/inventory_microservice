"use strict";
import mysql from "mysql2/promise";
import { createInventoryReservations, createInventoryTableQuery } from "../models/inventory.schema.js";
import pkg from "helper-utils";
const { logger } = pkg;

const pool = mysql.createPool({
    // host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    // waitForConnections: true,
    // ssl: { rejectUnauthorized: false },
    // connectionLimit: 10,
    // queueLimit: 0
    uri: process.env.NODE_ENV === "production" ? process.env.CONNECTION_STRING_PROD : process.env.CONNECTION_STRING_LOCAL,
    ssl: { rejectUnauthorized: false }
});

const getDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query(createInventoryTableQuery);
        await connection.query(createInventoryReservations);
        return connection;
    } catch (error) {
        logger.error(`Error getting database connection: ${error}`);
        throw error;
    }
};

export default getDbConnection;
