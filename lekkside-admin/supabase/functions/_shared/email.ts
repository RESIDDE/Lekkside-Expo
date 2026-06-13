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
  const host = Deno.env.get("ZEPTOMAIL_SMTP_HOST") || "smtp.zeptomail.com";
  const port = Deno.env.get("ZEPTOMAIL_SMTP_PORT") || "587";
  const user = Deno.env.get("ZEPTOMAIL_SMTP_USER") || "emailapikey";
  const pass = Deno.env.get("ZEPTOMAIL_SMTP_PASSWORD");

  if (!pass) {
    throw new Error("Missing ZeptoMail SMTP configuration (ZEPTOMAIL_SMTP_PASSWORD)");
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
    
    console.log(`Email sent via ZeptoMail: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error("Error sending email via ZeptoMail:", error);
    throw error;
  }
};
