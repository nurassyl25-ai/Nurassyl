export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { messages, system } = req.body;
    
    // Anthropic требует чередование user/assistant и начало с user
    // Если первое сообщение от assistant — добавляем пустой user
    let cleanMessages = messages.filter(m => m.content && m.content.trim() !== '');
    
    if (cleanMessages.length > 0 && cleanMessages[0].role === 'assistant') {
      cleanMessages = [{ role: 'user', content: '...' }, ...cleanMessages];
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system,
        messages: cleanMessages
      })
    });
    const data = await response.json();
    if (data.error) {
      return res.status(200).json({ content: [{ text: 'Ошибка API: ' + data.error.message }] });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(200).json({ content: [{ text: 'Ошибка: ' + error.message }] });
  }
}
