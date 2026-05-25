import nodemailer from "nodemailer";

export const sendpassowrdEmail = async ({ to, subject, html }) => {
  try {
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || "").replace(/\s/g, ""),
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};
