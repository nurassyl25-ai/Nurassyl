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
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: openaiMessages
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.status(200).json({ content: [{ text: 'Ошибка: ' + data.error.message }] });
    }
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ content: [{ text }] });

  } catch (error) {
    res.status(200).json({ content: [{ text: 'Ошибка: ' + error.message }] });
  }
}
