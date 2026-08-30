// POST /api/profile -> update the logged-in worker's own bank/invoice details.
import { publicUser } from '../lib/auth.js';

export async function onRequestPost({ request, env, data }) {
  const user = data.user;
  const body = await request.json();

  await env.DB.prepare(
    `UPDATE users SET bank_name=?, bank_branch=?, bank_account_type=?, bank_account_number=?, bank_account_holder=?, invoice_reg_number=?
     WHERE id=?`
  )
    .bind(
      body.bankName || '',
      body.bankBranch || '',
      body.bankAccountType || '',
      body.bankAccountNumber || '',
      body.bankAccountHolder || '',
      body.invoiceRegNumber || '',
      user.id
    )
    .run();

  const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return Response.json({ ok: true, user: publicUser(updated) });
}
