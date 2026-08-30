// GET /api/invoice?month=YYYY-MM[&user_id=...]
// Returns everything needed to render both the printable invoice and the
// LINE-shareable text summary for one worker's one month: their entries,
// expenses, and the wage/expense subtotals + grand total.
export async function onRequestGet({ request, env, data }) {
  const user = data.user;
  const url = new URL(request.url);
  const month = url.searchParams.get('month');
  if (!month) return new Response('month is required (YYYY-MM).', { status: 400 });

  const requestedUserId = url.searchParams.get('user_id');
  let targetUserId = user.id;
  if (requestedUserId && requestedUserId !== user.id) {
    if (user.role !== 'admin') return new Response('権限がありません。', { status: 403 });
    targetUserId = requestedUserId;
  }

  const target = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(targetUserId).first();
  if (!target) return new Response('見つかりません。', { status: 404 });

  const { results: entries } = await env.DB.prepare(
    'SELECT * FROM entries WHERE user_id = ? AND date LIKE ? ORDER BY date ASC, id ASC'
  )
    .bind(targetUserId, month + '%')
    .all();
  const { results: expenses } = await env.DB.prepare(
    'SELECT * FROM expenses WHERE user_id = ? AND date LIKE ? ORDER BY date ASC, id ASC'
  )
    .bind(targetUserId, month + '%')
    .all();

  const wageSubtotal = entries.reduce((s, e) => s + e.wage, 0);
  const expenseSubtotal = expenses.reduce((s, e) => s + e.amount, 0);

  return Response.json({
    worker: {
      name: target.name,
      email: target.email,
      bankName: target.bank_name,
      bankBranch: target.bank_branch,
      bankAccountType: target.bank_account_type,
      bankAccountNumber: target.bank_account_number,
      bankAccountHolder: target.bank_account_holder,
      invoiceRegNumber: target.invoice_reg_number,
    },
    month,
    entries,
    expenses,
    wageSubtotal,
    expenseSubtotal,
    total: wageSubtotal + expenseSubtotal,
  });
}
