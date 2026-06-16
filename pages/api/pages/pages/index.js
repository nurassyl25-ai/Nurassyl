import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Ты играешь роль покупателя по имени Нурлан. Ты пишешь в онлайн-чат магазина Baqshaho (овощи и фрукты). Твоё первое сообщение уже отправлено: "Доставка дорогая, у других дешевле". ХАРАКТЕР: скептичный но хочешь купить если убедят, сравниваешь с Arbuz.kz и Magnum, при шаблонных ответах давишь сильнее, при хороших аргументах смягчаешься. СКРЫТЫЕ БОЛИ: прошлый раз привезли мятые бананы, нужно к воскресенью на семейный ужин, живёшь на 9 этаже тяжело носить. ПРАВИЛА: пиши коротко 1-3 предложения, не соглашайся сразу нужно минимум 3 аргумента, после 7 сообщений менеджера прими решение, если убедили — "Ладно оформляйте заказ", если нет — "Нет пойду в другое место".`;

const EVAL_PROMPT = `Ты тренер по продажам. Оцени МЕНЕДЖЕРА в диалоге. Возражение: "Доставка дорогая". Оцени от 1 до 10: joining (присоединение), questions (вопросы), arguments (аргументы), price (работа с ценой), closing (закрытие). Ответь ТОЛЬКО JSON: {"scores":{"joining":7,"questions":5,"arguments":6,"price":4,"closing":3},"totalScore":5,"verdict":"Хорошо","bestMoment":"текст","worstMoment":"текст","tip":"текст"}`;

async function askClaude(system, history) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages: history })
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || '';
}

function Bar({ label, value }) {
  const color = value >= 8 ? '#4caf82' : value >= 5 ? '#f0a500' : '#e05c5c';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}/10</span>
      </div>
      <div style={{ height: 6, background: '#2a2d3a', borderRadius: 3 }}>
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('intro');
  const [result, setResult] = useState(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  function start() {
    setHistory([{ from: 'client', text: 'Доставка дорогая, у других дешевле 🤷' }]);
    setPhase('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const newHistory = [...history, { from: 'manager', text }];
    setHistory(newHistory);
    setLoading(true);
    const claudeMessages = newHistory.map(m => ({
      role: m.from === 'manager' ? 'user' : 'assistant',
      content: m.text
    }));
    try {
      const reply = await askClaude(SYSTEM_PROMPT, claudeMessages);
      const updated = [...newHistory, { from: 'client', text: reply }];
      setHistory(updated);
      const count = updated.filter(m => m.from === 'manager').length;
      if (count >= 7 || reply.includes('оформляйте') || reply.includes('другое место')) {
        setTimeout(() => evaluate(updated), 800);
      }
    } catch {
      setHistory(prev => [...prev, { from: 'client', text: 'Ошибка соединения...' }]);
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(fin) {
    setPhase('evaluating');
    const dialog = fin.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
    try {
      const raw = await askClaude(EVAL_PROMPT, [{ role: 'user', content: dialog }]);
      const clean = raw.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(clean));
    } catch {
      setResult({ scores: { joining: 5, questions: 5, arguments: 5, price: 5, closing: 5 }, totalScore: 5, verdict: 'Хорошо', bestMoment: 'Старались вести диалог.', worstMoment: 'Нет данных.', tip: 'Практикуйтесь больше!' });
    }
    setPhase('result');
  }

  function reset() { setHistory([]); setResult(null); setInput(''); setPhase('intro'); }

  const vc = { 'Отлично': '#4caf82', 'Хорошо': '#5b9bd5', 'Нужна практика': '#f0a500', 'Слабо': '#e05c5c' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e8e8', fontFamily: 'Inter,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1a1d27', borderBottom: '1px solid #2a2d3a', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4caf82,#2d7a57)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🥬</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Тренажёр — Baqshaho</div>
          <div style={{ fontSize: 11, color: '#555' }}>Возражение: Доставка дорогая</div>
        </div>
        {phase === 'chat' && <button onClick={() => evaluate(history)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #2a2d3a', borderRadius: 6, color: '#888', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Завершить →</button>}
      </div>

      {phase === 'intro' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Доставка дорогая</h2>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Покупатель написал в чат. Вы — менеджер Baqshaho. Отработайте возражение и доведите до заказа.</p>
            <button onClick={start} style={{ background: '#4caf82', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Начать диалог</button>
          </div>
        </div>
      )}

      {(phase === 'chat' || phase === 'evaluating') && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'client' ? 'flex-start' : 'flex-end', gap: 8 }}>
                {m.from === 'client' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2d3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>}
                <div style={{ maxWidth: '70%', padding: '10px 14px', fontSize: 14, lineHeight: 1.5, borderRadius: m.from === 'client' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: m.from === 'client' ? '#1e2130' : '#5b9bd5', color: '#fff' }}>{m.text}</div>
              </div>
            ))}
            {loading && <div style={{ display: 'flex', gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2a2d3a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div><div style={{ background: '#1e2130', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', color: '#555', letterSpacing: 4, fontSize: 18 }}>•••</div></div>}
            {phase === 'evaluating' && <div style={{ textAlign: 'center', color: '#5b9bd5', padding: 16 }}>⏳ Анализирую диалог...</div>}
            <div ref={bottomRef} />
          </div>
          {phase === 'chat' && (
            <div style={{ background: '#1a1d27', borderTop: '1px solid #2a2d3a', padding: '10px 14px', display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Ваш ответ покупателю..." style={{ flex: 1, background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: 10, color: '#e8e8e8', fontSize: 14, padding: '10px 14px', outline: 'none' }} />
              <button onClick={send} disabled={!input.trim() || loading} style={{ background: '#5b9bd5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 18, cursor: 'pointer' }}>↑</button>
            </div>
          )}
        </>
      )}

      {phase === 'result' && result && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 72, fontWeight: 900, color: vc[result.verdict] || '#5b9bd5' }}>{result.totalScore}</div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>из 10</div>
              <div style={{ display: 'inline-block', background: (vc[result.verdict] || '#5b9bd5') + '22', color: vc[result.verdict] || '#5b9bd5', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>{result.verdict}</div>
            </div>
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <Bar label="Присоединение" value={result.scores.joining} />
              <Bar label="Уточняющие вопросы" value={result.scores.questions} />
              <Bar label="Аргументы и ценность" value={result.scores.arguments} />
              <Bar label="Работа с ценой" value={result.scores.price} />
              <Bar label="Закрытие сделки" value={result.scores.closing} />
            </div>
            <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              {[{ label: '✓ Лучший момент', text: result.bestMoment, color: '#4caf82' }, { label: '✗ Главная ошибка', text: result.worstMoment, color: '#e05c5c' }, { label: '→ Совет', text: result.tip, color: '#f0a500' }].map(({ label, text, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{ width: '100%', background: '#5b9bd5', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Попробовать ещё раз</button>
          </div>
        </div>
      )}
    </div>
  );
}
