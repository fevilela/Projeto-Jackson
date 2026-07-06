import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { log } from "./vite";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

class WhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private status: ConnectionStatus = "disconnected";
  private qrCode: string | null = null;
  private sessionPath: string;

  constructor() {
    this.sessionPath = path.join(process.cwd(), "whatsapp-session");
    // Se já existe sessão salva, reconecta ao iniciar
    if (fs.existsSync(this.sessionPath)) {
      this.connect().catch(() => {});
    }
  }

  getStatus() {
    return { status: this.status, qr: this.qrCode };
  }

  async connect() {
    if (this.status === "connected" || this.status === "connecting") return;

    this.status = "connecting";
    this.qrCode = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        this.sessionPath
      );
      const { version } = await fetchLatestBaileysVersion();

      this.socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ["Jackson Treinos", "Chrome", "1.0"],
      });

      this.socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = await QRCode.toDataURL(qr);
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output
            ?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;

          log(
            `[WhatsApp] Conexão encerrada. Código: ${statusCode}. Logout: ${loggedOut}`
          );

          this.status = "disconnected";
          this.qrCode = null;
          this.socket = null;

          if (loggedOut) {
            // Sessão inválida/expirada: apaga os creds para forçar
            // a geração de um QR code novo na próxima tentativa.
            if (fs.existsSync(this.sessionPath)) {
              fs.rmSync(this.sessionPath, { recursive: true, force: true });
            }
          } else {
            log("[WhatsApp] Reconectando em 5s...");
            setTimeout(() => this.connect().catch(() => {}), 5000);
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          log("[WhatsApp] Conectado com sucesso!");
        }
      });

      this.socket.ev.on("creds.update", saveCreds);
    } catch (err) {
      log(`[WhatsApp] Erro ao conectar: ${err}`);
      this.status = "disconnected";
    }
  }

  async disconnect() {
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
      }
    } catch {
      this.socket = null;
    }

    this.status = "disconnected";
    this.qrCode = null;

    if (fs.existsSync(this.sessionPath)) {
      fs.rmSync(this.sessionPath, { recursive: true, force: true });
    }

    log("[WhatsApp] Desconectado e sessão removida.");
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    if (this.status !== "connected" || !this.socket) {
      throw new Error("WhatsApp não conectado");
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      throw new Error(`Número inválido: "${phone}" — precisa ter DDD + número`);
    }

    const number = digits.startsWith("55") ? digits : `55${digits}`;
    const jid = `${number}@s.whatsapp.net`;

    log(`[WhatsApp] Enviando para ${jid} (número formatado: ${number})...`);
    try {
      const result = await this.socket.sendMessage(jid, { text: message });
      log(`[WhatsApp] Mensagem enviada para ${jid}: ${JSON.stringify(result?.key)}`);
    } catch (err) {
      log(`[WhatsApp] Erro ao enviar para ${jid}: ${err}`);
      throw new Error(`Falha ao enviar: ${err}`);
    }
  }

  isConnected() {
    return this.status === "connected";
  }

  formatJid(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    const number = digits.startsWith("55") ? digits : `55${digits}`;
    return `${number}@s.whatsapp.net`;
  }

  async getProfilePicture(phone: string): Promise<string | null> {
    if (this.status !== "connected" || !this.socket) {
      log(`[WhatsApp] getProfilePicture: não conectado`);
      return null;
    }
    const jid = this.formatJid(phone);
    try {
      const url = await this.socket.profilePictureUrl(jid, "image");
      log(`[WhatsApp] Foto de ${jid}: ${url ?? "nenhuma"}`);
      return url ?? null;
    } catch (err) {
      log(`[WhatsApp] Erro ao buscar foto de ${jid}: ${err}`);
      return null;
    }
  }
}

export const whatsAppService = new WhatsAppService();
