"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const base = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PrimeShop</title>
<style>
  body{margin:0;padding:0;background:#0a0c10;font-family:Inter,system-ui,sans-serif;color:#f0f4ff}
  .wrap{max-width:560px;margin:40px auto;background:#111318;border:1px solid #1e2433;border-radius:20px;overflow:hidden}
  .header{padding:28px 32px;background:linear-gradient(135deg,#2563eb,#1d4ed8);text-align:center}
  .logo{font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px}
  .body{padding:32px}
  .btn{display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;margin-top:20px}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e2433;font-size:14px}
  .muted{color:#8b96b0;font-size:13px}
  .footer{padding:20px 32px;text-align:center;color:#8b96b0;font-size:12px;border-top:1px solid #1e2433}
</style></head>
<body><div class="wrap">${content}</div></body></html>`;
exports.emailService = {
    async sendOrderConfirmation(to, data) {
        const rows = data.items.map(i => `<div class="row"><span>${i.name}${i.variant ? ` · ${i.variant}` : ''} ×${i.quantity}</span><span>€${(i.price * i.quantity).toFixed(2)}</span></div>`).join('');
        await transporter.sendMail({
            from: `"PrimeShop" <${process.env.SMTP_USER}>`,
            to,
            subject: `✅ Commande confirmée #${data.orderId.slice(-8).toUpperCase()}`,
            html: base(`
        <div class="header"><div class="logo">PrimeShop</div><p style="color:#bfdbfe;margin-top:6px;font-size:14px">Commande confirmée ✅</p></div>
        <div class="body">
          <h2 style="font-size:20px;margin-bottom:4px">Merci, ${data.customerName} !</h2>
          <p class="muted" style="margin-bottom:24px">Votre commande <strong style="color:#60a5fa">#${data.orderId.slice(-8).toUpperCase()}</strong> a bien été reçue.</p>
          ${rows}
          <div class="row"><strong>Total</strong><strong style="color:#60a5fa">€${data.total.toFixed(2)}</strong></div>
          <p style="margin-top:24px;font-size:14px;color:#8b96b0">Votre commande est en cours de préparation. Vous recevrez un email dès l'expédition avec le numéro de suivi.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Suivre ma commande</a>
        </div>
        <div class="footer">© ${new Date().getFullYear()} PrimeShop · Tous droits réservés</div>
      `),
        });
    },
    async sendShippingNotification(to, data) {
        await transporter.sendMail({
            from: `"PrimeShop" <${process.env.SMTP_USER}>`,
            to,
            subject: `🚀 Votre commande est en route ! #${data.orderId.slice(-8).toUpperCase()}`,
            html: base(`
        <div class="header"><div class="logo">PrimeShop</div><p style="color:#bfdbfe;margin-top:6px;font-size:14px">Commande expédiée 🚀</p></div>
        <div class="body">
          <h2 style="font-size:20px;margin-bottom:4px">C'est parti, ${data.customerName} !</h2>
          <p class="muted" style="margin-bottom:20px">Votre commande <strong style="color:#60a5fa">#${data.orderId.slice(-8).toUpperCase()}</strong> vient d'être expédiée.</p>
          <div style="background:#0a0c10;border-radius:12px;padding:16px;margin:16px 0;text-align:center">
            <div class="muted" style="font-size:12px;margin-bottom:6px">N° de suivi</div>
            <div style="font-family:monospace;font-size:16px;font-weight:700;color:#60a5fa">${data.trackingNumber}</div>
          </div>
          <a href="${process.env.FRONTEND_URL}/dashboard/orders/${data.orderId}" class="btn">Suivre en temps réel</a>
        </div>
        <div class="footer">© ${new Date().getFullYear()} PrimeShop · Tous droits réservés</div>
      `),
        });
    },
    async sendDeliveryConfirmation(to, data) {
        await transporter.sendMail({
            from: `"PrimeShop" <${process.env.SMTP_USER}>`,
            to,
            subject: `🎉 Livraison confirmée ! #${data.orderId.slice(-8).toUpperCase()}`,
            html: base(`
        <div class="header"><div class="logo">PrimeShop</div><p style="color:#bfdbfe;margin-top:6px;font-size:14px">Livraison confirmée 🎉</p></div>
        <div class="body">
          <h2 style="font-size:20px;margin-bottom:4px">Livré avec succès !</h2>
          <p class="muted" style="margin-bottom:20px">Bonjour ${data.customerName}, votre commande <strong style="color:#60a5fa">#${data.orderId.slice(-8).toUpperCase()}</strong> a bien été livrée.</p>
          <p style="font-size:14px;color:#8b96b0">Nous espérons que vous êtes satisfait(e) de votre achat. N'hésitez pas à laisser un avis sur le produit !</p>
          <a href="${process.env.FRONTEND_URL}/product/primelens-pro-x1#reviews" class="btn">Laisser un avis ⭐</a>
        </div>
        <div class="footer">© ${new Date().getFullYear()} PrimeShop · Tous droits réservés</div>
      `),
        });
    },
    async sendWelcomeEmail(to, data) {
        await transporter.sendMail({
            from: `"PrimeShop" <${process.env.SMTP_USER}>`,
            to,
            subject: '🎁 Bienvenue sur PrimeShop – Votre code -15%',
            html: base(`
        <div class="header"><div class="logo">PrimeShop</div><p style="color:#bfdbfe;margin-top:6px;font-size:14px">Bienvenue ! 🎁</p></div>
        <div class="body">
          <h2 style="font-size:20px;margin-bottom:8px">Bienvenue, ${data.name} !</h2>
          <p class="muted" style="margin-bottom:20px">Merci de nous rejoindre. Pour fêter ça, voici un code de bienvenue exclusif :</p>
          <div style="background:#0a0c10;border-radius:12px;padding:20px;text-align:center;border:2px dashed #2563eb">
            <div class="muted" style="font-size:12px;margin-bottom:8px">CODE DE BIENVENUE</div>
            <div style="font-family:monospace;font-size:28px;font-weight:900;color:#60a5fa;letter-spacing:4px">PRIME15</div>
            <div class="muted" style="font-size:12px;margin-top:8px">-15% sur votre première commande</div>
          </div>
          <a href="${process.env.FRONTEND_URL}" class="btn">Découvrir la boutique</a>
        </div>
        <div class="footer">© ${new Date().getFullYear()} PrimeShop · Tous droits réservés</div>
      `),
        });
    },
};
//# sourceMappingURL=emailService.js.map