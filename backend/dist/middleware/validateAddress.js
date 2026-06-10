"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddress = validateAddress;
const POSTAL_PATTERNS = {
    FR: /^\d{5}$/,
    BE: /^\d{4}$/,
    CH: /^\d{4}$/,
    LU: /^\d{4}$/,
    MA: /^\d{5}$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
};
function validateAddress(req, res, next) {
    const { address } = req.body;
    if (!address)
        return next(); // adresse optionnelle
    const errors = [];
    const a = address;
    if (!a.firstName?.trim())
        errors.push('Prénom requis');
    if (!a.lastName?.trim())
        errors.push('Nom requis');
    if (!a.street?.trim())
        errors.push('Adresse requise');
    if (!a.city?.trim())
        errors.push('Ville requise');
    if (!a.postalCode?.trim())
        errors.push('Code postal requis');
    if (!a.country?.trim())
        errors.push('Pays requis');
    if (a.country && a.postalCode && POSTAL_PATTERNS[a.country]) {
        const pattern = POSTAL_PATTERNS[a.country];
        if (!pattern.test(a.postalCode.trim())) {
            errors.push(`Code postal invalide pour ${a.country}`);
        }
    }
    if (errors.length)
        return res.status(400).json({ error: errors.join(' · ') });
    next();
}
//# sourceMappingURL=validateAddress.js.map