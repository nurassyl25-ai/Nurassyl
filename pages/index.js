import { useState, useRef, useEffect } from "react";

const ACCESS_CODES = [
  "JUNE2025",
  "DEMO123",
];

const NICHES = {
  ru: [
    { id: "retail", label: "Товарный бизнес", emoji: "🛒", examples: "магазин, маркетплейс, опт" },
    { id: "services", label: "Услуги", emoji: "💼", examples: "салон, ремонт, обучение, консалтинг" },
    { id: "b2b", label: "B2B", emoji: "🏢", examples: "корпоративные продажи, поставки" },
    { id: "b2c", label: "B2C", emoji: "👤", examples: "розничные продажи физлицам" },
  ],
  kz: [
    { id: "retail", label: "Тауарлы бизнес", emoji: "🛒", examples: "дүкен, маркетплейс, көтерме" },
    { id: "services", label: "Қызметтер", emoji: "💼", examples: "салон, жөндеу, оқыту, кеңес" },
    { id: "b2b", label: "B2B", emoji: "🏢", examples: "корпоративтік сатылымдар" },
    { id: "b2c", label: "B2C", emoji: "👤", examples: "жеке тұлғаларға сату" },
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

const T = {
  ru: {
    login: "Введите код доступа", loginDesc: "Код выдаётся при покупке доступа", loginBtn: "Войти →", loginError: "Неверный код. Обратитесь к организатору.",
    homeTitle: "Как хотите начать?", homeDesc: "Выберите удобный способ обучения",
    mode1Title: "Описать свою проблему", mode1Desc: "Опишу с чем сталкиваюсь — AI подберёт нужный этап и объяснит что тренировать",
    mode2Title: "Выбрать этап самому", mode2Desc: "Знаю что хочу потренировать — выберу сам",
    recommended: "✨ Рекомендуем",
    problemTitle: "Опишите вашу проблему", problemDesc: "AI подберёт нужный этап и объяснит как тренироваться",
    problemExamples: ["Клиенты говорят «дорого» и уходят", "Не знаю как начать разговор", "Клиент слушает но не покупает", "Не могу выяснить что нужно клиенту"],
    problemPlaceholder: "Например: клиенты говорят дорого и уходят...",
    analyzeBtn: "Подобрать тренировку →", analyzing: "⏳ Анализирую...",
    analysisTitle: "Анализ вашей проблемы", needTrain: "Нужно тренировать:", focus: "ФОКУС ТРЕНИРОВКИ",
    startBtn: "⚡ Начать тренировку", changeProblem: "← Изменить проблему",
    nicheTitle: "Выберите тип бизнеса", nicheQuickTitle: "В каком бизнесе работаете?",
    stageTitle: "Этап продаж", step1: "Шаг 1 из 2", step2: "Шаг 2 из 2", lastStep: "Последний шаг",
    back: "← Назад", finish: "Завершить →", buyer: "Покупатель",
    placeholder: "Ваш ответ покупателю...", analyzing2: "⏳ Анализирую диалог...",
    detailTitle: "Детальная оценка", best: "✓ Лучший момент", worst: "✗ Главная ошибка", tip: "→ Совет",
    retry: "🔄 Повторить", newScene: "⚡ Заново", outOf: "из 10",
    verdicts: { "Отлично": "Отлично", "Хорошо": "Хорошо", "Нужна практика": "Нужна практика", "Слабо": "Слабо" },
    problemContext: "Тренировка под вашу проблему:",
  },
  kz: {
    login: "Кіру кодын енгізіңіз", loginDesc: "Код қол жеткізуді сатып алғанда беріледі", loginBtn: "Кіру →", loginError: "Қате код. Ұйымдастырушыға хабарласыңыз.",
    homeTitle: "Қалай бастағыңыз келеді?", homeDesc: "Ыңғайлы оқу тәсілін таңдаңыз",
    mode1Title: "Проблемамды сипаттау", mode1Desc: "Не кездесетінімді айтамын — AI қажетті кезеңді таңдайды",
    mode2Title: "Кезеңді өзім таңдау", mode2Desc: "Не жаттықтырғым келетінін білемін — өзім таңдаймын",
    recommended: "✨ Ұсынылады",
    problemTitle: "Проблемаңызды сипаттаңыз", problemDesc: "AI қажетті кезеңді таңдап, қалай жаттығу керектігін түсіндіреді",
    problemExamples: ["Клиенттер 'қымбат' деп кетіп қалады", "Клиентпен қалай сөйлесуді білмеймін", "Клиент тыңдайды бірақ сатып алмайды", "Клиентке не керектігін анықтай алмаймын"],
    problemPlaceholder: "Мысалы: клиенттер қымбат деп кетіп қалады...",
    analyzeBtn: "Жаттығуды таңдау →", analyzing: "⏳ Талдап жатырмын...",
    analysisTitle: "Проблемаңызды талдау", needTrain: "Жаттығу керек:", focus: "ЖАТТЫҒУ ФОКУСЫ",
    startBtn: "⚡ Жаттығуды бастау", changeProblem: "← Проблеманы өзгерту",
    nicheTitle: "Бизнес түрін таңдаңыз", nicheQuickTitle: "Қандай бизнесте жұмыс жасайсыз?",
    stageTitle: "Сату кезеңі", step1: "1/2 қадам", step2: "2/2 қадам", lastStep: "Соңғы қадам",
    back: "← Артқа", finish: "Аяқтау →", buyer: "Сатып алушы",
    placeholder: "Сатып алушыға жауабыңыз...", analyzing2: "⏳ Диалогты талдап жатырмын...",
    detailTitle: "Толық баға", best: "✓ Үздік сәт", worst: "✗ Басты қате", tip: "→ Кеңес",
    retry: "🔄 Қайталау", newScene: "⚡ Қайтадан", outOf: "10-нан",
    verdicts: { "Отлично": "Өте жақсы", "Хорошо": "Жақсы", "Нужна практика": "Жаттығу керек", "Слабо": "Нашар" },
    problemContext: "Проблемаңызға арналған жаттығу:",
  }
};

function buildSystemPrompt(niche, stage, lang, problemContext) {
  const nicheLabel = NICHES[lang].find(n => n.id === niche)?.label || niche;
  const extra = problemContext ? (lang === 'kz' ? `\nМенеджердің проблемасы: "${problemContext}" — осы аспектіде шынайы бол.` : `\nКонтекст проблемы: "${problemContext}" — будь реалистичным в этом аспекте.`) : '';

  if (lang === 'kz') {
    const scenarios = {
      contact: `Сіз ${nicheLabel} саласындағы сатып алушысыз. Жаңа келдіңіз. Бейтарап күйде тұрсыз. Менеджер жақсы сәлемдессе — ашылыңыз.`,
      needs: `Сіз ${nicheLabel} саласындағы сатып алушысыз. Қажеттілігіңіз бар бірақ толық айта алмайсыз. Тек жақсы сұрақтарға жауап беріңіз.`,
      presentation: `Сіз ${nicheLabel} саласының скептик сатып алушысыз. Қасиеттер айтса — пайдасын сұраңыз.`,
      objections: `Сіз ${nicheLabel} саласының сатып алушысыз. "Қымбат" немесе "Ойланамын" деп бастаңыз. Жақсы дәлелдерге ғана жұмсарыңыз.`,
      closing: `Сіз ${nicheLabel} саласында сатып алуға дайын тұрғансыз. Менеджер ұсынғанша күтіңіз.`,
    };
    return `${scenarios[stage]}${extra}\n\nЕРЕЖЕЛЕР:\n- Тек таза қазақ тілінде жазыңыз\n- Қысқа — 1-2 сөйлем\n- Рөліңізді түсіндірмеңіз\n- 6 хабарламадан кейін шешім қабылдаңыз\n- Жақсы жұмыс: "Жарайды, рәсімдеңіз"\n- Нашар жұмыс: "Жоқ, басқа жерге барамын"`;
  }

  const scenarios = {
    contact: `Ты — покупатель в ${nicheLabel}. Только зашёл. Нейтральный. На вялое приветствие — коротко, на энергичное — открывайся.`,
    needs: `Ты — покупатель в ${nicheLabel} с неосознанной потребностью. Раскрывайся только на хорошие вопросы.`,
    presentation: `Ты — скептичный покупатель в ${nicheLabel}. На свойства без выгод — "и что мне с этого?".`,
    objections: `Ты — покупатель в ${nicheLabel}. Начни с "Дорого" или "Я подумаю". Минимум 2-3 аргумента для смягчения.`,
    closing: `Ты — покупатель в ${nicheLabel} почти готовый купить. Жди предложения. На прямое — соглашайся.`,
  };
  return `${scenarios[stage]}${extra}\n\nПРАВИЛА:\n- Только русский язык\n- 1-2 предложения\n- Не объясняй роль\n- После 6 сообщений прими решение\n- Хорошо: "Хорошо, оформляйте"\n- Плохо: "Нет, пойду в другое место"`;
}

function buildEvalPrompt(stage, lang, problemContext) {
  const { keys } = CRITERIA[stage];
  const labels = CRITERIA[stage][lang];
  const ex = {};
  keys.forEach(k => ex[k] = 5);
  const extra = problemContext ? (lang === 'kz' ? ` Проблема: "${problemContext}".` : ` Проблема менеджера: "${problemContext}".`) : '';
  const note = lang === 'kz' ? 'bestMoment, worstMoment, tip өрістерін қазақша жаз.' : 'Поля пиши на русском.';
  return `Ты тренер по продажам. Оцени МЕНЕДЖЕРА.${extra} Критерии: ${keys.map((k,i)=>k+'('+labels[i]+')').join(', ')}. ${note} ТОЛЬКО JSON: ${JSON.stringify({scores:ex,totalScore:5,verdict:"Хорошо",bestMoment:"текст",worstMoment:"текст",tip:"текст"})}`;
}

const ANALYZE_PROMPTS = {
  ru: `Ты тренер по продажам. Продавец описал проблему. Определи какой этап нужно тренировать (contact/needs/presentation/objections/closing) и объясни почему. ТОЛЬКО JSON: {"stage":"objections","stageLabel":"Отработка возражений","explanation":"2-3 предложения","focus":"на что обратить внимание"}`,
  kz: `Сен сату жаттықтырушысысың. Сатушы проблемасын сипаттады. Қай кезеңді жаттықтыру керектігін анықта (contact/needs/presentation/objections/closing). ТЕК JSON: {"stage":"objections","stageLabel":"Қарсылықтарды өңдеу","explanation":"2-3 сөйлем қазақша","focus":"нені жақсарту керек"}`
};

async function askClaude(system, history, lang) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages: history, lang })
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
  const [problem, setProblem] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [niche, setNiche] = useState('');
  const [stage, setStage] = useState('');
  const [problemContext, setProblemContext] = useState('');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  const t = T[lang];

  function handleLogin() {
    const code = codeInput.trim().toUpperCase();
    if (ACCESS_CODES.map(c => c.toUpperCase()).includes(code)) {
      setStep('lang');
      setCodeError('');
    } else {
      setCodeError(t.loginError);
    }
  }

  async function handleAnalyzeProblem() {
    if (!problem.trim()) return;
    setAnalyzing(true);
    try {
      const raw = await askClaude(ANALYZE_PROMPTS[lang], [{ role: 'user', content: problem }], lang);
      const clean = raw.replace(/```json|```/g, '').trim();
      setAnalysis(JSON.parse(clean));
      setStep('analysis');
    } catch {
      setAnalysis({ stage: 'objections', stageLabel: lang === 'kz' ? 'Қарсылықтарды өңдеу' : 'Отработка возражений', explanation: lang === 'kz' ? 'Бұл кезеңде жаттығу қажет.' : 'Нужно поработать над этим этапом.', focus: lang === 'kz' ? 'Дәлелдерді күшейтіңіз.' : 'Усильте аргументацию.' });
      setStep('analysis');
    } finally {
      setAnalyzing(false);
    }
  }

  function startChat(selectedStage, selectedNiche) {
    const firstMsgs = {
      ru: { contact: 'Здравствуйте', needs: 'Привет, хочу кое-что купить', presentation: 'Расскажите про ваш продукт', objections: 'Интересно, но дорого...', closing: 'Ну понятно, надо подумать' },
      kz: { contact: 'Сәлеметсіз бе', needs: 'Сәлем, бір нәрсе алғым келеді', presentation: 'Өніміңіз туралы айтыңызшы', objections: 'Қызықты, бірақ қымбат...', closing: 'Түсінікті, ойланып көрейін' }
    };
    setHistory([{ from: 'client', text: firstMsgs[lang][selectedStage] }]);
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
      const reply = await askClaude(buildSystemPrompt(niche, stage, lang, problemContext), allMsgs, lang);
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
    const keys = CRITERIA[stage].keys;
    try {
      const raw = await askClaude(buildEvalPrompt(stage, lang, problemContext), [{ role: 'user', content: dialog }], 'ru');
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
    setNiche(''); setStage(''); setProblem(''); setAnalysis(null); setProblemContext('');
  }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
  const stageData = STAGES[lang]?.find(s => s.id === stage);
  const nicheData = NICHES[lang]?.find(n => n.id === niche);

  const cardStyle = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'left' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'Inter,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>SalesAI</div>
          <div style={{ fontSize: 11, color: '#475569' }}>{lang === 'kz' ? 'Сату жаттықтырушысы' : 'Тренажёр продаж'}</div>
        </div>
        {step !== 'login' && step !== 'lang' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {(step === 'chat' || step === 'evaluating') && (
              <>
                <span style={{ fontSize: 11, color: '#475569' }}>{nicheData?.emoji} {nicheData?.label}</span>
                <span style={{ fontSize: 11, color: '#3b82f6' }}>· {stageData?.emoji} {stageData?.label}</span>
                <button onClick={() => evaluate(history)} style={{ background: 'none', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{t.finish}</button>
              </>
            )}
            <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ background: '#1e293b', border: 'none', borderRadius: 6, color: '#e2e8f0', padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {lang === 'ru' ? '🇰🇿 KZ' : '🇷🇺 RU'}
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
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Код выдаётся при покупке доступа к платформе</p>
            <input value={codeInput} onChange={e => { setCodeInput(e.target.value); setCodeError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Введите код..."
              style={{ width: '100%', background: '#0f172a', border: `1px solid ${codeError ? '#ef4444' : '#1e293b'}`, borderRadius: 10, color: '#e2e8f0', fontSize: 18, padding: '14px 16px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 3, marginBottom: 12, textTransform: 'uppercase' }} />
            {codeError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{codeError}</p>}
            <button onClick={handleLogin} disabled={!codeInput.trim()} style={{ width: '100%', background: codeInput.trim() ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: codeInput.trim() ? 'pointer' : 'default' }}>Войти →</button>
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
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t.homeTitle}</h1>
              <p style={{ color: '#64748b', fontSize: 14 }}>{t.homeDesc}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button onClick={() => setStep('problem')} style={{ ...cardStyle, border: '1px solid #3b82f6' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{t.mode1Title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{t.mode1Desc}</div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#3b82f6', background: '#1e3a5f', padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{t.recommended}</div>
              </button>
              <button onClick={() => setStep('niche')} style={cardStyle}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{t.mode2Title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{t.mode2Desc}</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROBLEM */}
      {step === 'problem' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>{t.back}</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{t.problemTitle}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{t.problemDesc}</p>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 8, marginBottom: 12 }}>
              {t.problemExamples.map(ex => (
                <button key={ex} onClick={() => setProblem(ex)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '6px 8px', textAlign: 'left', display: 'block', width: '100%' }}>→ {ex}</button>
              ))}
            </div>
            <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder={t.problemPlaceholder}
              style={{ width: '100%', minHeight: 110, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
            <button onClick={handleAnalyzeProblem} disabled={!problem.trim() || analyzing}
              style={{ width: '100%', background: problem.trim() && !analyzing ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: problem.trim() ? 'pointer' : 'default' }}>
              {analyzing ? t.analyzing : t.analyzeBtn}
            </button>
          </div>
        </div>
      )}

      {/* ANALYSIS */}
      {step === 'analysis' && analysis && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{t.analysisTitle}</div>
              <div style={{ background: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{STAGES[lang].find(s => s.id === analysis.stage)?.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>{t.needTrain}</div>
                  <div style={{ fontSize: 15, color: '#3b82f6', fontWeight: 700 }}>{analysis.stageLabel}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 12 }}>{analysis.explanation}</div>
              <div style={{ background: '#1e3a5f', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 4 }}>{t.focus}</div>
                <div style={{ fontSize: 13, color: '#e2e8f0' }}>{analysis.focus}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => { setStage(analysis.stage); setProblemContext(problem); setStep('niche_quick'); }}
                style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{t.startBtn}</button>
              <button onClick={() => setStep('problem')} style={{ background: 'none', border: '1px solid #1e293b', borderRadius: 10, padding: 12, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>{t.changeProblem}</button>
            </div>
          </div>
        </div>
      )}

      {/* NICHE QUICK */}
      {step === 'niche_quick' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{t.lastStep}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t.nicheQuickTitle}</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {NICHES[lang].map(n => (
              <button key={n.id} onClick={() => { setNiche(n.id); startChat(stage, n.id); }} style={cardStyle}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{n.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{n.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NICHE */}
      {step === 'niche' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>{t.back}</button>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{t.step1}</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{t.nicheTitle}</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {NICHES[lang].map(n => (
              <button key={n.id} onClick={() => { setNiche(n.id); setStep('stage'); }} style={cardStyle}>
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
            <button onClick={() => setStep('niche')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>{t.back}</button>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{t.step2}</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{t.stageTitle}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>{nicheData?.emoji} {nicheData?.label}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STAGES[lang].map((s, i) => (
              <button key={s.id} onClick={() => { setStage(s.id); startChat(s.id, niche); }}
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
            {problemContext && (
              <div style={{ background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#93c5fd' }}>
                💬 {t.problemContext} «{problemContext}»
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#334155', background: '#0f172a', padding: '3px 12px', borderRadius: 20 }}>{t.buyer} — {nicheData?.label}</span>
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
            {step === 'evaluating' && <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: 14, padding: 16 }}>{t.analyzing2}</div>}
            <div ref={bottomRef} />
          </div>
          {step === 'chat' && (
            <div style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '10px 14px', display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder={t.placeholder}
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
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>{nicheData?.emoji} {nicheData?.label} · {stageData?.emoji} {stageData?.label}</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: vc[result.verdict] || '#3b82f6', lineHeight: 1 }}>{result.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>{t.outOf}</div>
              <div style={{ display: 'inline-block', background: (vc[result.verdict] || '#3b82f6') + '22', color: vc[result.verdict] || '#3b82f6', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>{t.verdicts[result.verdict] || result.verdict}</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{t.detailTitle}</div>
              {CRITERIA[stage].keys.map((k, i) => (
                <Bar key={k} label={CRITERIA[stage][lang][i]} value={result.scores[k] || 5} />
              ))}
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              {[{ label: t.best, text: result.bestMoment, color: '#10b981' }, { label: t.worst, text: result.worstMoment, color: '#ef4444' }, { label: t.tip, text: result.tip, color: '#f59e0b' }].map(({ label, text, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => { setHistory([]); setResult(null); setInput(''); startChat(stage, niche); }} style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t.retry}</button>
              <button onClick={reset} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t.newScene}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
