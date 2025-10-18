// Error messages for inventory microservice
export const ERROR_MESSAGES = {
    // Validation errors
    INVALID_STOCK_VALUE: "Invalid stock, minStock or maxStock value",
    PRODUCT_ID_REQUIRED: "Product ID is required",
    PRODUCT_ID_REQUIRED_LOWERCASE: "Product id is required",
    INVALID_STOCK_OR_RESERVED_STOCK: "Invalid stock or reservedStock value",
    STOCK_OR_RESERVED_STOCK_REQUIRED: "At least one of stock or reservedStock must be provided",
    INVALID_PRODUCT_DATA: "Invalid productId, stock or reservedStock value",
    INVALID_PRODUCT_ID_OR_QUANTITY: "Invalid product id or quantity",
    USER_ID_REQUIRED_RELEASE: "User ID is required to release reserved stock",
    USER_ID_REQUIRED_DEDUCT: "User ID is required to deduct stock",

    // Not found errors
    PRODUCT_NOT_FOUND: "Product not found",

    // Operation failure errors
    FAILED_TO_UPDATE_PRODUCT: "Failed to update product",
    FAILED_TO_ADD_PRODUCT: "Failed to add product",
    FAILED_TO_DELETE_PRODUCT: "Failed to delete product",
    FAILED_TO_RELEASE_RESERVED_STOCK: "Failed to release reserved stock. Check if reserved stock exists.",
    FAILED_TO_RESERVE_STOCK: "Failed to reserve stock. Check if sufficient stock is available.",
    FAILED_TO_DEDUCT_STOCK: "Failed to deduct stock. Check if reserved stock exists.",

    // Not implemented errors
    NOT_IMPLEMENTED: "Not implemented yet"
};

export const SUCCESS_MESSAGES = {
    PRODUCT_UPDATED: "Product updated successfully",
    PRODUCT_ADDED: "Product added successfully",
    PRODUCT_DELETED: "Product deleted successfully",
    RESERVED_STOCK_RELEASED: "Reserved stock released successfully",
    STOCK_RESERVED: "Stock reserved successfully",
    STOCK_DEDUCTED: "Stock deducted successfully",
    CRON_JOB_EXECUTED: "Cron job executed successfully"
};
