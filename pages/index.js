import { useState, useRef, useEffect } from "react";

const ACCESS_CODES = ["JUNE2025", "DEMO123"];

const BUSINESS_TYPES = {
  ru: [
    { id: "retail", label: "Товарный бизнес", emoji: "🛒" },
    { id: "services", label: "Услуги", emoji: "💼" },
    { id: "b2b", label: "B2B", emoji: "🏢" },
    { id: "b2c", label: "B2C", emoji: "👤" },
  ],
  kz: [
    { id: "retail", label: "Тауарлы бизнес", emoji: "🛒" },
    { id: "services", label: "Қызметтер", emoji: "💼" },
    { id: "b2b", label: "B2B", emoji: "🏢" },
    { id: "b2c", label: "B2C", emoji: "👤" },
  ]
};

const STAGES = {
  ru: [
    { id: "contact", label: "Установление контакта", emoji: "👋", desc: "Первое впечатление, приветствие" },
    { id: "needs", label: "Выявление потребностей", emoji: "🔍", desc: "Правильные вопросы, понять боль" },
    { id: "presentation", label: "Презентация", emoji: "🎯", desc: "Показать ценность и выгоды" },
    { id: "objections", label: "Отработка возражений", emoji: "🛡️", desc: "Дорого, подумаю, не нужно" },
    { id: "closing", label: "Закрытие сделки", emoji: "✅", desc: "Довести до покупки" },
  ],
  kz: [
    { id: "contact", label: "Байланыс орнату", emoji: "👋", desc: "Бірінші әсер, сәлемдесу" },
    { id: "needs", label: "Қажеттіліктерді анықтау", emoji: "🔍", desc: "Дұрыс сұрақтар, проблеманы түсіну" },
    { id: "presentation", label: "Презентация", emoji: "🎯", desc: "Құндылық пен пайданы көрсету" },
    { id: "objections", label: "Қарсылықтарды өңдеу", emoji: "🛡️", desc: "Қымбат, ойланамын, керек емес" },
    { id: "closing", label: "Мәмілені жабу", emoji: "✅", desc: "Сатып алуға жеткізу" },
  ]
};

const CRITERIA = {
  contact: { keys: ["greeting","rapport","energy","opening","interest"], ru: ["Приветствие","Расположение","Энергия","Открытие","Интерес"], kz: ["Сәлемдесу","Сенімділік","Энергия","Ашу","Қызығушылық"] },
  needs: { keys: ["questions","listening","empathy","discovery","summary"], ru: ["Вопросы","Слушание","Эмпатия","Выявление","Резюме"], kz: ["Сұрақтар","Тыңдау","Эмпатия","Анықтау","Қорыту"] },
  presentation: { keys: ["benefits","examples","clarity","value","relevance"], ru: ["Выгоды","Примеры","Ясность","Ценность","Релевантность"], kz: ["Пайда","Мысалдар","Анықтық","Құндылық","Өзектілік"] },
  objections: { keys: ["joining","questions","arguments","price","closing"], ru: ["Присоединение","Уточнение","Аргументы","Цена","Закрытие"], kz: ["Қосылу","Нақтылау","Дәлелдер","Баға","Жабу"] },
  closing: { keys: ["signal","offer","urgency","confirmation","nextStep"], ru: ["Сигнал","Предложение","Срочность","Подтверждение","Следующий шаг"], kz: ["Сигнал","Ұсыныс","Шұғылдық","Растау","Келесі қадам"] },
};

const COACHING_PROMPT = {
  ru: `Ты опытный тренер по продажам. Менеджер описал свою проблему в продажах.

Дай развёрнутый разбор в формате JSON:
{
  "stage": "objections",
  "stageLabel": "Отработка возражений",
  "why": "Почему клиенты так говорят — психологическая причина (3-4 предложения)",
  "mistake": "Главная ошибка которую делают менеджеры в этой ситуации (2-3 предложения)",
  "phrases": [
    "Готовая фраза 1 для ответа клиенту",
    "Готовая фраза 2",
    "Готовая фраза 3",
    "Готовая фраза 4"
  ],
  "tip": "Главный совет — одно конкретное действие которое изменит ситуацию (2-3 предложения)"
}

Отвечай ТОЛЬКО JSON без markdown.`,

  kz: `Сен тәжірибелі сату жаттықтырушысысың. Менеджер сату мәселесін сипаттады.

Толық талдауды JSON форматында бер:
{
  "stage": "objections",
  "stageLabel": "Қарсылықтарды өңдеу",
  "why": "Клиенттер неліктен солай айтады — психологиялық себеп (3-4 сөйлем қазақша)",
  "mistake": "Менеджерлер жіберетін басты қате (2-3 сөйлем қазақша)",
  "phrases": [
    "Клиентке дайын жауап 1",
    "Дайын жауап 2",
    "Дайын жауап 3",
    "Дайын жауап 4"
  ],
  "tip": "Басты кеңес — жағдайды өзгертетін бір нақты әрекет (2-3 сөйлем қазақша)"
}

ТЕК JSON қайтар, markdown жоқ.`
};

function buildBuyerPrompt(business, stage, lang, problem) {
  const bLabel = BUSINESS_TYPES[lang].find(b => b.id === business)?.label || business;
  const extra = problem ? (lang === 'kz' ? `\nМенеджер проблемасы: "${problem}"` : `\nПроблема менеджера: "${problem}"`) : '';

  if (lang === 'kz') {
    const s = {
      contact: `Сіз ${bLabel} саласының сатып алушысыз. Жаңа келдіңіз. Бейтарап.`,
      needs: `Сіз ${bLabel} саласының сатып алушысыз. Қажеттілігіңіз бар бірақ айта алмайсыз.`,
      presentation: `Сіз ${bLabel} саласының скептик сатып алушысыз. Пайда көрмесе сұраңыз.`,
      objections: `Сіз ${bLabel} саласының сатып алушысыз. "Қымбат" деп бастаңыз.`,
      closing: `Сіз ${bLabel} саласында сатып алуға дерлік дайынсыз.`,
    }[stage];
    return `${s}${extra}\n\nЕРЕЖЕЛЕР: Тек таза қазақ тілінде. 1-2 сөйлем. Рөліңізді түсіндірмеңіз. 6 хабарламадан кейін шешім қабылдаңыз.`;
  }

  const s = {
    contact: `Ты — покупатель в ${bLabel}. Только зашёл. Нейтральный.`,
    needs: `Ты — покупатель в ${bLabel} с неосознанной потребностью.`,
    presentation: `Ты — скептичный покупатель в ${bLabel}. На свойства — "и что мне с этого?".`,
    objections: `Ты — покупатель в ${bLabel}. Начни с "Дорого" или "Я подумаю".`,
    closing: `Ты — покупатель в ${bLabel} почти готовый купить.`,
  }[stage];
  return `${s}${extra}\n\nПРАВИЛА: Только русский. 1-2 предложения. Не объясняй роль. После 6 сообщений прими решение.`;
}

function buildEvalPrompt(stage, lang, problem) {
  const { keys } = CRITERIA[stage];
  const labels = CRITERIA[stage][lang];
  const ex = {};
  keys.forEach(k => ex[k] = 5);
  const note = lang === 'kz' ? 'Барлық мәтінді қазақша жаз.' : 'Всё на русском.';
  const extra = problem ? ` Проблема: "${problem}".` : '';
  return `Тренер по продажам. Оцени МЕНЕДЖЕРА.${extra} Критерии: ${keys.map((k,i)=>k+'('+labels[i]+')').join(', ')}. ${note} ТОЛЬКО JSON: ${JSON.stringify({scores:ex,totalScore:5,verdict:"Хорошо",bestMoment:"",worstMoment:"",tip:""})}`;
}

async function callAPI(system, messages, lang) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, lang })
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
  const [lang, setLang] = useState('ru');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [mode, setMode] = useState('');
  const [problem, setProblem] = useState('');
  const [coaching, setCoaching] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [business, setBusiness] = useState('');
  const [stage, setStage] = useState('');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  const isKz = lang === 'kz';

  function handleLogin() {
    if (ACCESS_CODES.map(c => c.toUpperCase()).includes(codeInput.trim().toUpperCase())) {
      setStep('lang'); setCodeError('');
    } else {
      setCodeError(isKz ? 'Қате код.' : 'Неверный код.');
    }
  }

  async function handleCoach() {
    if (!problem.trim()) return;
    setLoadingCoach(true);
    try {
      const raw = await callAPI(COACHING_PROMPT[lang], [{ role: 'user', content: problem }], lang);
      const clean = raw.replace(/```json|```/g, '').trim();
      setCoaching(JSON.parse(clean));
      setStep('coaching');
    } catch {
      setCoaching({ stage: 'objections', stageLabel: isKz ? 'Қарсылықтарды өңдеу' : 'Отработка возражений', why: isKz ? 'Клиенттер бағаны сынамайды — олар пайданы көрмейді.' : 'Клиенты не атакуют цену — они не видят ценность.', mistake: isKz ? 'Менеджер бірден жеңілдік береді.' : 'Менеджер сразу даёт скидку.', phrases: isKz ? ['Иә, баға маңызды. Нені ескерттіңіз?', 'Басқалармен салыстырып жатырсыз ба?'] : ['Да, цена важна. Что именно смущает?', 'Сравниваете с чем-то конкретным?'], tip: isKz ? 'Алдымен пайданы анықтаңыз.' : 'Сначала выясните ценность.' });
      setStep('coaching');
    } finally {
      setLoadingCoach(false);
    }
  }

  function startPractice() {
    const stageId = coaching?.stage || stage;
    const firstMsgs = {
      ru: { contact: 'Здравствуйте', needs: 'Привет, хочу кое-что купить', presentation: 'Расскажите про продукт', objections: 'Интересно, но дорого...', closing: 'Надо подумать' },
      kz: { contact: 'Сәлеметсіз бе', needs: 'Сәлем, бір нәрсе алғым келеді', presentation: 'Өніміңіз туралы айтыңызшы', objections: 'Қызықты, бірақ қымбат...', closing: 'Ойланып көрейін' }
    };
    if (coaching) setStage(coaching.stage);
    setHistory([{ from: 'client', text: firstMsgs[lang][coaching?.stage || stage] }]);
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
      const reply = await callAPI(buildBuyerPrompt(business, coaching?.stage || stage, lang, problem), allMsgs, lang);
      const updated = [...newHistory, { from: 'client', text: reply }];
      setHistory(updated);
      const count = updated.filter(m => m.from === 'manager').length;
      if (count >= 6) setTimeout(() => evaluate(updated), 800);
    } catch {
      setHistory(prev => [...prev, { from: 'client', text: '...' }]);
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(fin) {
    setStep('evaluating');
    const dialog = fin.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
    const stageId = coaching?.stage || stage;
    const keys = CRITERIA[stageId]?.keys || CRITERIA.objections.keys;
    try {
      const raw = await callAPI(buildEvalPrompt(stageId, lang, problem), [{ role: 'user', content: dialog }], 'ru');
      const clean = raw.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(clean));
    } catch {
      const def = {};
      keys.forEach(k => def[k] = 5);
      setResult({ scores: def, totalScore: 5, verdict: 'Хорошо', bestMoment: '—', worstMoment: '—', tip: '—' });
    }
    setStep('result');
  }

  function reset() {
    setHistory([]); setResult(null); setInput(''); setStep('home');
    setBusiness(''); setStage(''); setProblem(''); setCoaching(null); setMode('');
  }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
  const stageId = coaching?.stage || stage;
  const stageData = STAGES[lang]?.find(s => s.id === stageId);
  const bizData = BUSINESS_TYPES[lang]?.find(b => b.id === business);
  const card = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'left' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'Inter,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>SalesAI</div>
          <div style={{ fontSize: 11, color: '#475569' }}>{isKz ? 'Сату жаттықтырушысы' : 'Тренажёр продаж'}</div>
        </div>
        {step !== 'login' && step !== 'lang' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {(step === 'chat' || step === 'evaluating') && (
              <button onClick={() => evaluate(history)} style={{ background: 'none', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                {isKz ? 'Аяқтау →' : 'Завершить →'}
              </button>
            )}
            <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ background: '#1e293b', border: 'none', borderRadius: 6, color: '#e2e8f0', padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {isKz ? '🇷🇺 RU' : '🇰🇿 KZ'}
            </button>
          </div>
        )}
      </div>

      {/* LOGIN */}
      {step === 'login' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Введите код доступа</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Kod при покупке / Код кіру үшін беріледі</p>
            <input value={codeInput} onChange={e => { setCodeInput(e.target.value); setCodeError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Код..."
              style={{ width: '100%', background: '#0f172a', border: `1px solid ${codeError ? '#ef4444' : '#1e293b'}`, borderRadius: 10, color: '#e2e8f0', fontSize: 18, padding: '14px 16px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 3, marginBottom: 12, textTransform: 'uppercase' }} />
            {codeError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{codeError}</p>}
            <button onClick={handleLogin} disabled={!codeInput.trim()} style={{ width: '100%', background: codeInput.trim() ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: codeInput.trim() ? 'pointer' : 'default' }}>Войти / Кіру →</button>
          </div>
        </div>
      )}

      {/* LANG */}
      {step === 'lang' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>SalesAI</h1>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>Тренажёр продаж / Сату жаттықтырушысы</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button onClick={() => { setLang('ru'); setStep('home'); }} style={{ background: '#0f172a', border: '2px solid #3b82f6', borderRadius: 14, padding: '20px 32px', cursor: 'pointer', color: '#e2e8f0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🇷🇺</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Русский</div>
              </button>
              <button onClick={() => { setLang('kz'); setStep('home'); }} style={{ background: '#0f172a', border: '2px solid #10b981', borderRadius: 14, padding: '20px 32px', cursor: 'pointer', color: '#e2e8f0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🇰🇿</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Қазақша</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOME */}
      {step === 'home' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{isKz ? 'Қалай бастағыңыз келеді?' : 'Как хотите начать?'}</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={() => setStep('problem')} style={{ ...card, border: '1px solid #3b82f6' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{isKz ? 'Проблемамды сипаттау' : 'Описать свою проблему'}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'AI проблемаңызды талдап, дайын жауаптар мен кеңестер береді. Содан кейін жаттығу.' : 'AI разберёт проблему, объяснит причину, даст готовые фразы и советы. Потом практика.'}</div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#3b82f6', background: '#1e3a5f', padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{isKz ? '✨ Ұсынылады' : '✨ Рекомендуем'}</div>
              </button>
              <button onClick={() => setStep('business')} style={card}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{isKz ? 'Кезеңді өзім таңдау' : 'Выбрать этап самому'}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'Бизнес түрі мен сату кезеңін таңдап жаттығу.' : 'Выберите тип бизнеса и этап продаж — сразу к практике.'}</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROBLEM INPUT */}
      {step === 'problem' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{isKz ? 'Проблемаңызды жазыңыз' : 'Опишите вашу проблему'}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{isKz ? 'AI проблемаңызды талдап, нақты кеңестер мен дайын жауаптар береді' : 'AI разберёт ситуацию, объяснит причину и даст конкретные фразы'}</p>
            
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#475569', padding: '4px 8px', marginBottom: 4 }}>{isKz ? 'Мысалдар:' : 'Примеры:'}</div>
              {(isKz ? [
                'Клиент қымбат деп кетіп қалады',
                'Клиентпен қалай сөйлесуді білмеймін',
                'Клиент тыңдайды бірақ сатып алмайды',
                'Клиентке не керектігін анықтай алмаймын',
                'Кездесуге шақырсам келмейді'
              ] : [
                'Клиенты говорят «дорого» и уходят',
                'Не знаю как начать разговор с клиентом',
                'Клиент слушает презентацию но не покупает',
                'Не могу выяснить что нужно клиенту',
                'Клиенты просят скидку — не знаю что отвечать'
              ]).map(ex => (
                <button key={ex} onClick={() => setProblem(ex)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '5px 8px', textAlign: 'left', display: 'block', width: '100%' }}>→ {ex}</button>
              ))}
            </div>

            <textarea value={problem} onChange={e => setProblem(e.target.value)}
              placeholder={isKz ? 'Мысалы: клиенттер қымбат деп кетіп қалады...' : 'Например: клиенты говорят дорого и уходят...'}
              style={{ width: '100%', minHeight: 100, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />

            <button onClick={handleCoach} disabled={!problem.trim() || loadingCoach}
              style={{ width: '100%', background: problem.trim() && !loadingCoach ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: problem.trim() ? 'pointer' : 'default' }}>
              {loadingCoach ? (isKz ? '⏳ Талдап жатырмын...' : '⏳ Анализирую...') : (isKz ? 'Талдау алу →' : 'Получить разбор →')}
            </button>
          </div>
        </div>
      )}

      {/* COACHING */}
      {step === 'coaching' && coaching && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            
            {/* Problem */}
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
              💬 {isKz ? 'Сіздің проблемаңыз' : 'Ваша проблема'}: <span style={{ color: '#e2e8f0' }}>{problem}</span>
            </div>

            {/* Stage */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{isKz ? 'Жаттығу керек кезең' : 'Нужно тренировать'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{STAGES[lang].find(s => s.id === coaching.stage)?.emoji || '🛡️'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{coaching.stageLabel}</div>
              </div>
            </div>

            {/* Why */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>🧠 {isKz ? 'Неліктен солай болады?' : 'Почему так происходит?'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{coaching.why}</div>
            </div>

            {/* Mistake */}
            <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>✗ {isKz ? 'Менеджерлердің басты қатесі' : 'Главная ошибка менеджеров'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{coaching.mistake}</div>
            </div>

            {/* Phrases */}
            <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>💬 {isKz ? 'Дайын жауаптар' : 'Готовые фразы'}</div>
              {coaching.phrases?.map((phrase, i) => (
                <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{phrase}
                </div>
              ))}
            </div>

            {/* Tip */}
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>→ {isKz ? 'Басты кеңес' : 'Главный совет'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{coaching.tip}</div>
            </div>

            {/* Practice button */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{isKz ? '🎯 Енді жаттығу уақыты!' : '🎯 Теперь время практики!'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{isKz ? 'AI сатып алушы рөлін ойнайды. Үйренгеніңізді қолданыңыз.' : 'AI сыграет покупателя. Примените то что узнали.'}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('business_quick')} style={{ flex: 1, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  ⚡ {isKz ? 'Жаттығуды бастау' : 'Начать практику'}
                </button>
                <button onClick={() => setStep('home')} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, cursor: 'pointer' }}>
                  {isKz ? 'Кейін' : 'Позже'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS QUICK (after coaching) */}
      {step === 'business_quick' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 500, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{isKz ? 'Соңғы қадам' : 'Последний шаг'}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{isKz ? 'Бизнес түріңіз?' : 'Тип вашего бизнеса?'}</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {BUSINESS_TYPES[lang].map(b => (
              <button key={b.id} onClick={() => { setBusiness(b.id); startPractice(); }} style={card}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{b.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BUSINESS SELECT */}
      {step === 'business' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 500, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{isKz ? '1/2 қадам' : 'Шаг 1 из 2'}</div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{isKz ? 'Бизнес түрін таңдаңыз' : 'Тип бизнеса'}</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {BUSINESS_TYPES[lang].map(b => (
              <button key={b.id} onClick={() => { setBusiness(b.id); setStep('stage'); }} style={card}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{b.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE SELECT */}
      {step === 'stage' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 500, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => setStep('business')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{isKz ? '2/2 қадам' : 'Шаг 2 из 2'}</div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{isKz ? 'Сату кезеңі' : 'Этап продаж'}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>{bizData?.emoji} {bizData?.label}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STAGES[lang].map((s, i) => (
              <button key={s.id} onClick={() => { setStage(s.id); startPractice(); }}
                style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{i + 1}. {s.label}</div>
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
            {problem && (
              <div style={{ background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#93c5fd' }}>
                💬 {isKz ? 'Жаттығу мәселесі' : 'Тренировка под проблему'}: «{problem}»
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#334155', background: '#0f172a', padding: '3px 12px', borderRadius: 20 }}>
                {isKz ? 'Сатып алушы' : 'Покупатель'} — {bizData?.label || ''} {stageData ? `· ${stageData.emoji} ${stageData.label}` : ''}
              </span>
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
            {step === 'evaluating' && <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: 14, padding: 16 }}>⏳ {isKz ? 'Талдап жатырмын...' : 'Анализирую диалог...'}</div>}
            <div ref={bottomRef} />
          </div>
          {step === 'chat' && (
            <div style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '10px 14px', display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder={isKz ? 'Сатып алушыға жауабыңыз...' : 'Ваш ответ покупателю...'}
                style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }} />
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
              <div style={{ fontSize: 72, fontWeight: 900, color: vc[result.verdict] || '#3b82f6', lineHeight: 1 }}>{result.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>{isKz ? '10-нан' : 'из 10'}</div>
              <div style={{ display: 'inline-block', background: (vc[result.verdict] || '#3b82f6') + '22', color: vc[result.verdict] || '#3b82f6', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>
                {{ 'Отлично': isKz ? 'Өте жақсы' : 'Отлично', 'Хорошо': isKz ? 'Жақсы' : 'Хорошо', 'Нужна практика': isKz ? 'Жаттығу керек' : 'Нужна практика', 'Слабо': isKz ? 'Нашар' : 'Слабо' }[result.verdict] || result.verdict}
              </div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{isKz ? 'Толық баға' : 'Детальная оценка'}</div>
              {CRITERIA[stageId]?.keys.map((k, i) => (
                <Bar key={k} label={CRITERIA[stageId][lang][i]} value={result.scores[k] || 5} />
              ))}
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              {[
                { label: isKz ? '✓ Үздік сәт' : '✓ Лучший момент', text: result.bestMoment, color: '#10b981' },
                { label: isKz ? '✗ Басты қате' : '✗ Главная ошибка', text: result.worstMoment, color: '#ef4444' },
                { label: isKz ? '→ Кеңес' : '→ Совет', text: result.tip, color: '#f59e0b' }
              ].map(({ label, text, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setHistory([]); setResult(null); setInput(''); startPractice(); }} style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isKz ? '🔄 Қайталау' : '🔄 Повторить'}
              </button>
              <button onClick={reset} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isKz ? '⚡ Қайтадан' : '⚡ Заново'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
