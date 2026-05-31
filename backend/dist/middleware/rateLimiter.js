"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLimiter = exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 20,
    message: { error: 'Trop de tentatives de paiement.' },
});
//# sourceMappingURL=rateLimiter.js.map