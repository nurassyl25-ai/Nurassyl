import { useState, useRef, useEffect } from "react";

// КОДЫ ДОСТУПА — добавляйте сюда коды для каждого клиента
const ACCESS_CODES = [
  "SALES2024",
  "BAQSHAHO",
  "PARTNER01",
  "PARTNER02",
  "PARTNER03",
  "DEMO123",
];

const NICHES = [
  { id: "retail", label: "Розничный магазин", emoji: "🛒", examples: "одежда, электроника, продукты" },
  { id: "food", label: "Кафе / Ресторан", emoji: "☕", examples: "доставка, меню, столики" },
  { id: "services", label: "Услуги", emoji: "💼", examples: "салон, ремонт, обучение" },
  { id: "realty", label: "Недвижимость", emoji: "🏠", examples: "аренда, продажа, ипотека" },
  { id: "b2b", label: "B2B продажи", emoji: "🤝", examples: "оптовые поставки, SaaS, реклама" },
  { id: "online", label: "Онлайн-магазин", emoji: "📱", examples: "маркетплейс, доставка, возврат" },
];

const STAGES = [
  { id: "contact", label: "Установление контакта", emoji: "👋", desc: "Первое впечатление, приветствие, расположить к себе" },
  { id: "needs", label: "Выявление потребностей", emoji: "🔍", desc: "Задавать правильные вопросы, слушать, понять боль" },
  { id: "presentation", label: "Презентация", emoji: "🎯", desc: "Показать ценность, выгоды, решение для клиента" },
  { id: "objections", label: "Отработка возражений", emoji: "🛡️", desc: "Дорого, подумаю, не нужно — работать с сомнениями" },
  { id: "closing", label: "Закрытие сделки", emoji: "✅", desc: "Довести до покупки, взять контакт, договориться" },
];

const CRITERIA = {
  contact: { keys: ["greeting","rapport","energy","opening","interest"], labels: ["Приветствие","Расположение","Энергия","Открытие диалога","Вызов интереса"] },
  needs: { keys: ["questions","listening","empathy","discovery","summary"], labels: ["Вопросы","Слушание","Эмпатия","Выявление боли","Резюмирование"] },
  presentation: { keys: ["benefits","examples","clarity","value","relevance"], labels: ["Выгоды","Примеры","Ясность","Ценность","Релевантность"] },
  objections: { keys: ["joining","questions","arguments","price","closing"], labels: ["Присоединение","Уточнение","Аргументы","Работа с ценой","Закрытие"] },
  closing: { keys: ["signal","offer","urgency","confirmation","nextStep"], labels: ["Сигнал покупки","Предложение","Срочность","Подтверждение","Следующий шаг"] },
};

function buildSystemPrompt(niche, stage) {
  const nicheLabel = NICHES.find(n => n.id === niche)?.label || niche;
  const scenarios = {
    contact: `Ты — покупатель в ${nicheLabel}. Только зашёл. Веди себя нейтрально. На вялое приветствие отвечай коротко, на энергичное — открывайся.`,
    needs: `Ты — покупатель в ${nicheLabel} с потребностью которую сам до конца не осознаёшь. Раскрывайся только на хорошие конкретные вопросы.`,
    presentation: `Ты — скептичный покупатель в ${nicheLabel}. Если говорят о свойствах без выгод — спрашивай "и что мне с этого?". На конкретные выгоды реагируй положительно.`,
    objections: `Ты — покупатель в ${nicheLabel}. Начни с "Дорого" или "Я подумаю". Смягчайся только на хорошие аргументы. Нужно минимум 2-3 аргумента.`,
    closing: `Ты — покупатель в ${nicheLabel} почти готовый купить. Жди пока менеджер предложит оформить. Если не предлагает — уходи. На прямое предложение соглашайся.`,
  };
  return `${scenarios[stage]}\n\nПРАВИЛА:\n- Отвечай только на русском языке.\n- Коротко — 1-2 предложения.\n- Никогда не объясняй свою роль — просто будь покупателем.\n- После 6 сообщений прими решение.\n- Если менеджер хорошо справился — "Хорошо, оформляйте".\n- Если плохо — "Нет, пойду в другое место".`;
}

function buildEvalPrompt(stage) {
  const { keys, labels } = CRITERIA[stage];
  const ex = {};
  keys.forEach(k => ex[k] = 5);
  return `Ты тренер по продажам. Оцени МЕНЕДЖЕРА в диалоге. Критерии: ${keys.map((k,i) => k+'('+labels[i]+')').join(', ')}. Ответь ТОЛЬКО JSON без markdown: ${JSON.stringify({scores: ex, totalScore: 5, verdict: "Хорошо", bestMoment: "текст", worstMoment: "текст", tip: "текст"})}`;
}

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
  const color = value >= 8 ? '#10b981' : value >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}/10</span>
      </div>
      <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState('login');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [niche, setNiche] = useState('');
  const [stage, setStage] = useState('');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  function handleLogin() {
    const code = codeInput.trim().toUpperCase();
    if (ACCESS_CODES.includes(code)) {
      setStep('niche');
      setCodeError('');
    } else {
      setCodeError('Неверный код доступа. Обратитесь к организатору.');
    }
  }

  function startChat(selectedStage) {
    const firstMsg = {
      contact: 'Здравствуйте',
      needs: 'Привет, хочу кое-что купить',
      presentation: 'Расскажите про ваш продукт',
      objections: 'Интересно, но дорого...',
      closing: 'Ну понятно, надо подумать',
    }[selectedStage];
    setHistory([{ from: 'client', text: firstMsg }]);
    setStep('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const newHistory = [...history, { from: 'manager', text }];
    setHistory(newHistory);
    setLoading(true);
    const allMsgs = newHistory.map(m => ({ role: m.from === 'manager' ? 'user' : 'assistant', content: m.text }));
    while (allMsgs.length > 0 && allMsgs[0].role === 'assistant') allMsgs.shift();
    try {
      const reply = await askClaude(buildSystemPrompt(niche, stage), allMsgs);
      const updated = [...newHistory, { from: 'client', text: reply }];
      setHistory(updated);
      const count = updated.filter(m => m.from === 'manager').length;
      if (count >= 6) setTimeout(() => evaluate(updated), 800);
    } catch {
      setHistory(prev => [...prev, { from: 'client', text: 'Ошибка соединения...' }]);
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(fin) {
    setStep('evaluating');
    const dialog = fin.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
    const keys = CRITERIA[stage].keys;
    try {
      const raw = await askClaude(buildEvalPrompt(stage), [{ role: 'user', content: dialog }]);
      const clean = raw.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(clean));
    } catch {
      const def = {};
      keys.forEach(k => def[k] = 5);
      setResult({ scores: def, totalScore: 5, verdict: 'Хорошо', bestMoment: 'Старались.', worstMoment: 'Нет данных.', tip: 'Практикуйтесь!' });
    }
    setStep('result');
  }

  function reset() { setHistory([]); setResult(null); setInput(''); setStep('niche'); setNiche(''); setStage(''); }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
  const stageData = STAGES.find(s => s.id === stage);
  const nicheData = NICHES.find(n => n.id === niche);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'Inter,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>SalesAI</div>
          <div style={{ fontSize: 11, color: '#475569' }}>Тренажёр продаж</div>
        </div>
        {(step === 'chat' || step === 'evaluating') && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#475569' }}>{nicheData?.emoji} {nicheData?.label}</span>
            <span style={{ fontSize: 11, color: '#3b82f6' }}>· {stageData?.emoji} {stageData?.label}</span>
            <button onClick={() => evaluate(history)} style={{ marginLeft: 8, background: 'none', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Завершить →</button>
          </div>
        )}
      </div>

      {/* LOGIN */}
      {step === 'login' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Введите код доступа</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Код выдаётся при покупке доступа</p>
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Например: SALES2024"
              style={{ width: '100%', background: '#0f172a', border: `1px solid ${codeError ? '#ef4444' : '#1e293b'}`, borderRadius: 10, color: '#e2e8f0', fontSize: 16, padding: '12px 16px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 2, marginBottom: 12 }}
            />
            {codeError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{codeError}</p>}
            <button
              onClick={handleLogin}
              disabled={!codeInput.trim()}
              style={{ width: '100%', background: codeInput.trim() ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: codeInput.trim() ? 'pointer' : 'default' }}
            >
              Войти →
            </button>
          </div>
        </div>
      )}

      {/* NICHE */}
      {step === 'niche' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 1 из 2</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Выберите нишу</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>AI подстроит покупателя под ваш бизнес</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {NICHES.map(n => (
              <button key={n.id} onClick={() => { setNiche(n.id); setStep('stage'); }}
                style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{n.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#e2e8f0' }}>{n.label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{n.examples}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE */}
      {step === 'stage' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => setStep('niche')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Назад</button>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Шаг 2 из 2</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Этап продаж</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>Ниша: {nicheData?.emoji} {nicheData?.label}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STAGES.map((s, i) => (
              <button key={s.id} onClick={() => { setStage(s.id); startChat(s.id); }}
                style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, color: '#e2e8f0' }}>{i + 1}. {s.label}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CHAT */}
      {(step === 'chat' || step === 'evaluating') && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#334155', background: '#0f172a', padding: '3px 12px', borderRadius: 20 }}>Покупатель — {nicheData?.label}</span>
            </div>
            {history.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'client' ? 'flex-start' : 'flex-end', gap: 8 }}>
                {m.from === 'client' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>}
                <div style={{ maxWidth: '72%', padding: '10px 14px', fontSize: 14, lineHeight: 1.5, borderRadius: m.from === 'client' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: m.from === 'client' ? '#0f172a' : '#1d4ed8', color: '#e2e8f0', border: m.from === 'client' ? '1px solid #1e293b' : 'none' }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', color: '#334155', letterSpacing: 4, fontSize: 18 }}>•••</div>
              </div>
            )}
            {step === 'evaluating' && <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: 14, padding: 16 }}>⏳ Анализирую диалог...</div>}
            <div ref={bottomRef} />
          </div>
          {step === 'chat' && (
            <div style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '10px 14px', display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Ваш ответ покупателю..." style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={send} disabled={!input.trim() || loading} style={{ background: input.trim() && !loading ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 18, cursor: 'pointer' }}>↑</button>
            </div>
          )}
        </>
      )}

      {/* RESULT */}
      {step === 'result' && result && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>{nicheData?.emoji} {nicheData?.label} · {stageData?.emoji} {stageData?.label}</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: vc[result.verdict] || '#3b82f6', lineHeight: 1 }}>{result.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>из 10</div>
              <div style={{ display: 'inline-block', background: (vc[result.verdict] || '#3b82f6') + '22', color: vc[result.verdict] || '#3b82f6', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>{result.verdict}</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Детальная оценка</div>
              {CRITERIA[stage].keys.map((k, i) => (
                <Bar key={k} label={CRITERIA[stage].labels[i]} value={result.scores[k] || 5} />
              ))}
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              {[{ label: '✓ Лучший момент', text: result.bestMoment, color: '#10b981' }, { label: '✗ Главная ошибка', text: result.worstMoment, color: '#ef4444' }, { label: '→ Совет', text: result.tip, color: '#f59e0b' }].map(({ label, text, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setHistory([]); setResult(null); setInput(''); startChat(stage); }} style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🔄 Повторить</button>
              <button onClick={reset} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⚡ Новый сценарий</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
