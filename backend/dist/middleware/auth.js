"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Non autorisé' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token invalide' });
    }
};
exports.authenticate = authenticate;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN')
        return res.status(403).json({ error: 'Accès refusé' });
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth.js.map