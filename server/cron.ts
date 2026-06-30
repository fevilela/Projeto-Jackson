import cron from "node-cron";
import { storage } from "./storage";
import { whatsAppService } from "./whatsapp";
import { log } from "./vite";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(amount: string) {
  return parseFloat(amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function sendDueNotifications() {
  if (!whatsAppService.isConnected()) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const preDue = new Date(today);
  preDue.setDate(today.getDate() + 4);

  const todayStr = today.toISOString().split("T")[0];
  const preDueStr = preDue.toISOString().split("T")[0];

  log(`[CRON] Verificando notificações: hoje=${todayStr}, pré-venc=${preDueStr}`);

  let charges: Awaited<ReturnType<typeof storage.getPlanChargesForNotification>>;
  try {
    charges = await storage.getPlanChargesForNotification(todayStr, preDueStr);
  } catch (err) {
    log(`[CRON] Erro ao buscar cobranças: ${err}`);
    return;
  }

  for (const charge of charges) {
    if (!charge.athletePhone) continue;

    const planLabel = charge.planName ? `plano *${charge.planName}*` : "mensalidade";
    const valor = formatCurrency(charge.amount);

    try {
      // Aviso 4 dias antes
      if (charge.chargeDate === preDueStr && charge.notifiedPreDue !== "sim") {
        const msg =
          `Olá, *${charge.athleteName}*! 👋\n\n` +
          `Sua ${planLabel} vence em *4 dias*, no dia *${formatDate(charge.chargeDate)}*.\n\n` +
          `Valor: *${valor}*\n\n` +
          `Em caso de dúvidas, entre em contato! 😊`;

        await whatsAppService.sendMessage(charge.athletePhone, msg);
        await storage.markChargeNotifiedPreDue(charge.id);
        await storage.createWhatsappMessage({
          userId: charge.userId,
          athleteId: charge.athleteId,
          phone: charge.athletePhone,
          message: msg,
          type: "pre_due",
        });
        log(`[CRON] Aviso pré-venc enviado para ${charge.athleteName}`);
      }

      // Aviso no dia do vencimento
      if (charge.chargeDate === todayStr && charge.notifiedOnDue !== "sim") {
        const msg =
          `Olá, *${charge.athleteName}*! 📅\n\n` +
          `Sua ${planLabel} vence *hoje*, ${formatDate(charge.chargeDate)}.\n\n` +
          `Valor: *${valor}*\n\n` +
          `Por favor, efetue o pagamento. Obrigado! 🙏`;

        await whatsAppService.sendMessage(charge.athletePhone, msg);
        await storage.markChargeNotifiedOnDue(charge.id);
        await storage.createWhatsappMessage({
          userId: charge.userId,
          athleteId: charge.athleteId,
          phone: charge.athletePhone,
          message: msg,
          type: "on_due",
        });
        log(`[CRON] Aviso de vencimento enviado para ${charge.athleteName}`);
      }
    } catch (err) {
      log(`[CRON] Erro ao enviar para ${charge.athleteName}: ${err}`);
    }
  }
}

export function startNotificationCron() {
  // Roda todo dia às 8h da manhã
  cron.schedule("0 8 * * *", () => {
    sendDueNotifications().catch((err) =>
      log(`[CRON] Erro inesperado: ${err}`)
    );
  });

  log("[CRON] Job de notificações WhatsApp iniciado (todo dia às 8h).");
}

// Expõe para disparo manual via API (teste)
export { sendDueNotifications };
