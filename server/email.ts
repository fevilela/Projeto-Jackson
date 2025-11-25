import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.error(
        "[EMAIL] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS"
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[EMAIL] Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    return false;
  }
}

export function generatePasswordResetEmail(resetCode: string): string {
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
      <div class="code">${resetCode}</div>
      <p><strong>Este código é válido por 1 hora.</strong></p>
      <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
    </div>
    <div class="footer">
      <p>Este é um email automático, não responda.</p>
    </div>
  </div>
</body>
</html>
  `;
}
