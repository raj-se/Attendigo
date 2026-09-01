// Minimal email sender. If SENDGRID_API_KEY is set, sends a real email.
// Otherwise (e.g. while testing on Vercel without an email provider
// configured yet), logs the message to the function's console output so
// you can still see it by checking Vercel's logs.
async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.RESET_EMAIL_FROM;

  if (!apiKey || !from) {
    console.log(`[email] No provider configured. To: ${to} | Subject: ${subject}\n${text}`);
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "Rollcall" },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] SendGrid request failed (${res.status}): ${body}`);
    console.log(`[email] To: ${to} | Subject: ${subject}\n${text}`);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your Rollcall password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  });
}

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "sakariyaraj890@gmail.com";

export async function sendAccessRequestEmail(request: {
  name: string;
  email: string;
  message?: string;
}) {
  await sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `Rollcall access request from ${request.name}`,
    text: [
      `Name: ${request.name}`,
      `Email: ${request.email}`,
      request.message ? `Message: ${request.message}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendAccountCreatedEmail(to: string, setPasswordUrl: string) {
  await sendEmail({
    to,
    subject: "Your Rollcall account is ready",
    text: `An instructor account has been created for you on Rollcall. Set your password to get started: ${setPasswordUrl}\n\nThis link expires in 1 hour.`,
  });
}
