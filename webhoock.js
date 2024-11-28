export async function onRequest(context) {
  const telegramToken = '7528489912:AAFRL4h9H3IsTjUrSg_lSbaard2gc8QGnnI';
  const url = `https://api.telegram.org/bot${telegramToken}/setWebhook?url=${context.request.url}`;
  
  const response = await fetch(url);
  return new Response('Webhook Set! Your XRP miner is ready for commands! 🚀');
}
