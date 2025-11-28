import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error("[EMAIL] GMAIL_USER ou GMAIL_APP_PASSWORD não configurados");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      return false;
    }

    const info = await transporter.sendMail({
      from: `"Jackson Max Performance" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("[EMAIL] Enviado com sucesso:", info.messageId);
    return true;
  } catch (error: any) {
    console.error("[EMAIL] Erro ao enviar:", error.message);
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
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #121212; color: #d2eb38; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; color: #888; font-size: 14px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .code-container { background: #121212; border: 2px solid #d2eb38; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d2eb38; }
    .info { color: #666; font-size: 14px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Jackson Max Performance</h1>
      <p>Sistema de Acompanhamento de Atletas</p>
    </div>
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a recuperação de senha da sua conta.</p>
      <p>Use o código abaixo para redefinir sua senha:</p>
      <div class="code-container">
        <span class="code">${code}</span>
      </div>
      <p class="info"><strong>Este código é válido por 15 minutos.</strong></p>
      <p class="info">Se você não solicitou a recuperação de senha, ignore este email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Jackson Max Performance. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

export function generateAthleteAccessEmail(
  code: string,
  athleteName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #121212; color: #d2eb38; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; color: #888; font-size: 14px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .greeting { font-size: 18px; margin-bottom: 20px; }
    .code-container { background: #121212; border: 2px solid #d2eb38; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d2eb38; }
    .info { color: #666; font-size: 14px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Jackson Max Performance</h1>
      <p>Sistema de Acompanhamento de Atletas</p>
    </div>
    <div class="content">
      <p class="greeting">Olá, <strong>${athleteName}</strong>!</p>
      <p>Você solicitou acesso ao sistema de acompanhamento de atletas. Use o código abaixo para criar sua senha:</p>
      <div class="code-container">
        <span class="code">${code}</span>
      </div>
      <p class="info"><strong>Este código é válido por 15 minutos.</strong></p>
      <p class="info">Se você não solicitou este código, ignore este email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Jackson Max Performance. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendAthleteAccessCode(
  email: string,
  code: string,
  athleteName: string
): Promise<boolean> {
  const html = generateAthleteAccessEmail(code, athleteName);
  return sendEmail({
    to: email,
    subject: "Código de Acesso - Jackson Max Performance",
    html,
  });
}

export async function sendPasswordResetCode(
  email: string,
  code: string
): Promise<boolean> {
  const html = generatePasswordResetEmail(code);
  return sendEmail({
    to: email,
    subject: "Recuperação de Senha - Jackson Max Performance",
    html,
  });
}
