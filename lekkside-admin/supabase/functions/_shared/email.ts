import nodemailer from "npm:nodemailer";

export interface EmailOptions {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const host = Deno.env.get("ZOHO_SMTP_HOST");
  const port = Deno.env.get("ZOHO_SMTP_PORT") || "465";
  const user = Deno.env.get("ZOHO_SMTP_USER");
  const pass = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!host || !user || !pass) {
    throw new Error("Missing Zoho SMTP configuration (ZOHO_SMTP_HOST, ZOHO_SMTP_USER, ZOHO_SMTP_PASSWORD)");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // true for 465, false for other ports like 587
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: options.from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    console.log(`Email sent via Zoho: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error("Error sending email via Zoho:", error);
    throw error;
  }
};
