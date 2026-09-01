// Minimal email sender. If SENDGRID_API_KEY is set, sends a real email.
// Otherwise (e.g. while testing on Vercel without an email provider
// configured yet), logs the message to the function's console output so
// you can still see it by checking Vercel's logs.
async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
      // SendGrid requires text/plain to come before text/html when both
      // are present.
      content: html
        ? [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ]
        : [{ type: "text/plain", value: text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] SendGrid request failed (${res.status}): ${body}`);
    console.log(`[email] To: ${to} | Subject: ${subject}\n${text}`);
  }
}

// Simple table-based layout for maximum compatibility across email
// clients (Gmail, Outlook, Apple Mail), matching the app's ink/paper look.
function renderEmailHtml({
  heading,
  message,
  buttonLabel,
  buttonUrl,
  footer,
}: {
  heading: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#F6F3EC;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F3EC;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #E4E6EB;border-radius:8px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#171B26;">Rollcall</p>
                <h1 style="margin:0 0 16px;font-size:20px;color:#171B26;">${heading}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4A5062;">${message}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:6px;background-color:#171B26;">
                      <a href="${buttonUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#F6F3EC;text-decoration:none;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;color:#9BA1B0;">${footer}</p>
                <p style="margin:8px 0 0;font-size:12px;color:#9BA1B0;word-break:break-all;">
                  If the button doesn't work, copy this link: ${buttonUrl}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your Rollcall password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: renderEmailHtml({
      heading: "Reset your password",
      message:
        "Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.",
      buttonLabel: "Reset password",
      buttonUrl: resetUrl,
      footer: "This link expires in 1 hour.",
    }),
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
    html: renderEmailHtml({
      heading: "Your account is ready",
      message:
        "An instructor account has been created for you on Rollcall. Set your password to get started.",
      buttonLabel: "Set your password",
      buttonUrl: setPasswordUrl,
      footer: "This link expires in 1 hour.",
    }),
  });
}
