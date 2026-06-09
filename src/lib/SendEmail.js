import nodemailer from "nodemailer";

export const sendEmail = async ({
  to,
  subject,
  html,
  fromName,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
}) => {
  try {
    const host = EMAIL_HOST || process.env.EMAIL_HOST;
    const port = parseInt(EMAIL_PORT || process.env.EMAIL_PORT || "587");
    const user = EMAIL_USER || process.env.EMAIL_USER;
    const pass = EMAIL_PASS || process.env.EMAIL_PASS;

    // port 465 = SSL, 587/25 = STARTTLS
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout:   10000,
      socketTimeout:     15000,
    });

    const info = await transporter.sendMail({
      from: `"${fromName || user}" <${user}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};
