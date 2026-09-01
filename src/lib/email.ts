// Minimal email sender. If SENDGRID_API_KEY is set, sends a real email.
// Otherwise (e.g. while testing on Vercel without an email provider
// configured yet), logs the link to the function's console output so you
// can still complete the reset flow by checking Vercel's logs.
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.RESET_EMAIL_FROM;

  if (!apiKey || !from) {
    console.log(`[password reset] No email provider configured. Link for ${to}: ${resetUrl}`);
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
      subject: "Reset your Rollcall password",
      content: [
        {
          type: "text/plain",
          value: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[password reset] SendGrid request failed (${res.status}): ${body}`);
    console.log(`[password reset] Link for ${to}: ${resetUrl}`);
  }
}
