"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Erreur interne du serveur';
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err.stack);
    }
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    return err;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map