export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { messages, system, lang } = req.body;

    const cleanMessages = messages.filter(m => m.content && m.content.trim() !== '');
    while (cleanMessages.length > 0 && cleanMessages[0].role === 'assistant') {
      cleanMessages.shift();
    }

    // Казахский — OpenAI, русский — Anthropic
    if (lang === 'kz') {
      const openaiMessages = [
        { role: 'system', content: system },
        ...cleanMessages
      ];
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 500,
          messages: openaiMessages
        })
      });
      const data = await response.json();
      if (data.error) return res.status(200).json({ content: [{ text: 'Қате: ' + data.error.message }] });
      const text = data.choices?.[0]?.message?.content || '';
      return res.status(200).json({ content: [{ text }] });
    }

    // Русский — Anthropic
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
    if (data.error) return res.status(200).json({ content: [{ text: 'Ошибка: ' + data.error.message }] });
    res.status(200).json(data);
  } catch (error) {
    res.status(200).json({ content: [{ text: 'Ошибка: ' + error.message }] });
  }
}
