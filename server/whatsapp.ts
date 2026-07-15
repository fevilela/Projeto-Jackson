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
import { storage } from "./storage";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

const INITIAL_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 60000;
const SESSION_SYNC_DEBOUNCE = 3000;
const SESSION_SYNC_INTERVAL = 30000;

class WhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private status: ConnectionStatus = "disconnected";
  private qrCode: string | null = null;
  private sessionPath: string;

  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private syncInProgress = false;

  constructor() {
    this.sessionPath = path.join(process.cwd(), "whatsapp-session");
    this.init().catch((err) => log(`[WhatsApp] Erro na inicialização: ${err}`));
  }

  private async init() {
    // A hospedagem (ex: Render free) pode apagar o disco a cada reinício/deploy.
    // Antes de olhar para o disco local, restaura a sessão salva no Postgres.
    await this.restoreSessionFromDb();
    this.watchSessionDir();
    setInterval(() => this.syncSessionToDb().catch(() => {}), SESSION_SYNC_INTERVAL);

    if (this.hasLocalCreds()) {
      this.connect().catch(() => {});
    }
  }

  private hasLocalCreds(): boolean {
    return fs.existsSync(path.join(this.sessionPath, "creds.json"));
  }

  private async restoreSessionFromDb() {
    try {
      const files = await storage.getWhatsappSessionFiles();
      if (files.length === 0) return;

      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      let restored = 0;
      for (const file of files) {
        const filePath = path.join(this.sessionPath, file.name);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, file.content, "utf-8");
          restored++;
        }
      }
      log(`[WhatsApp] Sessão restaurada do banco de dados (${restored} arquivo(s)).`);
    } catch (err) {
      log(`[WhatsApp] Erro ao restaurar sessão do banco: ${err}`);
    }
  }

  private watchSessionDir() {
    try {
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }
      fs.watch(this.sessionPath, () => {
        if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
          this.syncSessionToDb().catch(() => {});
        }, SESSION_SYNC_DEBOUNCE);
      });
    } catch (err) {
      log(`[WhatsApp] Erro ao observar pasta de sessão: ${err}`);
    }
  }

  // Copia os arquivos de credenciais para o Postgres, para sobreviver a
  // reinícios/deploys em hospedagens com disco não-persistente (ex: Render free).
  private async syncSessionToDb() {
    if (this.syncInProgress) return;
    if (!fs.existsSync(this.sessionPath)) return;

    this.syncInProgress = true;
    try {
      const filenames = fs.readdirSync(this.sessionPath);
      const dbFiles = await storage.getWhatsappSessionFiles();
      const staleNames = new Set(dbFiles.map((f) => f.name));

      for (const name of filenames) {
        const filePath = path.join(this.sessionPath, name);
        let content: string;
        try {
          content = fs.readFileSync(filePath, "utf-8");
          JSON.parse(content); // valida integridade (evita salvar escrita parcial)
        } catch {
          continue; // arquivo sendo escrito agora, tenta na próxima sincronização
        }
        await storage.upsertWhatsappSessionFile(name, content);
        staleNames.delete(name);
      }

      // Remove do banco arquivos que não existem mais localmente (ex: pre-keys usadas)
      for (const staleName of Array.from(staleNames)) {
        await storage.deleteWhatsappSessionFile(staleName);
      }
    } catch (err) {
      log(`[WhatsApp] Erro ao sincronizar sessão com o banco: ${err}`);
    } finally {
      this.syncInProgress = false;
    }
  }

  getStatus() {
    return { status: this.status, qr: this.qrCode };
  }

  async connect() {
    if (this.status === "connected" || this.status === "connecting") return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

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
          const restartRequired = statusCode === DisconnectReason.restartRequired;

          log(
            `[WhatsApp] Conexão encerrada. Código: ${statusCode}. Logout: ${loggedOut}`
          );

          this.status = "disconnected";
          this.qrCode = null;
          this.socket = null;

          if (loggedOut) {
            // Sessão inválida/expirada: apaga os creds (disco + banco) para
            // forçar a geração de um QR code novo na próxima tentativa.
            if (fs.existsSync(this.sessionPath)) {
              fs.rmSync(this.sessionPath, { recursive: true, force: true });
            }
            await storage.clearWhatsappSessionFiles().catch(() => {});
            this.reconnectDelay = INITIAL_RECONNECT_DELAY;
          } else {
            const delay = restartRequired ? 500 : this.reconnectDelay;
            log(`[WhatsApp] Reconectando em ${delay}ms...`);
            this.reconnectTimer = setTimeout(
              () => this.connect().catch(() => {}),
              delay
            );
            if (!restartRequired) {
              this.reconnectDelay = Math.min(
                this.reconnectDelay * 2,
                MAX_RECONNECT_DELAY
              );
            }
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          this.reconnectDelay = INITIAL_RECONNECT_DELAY;
          log("[WhatsApp] Conectado com sucesso!");
        }
      });

      this.socket.ev.on("creds.update", async () => {
        await saveCreds();
        this.syncSessionToDb().catch(() => {});
      });
    } catch (err) {
      log(`[WhatsApp] Erro ao conectar: ${err}`);
      this.status = "disconnected";
      this.reconnectTimer = setTimeout(
        () => this.connect().catch(() => {}),
        this.reconnectDelay
      );
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

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
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;

    if (fs.existsSync(this.sessionPath)) {
      fs.rmSync(this.sessionPath, { recursive: true, force: true });
    }
    await storage.clearWhatsappSessionFiles().catch(() => {});

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
