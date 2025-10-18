/**
 * inventory.schema.js
 * @description :: sequelize model of database table inventory
 * @author :: Punit Dekate
 */
const createInventoryTableQuery = `
CREATE TABLE IF NOT EXISTS inventory(
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    productId varchar(255) NOT NULL,
    stock INT NOT NULL,
    reservedStock INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createInventoryReservations = `
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    productId VARCHAR(200) NOT NULL,
    userId VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    expiresAt DATETIME NOT NULL,   -- Auto release after this
    status ENUM('reserved', 'released', 'committed') DEFAULT 'reserved',
    FOREIGN KEY (productId) REFERENCES inventory(productId),
    UNIQUE KEY unique_reservation (productId, userId)
);
`;

const addInventoryReservationsQuery = () => `
    INSERT INTO inventory_reservations (productId, userId, quantity, expiresAt, status)
    VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'reserved')
    ON DUPLICATE KEY UPDATE
        quantity = VALUES(quantity),
        status = 'reserved',
        expiresAt = DATE_ADD(NOW(), INTERVAL 15 MINUTE);
`;

const addProductQuery = () => `
    INSERT INTO inventory(productId,stock, reservedStock) values (?, ?, ?);
`;

const getAllProductsQuery = (stock, minStock, maxStock, limit = 100, page = 1) => {
    let query = `SELECT * FROM inventory`;
    const params = [];

    if (stock !== undefined && stock !== null) {
        query += ` WHERE stock = ?`;
        params.push(stock);
    } else if (minStock !== undefined && maxStock !== undefined) {
        query += ` WHERE stock BETWEEN ? AND ?`;
        params.push(minStock, maxStock);
    } else if (minStock !== undefined) {
        query += ` WHERE stock >= ?`;
        params.push(minStock);
    } else if (maxStock !== undefined) {
        query += ` WHERE stock <= ?`;
        params.push(maxStock);
    }

    // ✅ Numeric interpolation is safe
    const limitNum = Number(limit) || 100;
    const offsetNum = (page - 1) * limitNum;

    query += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;

    return { query, params };
};

const getProductByIdQuery = () => `
    SELECT * FROM inventory WHERE productId= ?;
`;

const updateProductByIdQuery = (productId, stock, reservedStock) => {
    let query = ` UPDATE inventory SET `;
    if (stock !== undefined && stock !== null && !isNaN(stock) && stock >= 0) {
        query = query + ` stock = ? `;
    }
    if (isNaN(reservedStock) === false && reservedStock !== undefined && reservedStock !== null && reservedStock >= 0) {
        query = query + (stock ? `, reservedStock = ? ` : ` reservedStock = ? `);
    }
    query = query + ` WHERE productId = ?; `;
    return query;
};

const deleteProductByIdQuery = productId => `
    DELETE FROM inventory WHERE productId= ?;
`;

const releaseReservedStockQuery = () => `
    UPDATE inventory inv
    JOIN inventory_reservations r ON inv.productId = r.productId
    SET inv.reservedStock = GREATEST(inv.reservedStock - r.quantity, 0), 
        r.status = 'released'
    WHERE r.status = 'reserved' AND r.expiresAt > NOW() AND r.userId = ? AND r.productId = ?;
`;

const reserveStockQuery = () => `
    UPDATE inventory SET reservedStock = reservedStock + ? WHERE productId = ? AND (stock - reservedStock) >= 1;
`;

const deductReservedStockQuery = () => `
    UPDATE inventory inv
    JOIN inventory_reservations r ON inv.productId = r.productId
    SET 
        inv.stock = GREATEST(inv.stock - r.quantity, 0),
        inv.reservedStock = GREATEST(inv.reservedStock - r.quantity, 0),
        r.status = 'committed'
    WHERE 
        r.status = 'reserved' 
        AND r.expiresAt > NOW() 
        AND r.userId = ? 
        AND r.productId = ?
        AND r.quantity > 0;
`;

const getReservedStockForProductAndUserIdQuery = () => `
    SELECT * FROM inventory_reservations WHERE userId = ? AND productId = ? AND status = 'reserved';
`;

const cronQuery = `
    UPDATE inventory inv 
    JOIN inventory_reservations r ON inv.productId = r.productId
    SET inv.reservedStock = GREATEST(inv.reservedStock - r.quantity, 0), 
        r.status = 'released'
    WHERE r.status = 'reserved' AND r.expiresAt < NOW();
`;

const updateBulkProductsQuery = products => {
    let query = "UPDATE inventory SET stock = CASE productId ";
    products.forEach(({ productId, stock, reservedStock }) => {
        query += `WHEN '${productId}' THEN ${stock} `;
    });
    query += "END, reservedStock = CASE productId ";
    products.forEach(({ productId, stock, reservedStock }) => {
        query += `WHEN '${productId}' THEN ${reservedStock} `;
    });
    query += "END WHERE productId IN (";
    products.forEach(({ productId }) => {
        query += `'${productId}',`;
    });
    query = query.slice(0, -1); // Remove last comma
    query += ");";
    return query;
};

const deleteBulkProductsQuery = productIds => `
    DELETE FROM inventory WHERE productId IN (${productIds.map(id => `'${id}'`).join(",")});
`;

const addBulkProductsQuery = products => {
    let query = "INSERT INTO inventory (productId, stock, reservedStock) VALUES ";
    products.forEach(({ productId, stock, reservedStock = 0 }) => {
        query += `('${productId}', ${stock}, ${reservedStock}),`;
    });
    query = query.slice(0, -1);
    query += ";";
    return query;
};

export {
    createInventoryTableQuery,
    createInventoryReservations,
    addInventoryReservationsQuery,
    addProductQuery,
    getAllProductsQuery,
    getProductByIdQuery,
    updateProductByIdQuery,
    deleteProductByIdQuery,
    updateBulkProductsQuery,
    deleteBulkProductsQuery,
    addBulkProductsQuery,
    reserveStockQuery,
    releaseReservedStockQuery,
    deductReservedStockQuery,
    getReservedStockForProductAndUserIdQuery,
    cronQuery
};
