"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const authReq = req;
    const token = authReq.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Non autorisé' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        authReq.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token invalide' });
    }
};
exports.authenticate = authenticate;
const isAdmin = (req, res, next) => {
    const authReq = req;
    if (authReq.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accès refusé' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth.js.map