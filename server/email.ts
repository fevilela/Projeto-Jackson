import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("EMAIL_USER ou EMAIL_PASS não configurados");
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("[EMAIL] Enviado:", info.messageId);
    return true;
  } catch (error: any) {
    console.error("[EMAIL] Erro ao enviar:", error);
    return false;
  }
}

export function generatePasswordResetEmail(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #121212; color: #d2eb38; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
    .code { background: #d2eb38; color: #121212; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sistema de Avaliação Física</h1>
    </div>
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a recuperação de senha da sua conta.</p>
      <p>Use o código abaixo para redefinir sua senha:</p>
      <div class="code">${code}</div>
      <p><strong>Este código é válido por 1 hora.</strong></p>
      <p>Se você não solicitou a recuperação de senha, apenas ignore.</p>
    </div>
    <div class="footer">
      <p>Este é um email automático.</p>
    </div>
  </div>
</body>
</html>`;
}
