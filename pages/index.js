import { useState, useRef, useEffect } from "react";
import { STAGES_THEORY } from '../lib/theory';

const ACCESS_CODES = [
  "NURASSYL0625", // Июнь 2025
  "NURASSYL0725", // Июль 2025
  "NURASSYL0825", // Август 2025
  "NURASSYL0925", // Сентябрь 2025
  "NURASSYL1025", // Октябрь 2025
  "NURASSYL1125", // Ноябрь 2025
  "NURASSYL1225", // Декабрь 2025
  "NURASSYL0126", // Январь 2026
  "NURASSYL0226", // Февраль 2026
  "NURASSYL0326", // Март 2026
  "NURASSYL0426", // Апрель 2026
  "NURASSYL0526", // Май 2026
  "DEMO123",
];

const CRITERIA = {
  contact: { keys: ["greeting","rapport","energy","opening","interest"], ru: ["Приветствие","Расположение","Энергия","Открытие","Интерес"], kz: ["Сәлемдесу","Сенімділік","Энергия","Ашу","Қызығушылық"] },
  needs: { keys: ["questions","listening","empathy","discovery","summary"], ru: ["Вопросы","Слушание","Эмпатия","Выявление","Резюме"], kz: ["Сұрақтар","Тыңдау","Эмпатия","Анықтау","Қорыту"] },
  presentation: { keys: ["benefits","examples","clarity","value","relevance"], ru: ["Выгоды","Примеры","Ясность","Ценность","Релевантность"], kz: ["Пайда","Мысалдар","Анықтық","Құндылық","Өзектілік"] },
  objections: { keys: ["joining","questions","arguments","price","closing"], ru: ["Присоединение","Уточнение","Аргументы","Цена","Закрытие"], kz: ["Қосылу","Нақтылау","Дәлелдер","Баға","Жабу"] },
  closing: { keys: ["signal","offer","urgency","confirmation","nextStep"], ru: ["Сигнал","Предложение","Срочность","Подтверждение","Следующий шаг"], kz: ["Сигнал","Ұсыныс","Шұғылдық","Растау","Келесі қадам"] },
};

const COACHING_PROMPT = {
  ru: `Ты опытный тренер по продажам Нурасыл. Менеджер описал свою проблему.

Определи ТОЧНО какой этап продаж нужно тренировать:
- contact — проблемы с первым впечатлением, приветствием
- needs — не знает что нужно клиенту, клиент не раскрывается
- presentation — клиент слушает но не заинтересован
- objections — клиент говорит дорого, подумаю, сравнивает с конкурентами
- closing — клиент уходит думать, не решается купить

ВАЖНО: Если менеджер спрашивает про кредит или рассрочку — не обучай этому. Скажи что платформа обучает прямым продажам, и предложи научить как убедить клиента купить за наличные.

JSON:
{"stage":"objections","stageLabel":"Отработка возражений","why":"Почему возникает эта проблема (3-4 предложения)","mistake":"Главная ошибка менеджеров (2-3 предложения)","phrases":["Фраза 1","Фраза 2","Фраза 3","Фраза 4"],"tip":"Главный совет (2-3 предложения)"}
ТОЛЬКО JSON без markdown.`,

  kz: `Сен тәжірибелі сату жаттықтырушысы Нұрасылсың. Менеджер мәселесін сипаттады.

Сату кезеңін ДӘЛМЕ-ДӘЛ анықта:
- contact — бірінші әсер, сәлемдесу мәселесі
- needs — клиентке не керектігін білмейді
- presentation — клиент тыңдайды бірақ қызықпайды
- objections — клиент қымбат дейді, ойланамын дейді
- closing — клиент шешім қабылдамайды

МАҢЫЗДЫ: Кредит немесе бөліп төлеу туралы сұраса — үйретпе. Тікелей сатуды үйрет.

JSON:
{"stage":"objections","stageLabel":"Қарсылықтарды өңдеу","why":"Проблема неліктен туындайды (3-4 сөйлем)","mistake":"Менеджерлердің басты қатесі (2-3 сөйлем)","phrases":["Жауап 1","Жауап 2","Жауап 3","Жауап 4"],"tip":"Басты кеңес (2-3 сөйлем)"}
ТЕК JSON, markdown жоқ.`
};

function buildBuyerPrompt(business, stageId, lang, isSecondAttempt) {
  const stageData = STAGES_THEORY[lang]?.find(s => s.id === stageId);
  const firstMsg = stageData?.firstMsg?.[lang] || (lang === 'kz' ? 'Сәлеметсіз бе' : 'Здравствуйте');
  const attemptNote = isSecondAttempt
    ? (lang === 'kz' ? '\nБұл менеджердің екінші әрекеті — бірінші рет қателесті, енді жақсырақ болуы мүмкін.' : '\nЭто вторая попытка менеджера — в первый раз ошибся, теперь может лучше.')
    : '';

  if (lang === 'kz') {
    const s = {
      contact: `Сен — ${business} саласының нақты сатып алушысысың. Жаңа келдің. Менеджер сәлемдесті. Шынайы реакция бер.`,
      needs: `Сен — ${business} саласының нақты сатып алушысысың. Бір нәрсе алғың келеді бірақ не керектігін толық білмейсің.`,
      presentation: `Сен — ${business} саласының скептик сатып алушысысың. Нақты пайда көрмесең "Маған бұл не береді?" деп сұра.`,
      objections: `Сен — ${business} саласының сатып алушысысың. Бірінші сөзің: "${firstMsg}". Шынайы мінез көрсет.`,
      closing: `Сен — ${business} саласында сатып алуға дерлік дайын сатып алушысысың.`,
    }[stageId] || '';
    return `${s}${attemptNote}

ЕРЕЖЕЛЕР:
- Тек сатып алушы бол — тренер емес, кеңес берме
- Қысқа жауап — 1-2 сөйлем
- Тек қазақша
- Кредит ұсынса: "Маған кредит керек емес"
- 8 хабарламадан кейін шешім: "Жарайды, рәсімдеңіз" немесе "Жоқ, басқа жерге барамын"`;
  }

  const s = {
    contact: `Ты — реальный покупатель в сфере "${business}". Только зашёл. Реагируй естественно.`,
    needs: `Ты — реальный покупатель в сфере "${business}". Хочешь что-то купить но не знаешь точно что.`,
    presentation: `Ты — скептичный покупатель в сфере "${business}". Если нет конкретной выгоды — спрашивай "и что мне с этого?".`,
    objections: `Ты — реальный покупатель в сфере "${business}". Твоя первая фраза: "${firstMsg}". Веди себя как настоящий клиент.`,
    closing: `Ты — покупатель в сфере "${business}" почти готовый купить.`,
  }[stageId] || '';

  return `${s}${attemptNote}

ПРАВИЛА:
- Только покупатель — не тренер, не учи, не давай советов
- Короткие ответы — 1-2 предложения как в WhatsApp
- Только русский язык
- Кредит/рассрочку: "Меня не интересует кредит"
- После 8 сообщений прими решение: "Хорошо, оформляйте" или "Нет, пойду в другое место"`;
}

function buildEvalPrompt(stageId, lang, problem, business, attemptNum) {
  const { keys } = CRITERIA[stageId] || CRITERIA.objections;
  const labels = (CRITERIA[stageId] || CRITERIA.objections)[lang];
  const ex = {};
  keys.forEach(k => ex[k] = 5);
  const isKz = lang === 'kz';
  const attemptText = attemptNum === 1
    ? (isKz ? 'Бұл бірінші әрекет — теорияға дейін.' : 'Это первая попытка — до изучения теории.')
    : (isKz ? 'Бұл екінші әрекет — теориядан кейін.' : 'Это вторая попытка — после изучения теории.');

  return `Ты тренер по продажам Нурасыл. ${attemptText} Бизнес: "${business}". Проблема: "${problem}".
Оцени МЕНЕДЖЕРА по критериям: ${keys.map((k,i)=>k+'('+labels[i]+')').join(', ')}.
${isKz ? 'Барлығын қазақша жаз.' : 'Всё на русском.'}
ТОЛЬКО JSON: ${JSON.stringify({scores:ex,totalScore:5,verdict:"Хорошо",bestMoment:"конкретный момент",worstMoment:"конкретная ошибка",tip:"конкретный совет",detailedFeedback:"подробный разбор 3-5 предложений с конкретными фразами которые стоило использовать"})}`;
}

function buildSummaryPrompt(lang, problem, score1, score2, stageLabel) {
  const isKz = lang === 'kz';
  return `Ты тренер по продажам Нурасыл. Менеджер прошёл обучение по теме "${stageLabel}".
Проблема была: "${problem}".
Первая попытка (до теории): ${score1}/10
Вторая попытка (после теории): ${score2}/10

${isKz ? 'Қазақша жаз.' : 'На русском.'}
Напиши итоговое резюме в JSON:
${JSON.stringify({
  progress: "Оценка прогресса — вырос ли результат и насколько",
  achievement: "Что менеджер освоил за эту тренировку",
  stillNeed: "Что ещё нужно доработать",
  homework: "Конкретное задание для самостоятельной практики",
  nextStage: "Какой этап продаж рекомендуется изучить следующим"
})}
ТОЛЬКО JSON без markdown.`;
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
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${value * 10}%`, transition: 'width 1s' }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState('login');
  const [lang, setLang] = useState('ru');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  // Mode 1 - Problem flow (4 stages)
  const [problem, setProblem] = useState('');
  const [business, setBusiness] = useState('');
  const [coaching, setCoaching] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [attempt, setAttempt] = useState(1); // 1 or 2
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [summary, setSummary] = useState(null);

  // Mode 2 - Stage learning
  const [selectedStage, setSelectedStage] = useState(null);
  const [theoryTab, setTheoryTab] = useState('theory');
  const [stageId, setStageId] = useState('');
  const [stageBusiness, setStageBusiness] = useState('');

  // Chat
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
    if (!problem.trim() || !business.trim()) return;
    setLoadingCoach(true);
    try {
      const raw = await callAPI(COACHING_PROMPT[lang], [{ role: 'user', content: problem }], lang);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setCoaching(parsed);
      setStageId(parsed.stage);
      // Go straight to first practice (proблематизация)
      startChat(parsed.stage, 1);
    } catch {
      const fallback = { stage: 'objections', stageLabel: isKz ? 'Қарсылықтарды өңдеу' : 'Отработка возражений' };
      setCoaching(fallback);
      setStageId(fallback.stage);
      startChat(fallback.stage, 1);
    } finally {
      setLoadingCoach(false);
    }
  }

  function startChat(sid, attemptNum) {
    const sId = sid || stageId;
    const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === sId);
    const firstMsg = stageInfo?.firstMsg?.[lang] || (isKz ? 'Сәлеметсіз бе' : 'Здравствуйте');
    setAttempt(attemptNum || 1);
    setHistory([{ from: 'client', text: firstMsg }]);
    setResult(null);
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
    const biz = business || stageBusiness;
    try {
      const reply = await callAPI(buildBuyerPrompt(biz, stageId, lang, attempt === 2), allMsgs, lang);
      const updated = [...newHistory, { from: 'client', text: reply }];
      setHistory(updated);
      const count = updated.filter(m => m.from === 'manager').length;
      const lastMsg = updated[updated.length - 1];
      const isDone = lastMsg.from === 'client' && (
        count >= 8 ||
        lastMsg.text.includes('оформляйте') || lastMsg.text.includes('другое место') ||
        lastMsg.text.includes('рәсімдеңіз') || lastMsg.text.includes('басқа жерге')
      );
      if (isDone) setTimeout(() => evaluate(updated), 800);
    } catch {
      setHistory(prev => [...prev, { from: 'client', text: '...' }]);
    } finally {
      setLoading(false);
    }
  }

  async function evaluate(fin) {
    setStep('evaluating');
    const dialog = fin.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
    const biz = business || stageBusiness;
    const keys = (CRITERIA[stageId] || CRITERIA.objections).keys;
    try {
      const raw = await callAPI(buildEvalPrompt(stageId, lang, problem, biz, attempt), [{ role: 'user', content: dialog }], 'ru');
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      if (attempt === 1) {
        setResult1(parsed);
        setStep('result1'); // After first attempt → show errors → then theory
      } else {
        setResult2(parsed);
        setStep('result2'); // After second attempt → show comparison → summary
      }
    } catch {
      const def = {};
      keys.forEach(k => def[k] = 5);
      const fallback = { scores: def, totalScore: 5, verdict: 'Хорошо', bestMoment: '—', worstMoment: '—', tip: '—', detailedFeedback: '—' };
      setResult(fallback);
      if (attempt === 1) { setResult1(fallback); setStep('result1'); }
      else { setResult2(fallback); setStep('result2'); }
    }
  }

  async function generateSummary() {
    setStep('loading_summary');
    const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === stageId);
    try {
      const raw = await callAPI(
        buildSummaryPrompt(lang, problem, result1?.totalScore || 5, result2?.totalScore || 5, stageInfo?.label || ''),
        [{ role: 'user', content: 'Дай резюме обучения' }], lang
      );
      const clean = raw.replace(/```json|```/g, '').trim();
      setSummary(JSON.parse(clean));
      setStep('summary');
    } catch {
      setSummary({ progress: '—', achievement: '—', stillNeed: '—', homework: '—', nextStage: '—' });
      setStep('summary');
    }
  }

  function reset() {
    setHistory([]); setResult(null); setResult1(null); setResult2(null);
    setSummary(null); setInput(''); setStep('home');
    setProblem(''); setBusiness(''); setCoaching(null);
    setSelectedStage(null); setTheoryTab('theory');
    setStageId(''); setStageBusiness(''); setAttempt(1);
  }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
  const curStage = STAGES_THEORY[lang]?.find(s => s.id === stageId);

  const card = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, cursor: 'pointer', textAlign: 'left' };

  const verdictLabel = (v) => ({ 'Отлично': isKz ? 'Өте жақсы' : 'Отлично', 'Хорошо': isKz ? 'Жақсы' : 'Хорошо', 'Нужна практика': isKz ? 'Жаттығу керек' : 'Нужна практика', 'Слабо': isKz ? 'Нашар' : 'Слабо' }[v] || v);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'Inter,system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>SalesAI</div>
          <div style={{ fontSize: 11, color: '#475569' }}>{isKz ? 'Нұрасыл · Сату жаттықтырушысы' : 'Нурасыл · Тренер по продажам'}</div>
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
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>Код выдаётся при покупке / Кіру коды беріледі</p>
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
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>{isKz ? 'Нұрасылмен сату өнерін үйреніңіз' : 'Учитесь продавать вместе с Нурасылом'}</p>
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
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'Нұрасыл проблемаңызды талдайды → жаттығу → теория → қайта жаттығу → резюме' : 'Нурасыл разберёт проблему → практика → теория → практика снова → резюме'}</div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#3b82f6', background: '#1e3a5f', padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{isKz ? '✨ Толық оқу бағдарламасы' : '✨ Полная программа обучения'}</div>
              </button>
              <button onClick={() => setStep('stages_list')} style={card}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📚</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{isKz ? 'Сату кезеңдерін оқу' : 'Изучить этапы продаж'}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'Нұрасылдың теориясы + дайын фразалар + жаттығу. Әр кезең бойынша толық оқу.' : 'Теория Нурасыла + готовые фразы + практика. Полное обучение по каждому этапу.'}</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROBLEM INPUT */}
      {step === 'problem' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{isKz ? 'Проблемаңызды сипаттаңыз' : 'Опишите вашу проблему'}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{isKz ? 'Нұрасыл проблемаңызды талдап, 4 кезеңде оқытады' : 'Нурасыл разберёт проблему и проведёт через 4 стадии обучения'}</p>

            {/* Steps preview */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              {[
                { n: 1, label: isKz ? 'Өзіңіз байқаңыз' : 'Попробуй сам', desc: isKz ? 'Теориясыз жаттығу' : 'Практика без теории' },
                { n: 2, label: isKz ? 'Теория' : 'Теория', desc: isKz ? 'Нұрасылдың түсіндірмесі' : 'Объяснение Нурасыла' },
                { n: 3, label: isKz ? 'Қайта жаттығу' : 'Практика снова', desc: isKz ? 'Білімді қолдану' : 'Применить знания' },
                { n: 4, label: isKz ? 'Резюме' : 'Резюме', desc: isKz ? 'Прогресс және жоспар' : 'Прогресс и план' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>— {s.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 6 }}>{isKz ? 'Сіздің бизнесіңіз:' : 'Ваш бизнес:'}</label>
              <input value={business} onChange={e => setBusiness(e.target.value)}
                placeholder={isKz ? 'Мысалы: киім дүкені, жылжымайтын мүлік, IT қызметтер...' : 'Например: магазин одежды, недвижимость, IT услуги...'}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '12px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 6 }}>{isKz ? 'Проблемаңыз:' : 'Ваша проблема:'}</label>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 8, marginBottom: 8 }}>
                {(isKz ? ['Клиент қымбат деп кетіп қалады', 'Клиентпен қалай сөйлесуді білмеймін', 'Клиент тыңдайды бірақ сатып алмайды', 'Клиент шешім қабылдамайды'] :
                  ['Клиенты говорят «дорого» и уходят', 'Не знаю как начать разговор', 'Клиент слушает но не покупает', 'Клиент не принимает решение']).map(ex => (
                  <button key={ex} onClick={() => setProblem(ex)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '5px 8px', textAlign: 'left', display: 'block', width: '100%' }}>→ {ex}</button>
                ))}
              </div>
              <textarea value={problem} onChange={e => setProblem(e.target.value)}
                placeholder={isKz ? 'Проблемаңызды жазыңыз...' : 'Опишите вашу проблему...'}
                style={{ width: '100%', minHeight: 90, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleCoach} disabled={!problem.trim() || !business.trim() || loadingCoach}
              style={{ width: '100%', background: (problem.trim() && business.trim() && !loadingCoach) ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: (problem.trim() && business.trim()) ? 'pointer' : 'default' }}>
              {loadingCoach ? (isKz ? '⏳ Талдап жатырмын...' : '⏳ Анализирую...') : (isKz ? '1-кезең: Өзіңіз байқаңыз →' : '1 стадия: Попробуй сам →')}
            </button>
          </div>
        </div>
      )}

      {/* CHAT */}
      {(step === 'chat' || step === 'evaluating') && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Stage indicator */}
            <div style={{ background: '#1e293b', border: '1px solid #2a3a4a', borderRadius: 10, padding: '10px 16px' }}>
              {problem && (
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                  {isKz ? '📋 Мәселе' : '📋 Проблема'}: {problem}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>
                  {attempt === 1
                    ? (isKz ? '🎯 1-кезең: Өзіңіз байқаңыз (теориясыз)' : '🎯 Стадия 1: Попробуй сам (без теории)')
                    : (isKz ? '🚀 3-кезең: Теориядан кейін жаттығу' : '🚀 Стадия 3: Практика после теории')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                💼 {isKz ? 'Сіз — менеджерсіз. Сатып алушыға жауап беріңіз.' : 'Вы — менеджер. Отвечайте покупателю и доведите до покупки.'}
              </div>
            </div>

            {history.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'client' ? 'flex-start' : 'flex-end', gap: 2 }}>
                <div style={{ fontSize: 10, color: '#475569', marginLeft: m.from === 'client' ? 36 : 0 }}>
                  {m.from === 'client' ? (isKz ? '👤 Сатып алушы' : '👤 Покупатель') : (isKz ? '💼 Сіз (менеджер)' : '💼 Вы (менеджер)')}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  {m.from === 'client' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>}
                  <div style={{ maxWidth: '72%', padding: '10px 14px', fontSize: 14, lineHeight: 1.5, borderRadius: m.from === 'client' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: m.from === 'client' ? '#0f172a' : '#1d4ed8', color: '#e2e8f0', border: m.from === 'client' ? '1px solid #1e293b' : 'none' }}>{m.text}</div>
                  {m.from === 'manager' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💼</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', color: '#334155', letterSpacing: 4, fontSize: 18 }}>•••</div>
              </div>
            )}
            {step === 'evaluating' && <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: 14, padding: 16 }}>⏳ {isKz ? 'Нұрасыл талдап жатыр...' : 'Нурасыл анализирует...'}</div>}
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

      {/* RESULT 1 — After first attempt → show errors → go to theory */}
      {step === 'result1' && result1 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>
                {isKz ? '1-кезең аяқталды' : 'Стадия 1 завершена'}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>
                {isKz ? 'Енді қателеріңізді көріп, теория оқисыз' : 'Теперь увидите ошибки и изучите теорию'}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 60, fontWeight: 900, color: vc[result1.verdict] || '#3b82f6', lineHeight: 1 }}>{result1.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>{isKz ? '10-нан' : 'из 10'}</div>
              <div style={{ display: 'inline-block', background: (vc[result1.verdict] || '#3b82f6') + '22', color: vc[result1.verdict] || '#3b82f6', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{verdictLabel(result1.verdict)}</div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>✗ {isKz ? 'ТАБЫЛҒАН ҚАТЕЛЕР' : 'НАЙДЕННЫЕ ОШИБКИ'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, marginBottom: 10 }}><strong>{isKz ? 'Басты қате:' : 'Главная ошибка:'}</strong> {result1.worstMoment}</div>
              {result1.detailedFeedback && <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{result1.detailedFeedback}</div>}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>✓ {isKz ? 'ҮЗДІК СӘТ' : 'ЛУЧШИЙ МОМЕНТ'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{result1.bestMoment}</div>
            </div>

            <button onClick={() => {
              if (coaching) {
                const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === coaching.stage);
                setSelectedStage(stageInfo);
                setTheoryTab('theory');
                setStep('theory_between');
              } else {
                const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === stageId);
                setSelectedStage(stageInfo);
                setTheoryTab('theory');
                setStep('theory_between');
              }
            }} style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
              📚 {isKz ? '2-кезең: Теорияны оқу →' : '2 стадия: Изучить теорию →'}
            </button>
          </div>
        </div>
      )}

      {/* THEORY BETWEEN — Between practice 1 and 2 */}
      {step === 'theory_between' && selectedStage && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#93c5fd' }}>{isKz ? '2-кезең: Теория' : '2 стадия: Теория'}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{selectedStage.emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedStage.label}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedStage.goal}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 10, padding: 4, marginBottom: 20 }}>
              {[
                { id: 'theory', label: '📖 ' + (isKz ? 'Теория' : 'Теория') },
                { id: 'phrases', label: '💬 ' + (isKz ? 'Фразалар' : 'Фразы') },
                { id: 'mistakes', label: '✗ ' + (isKz ? 'Қателер' : 'Ошибки') },
              ].map(tab => (
                <button key={tab.id} onClick={() => setTheoryTab(tab.id)}
                  style={{ flex: 1, background: theoryTab === tab.id ? '#1e293b' : 'none', border: 'none', borderRadius: 8, padding: '8px 4px', fontSize: 12, color: theoryTab === tab.id ? '#e2e8f0' : '#64748b', cursor: 'pointer', fontWeight: theoryTab === tab.id ? 600 : 400 }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {theoryTab === 'theory' && (
              <div>
                <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>🧠 {isKz ? 'НЕЛІКТЕН МАҢЫЗДЫ?' : 'ПОЧЕМУ ВАЖНО?'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{selectedStage.why}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>📖 {isKz ? 'ТЕОРИЯ' : 'ТЕОРИЯ'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{selectedStage.theory}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>✅ {isKz ? 'ҚАДАМДАР' : 'ШАГИ'}</div>
                  {selectedStage.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {theoryTab === 'phrases' && (
              <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>💬 {isKz ? 'ДАЙЫН ФРАЗАЛАР' : 'ГОТОВЫЕ ФРАЗЫ'}</div>
                {selectedStage.phrases.map((phrase, i) => (
                  <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px', marginBottom: 10, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                    <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{phrase}
                  </div>
                ))}
              </div>
            )}

            {theoryTab === 'mistakes' && (
              <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>✗ {isKz ? 'ЖАСАУҒА БОЛМАЙДЫ' : 'ЧТО НЕЛЬЗЯ ДЕЛАТЬ'}</div>
                {selectedStage.mistakes.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <span style={{ color: '#ef4444', fontSize: 16, flexShrink: 0 }}>✗</span>
                    <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{m}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#0f172a', border: '1px solid #10b981', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>🚀 {isKz ? 'Теорияны үйрендіңіз!' : 'Теорию изучили!'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{isKz ? 'Енді үйренгеніңізді жаттығуда қолданыңыз' : 'Теперь применяйте знания на практике'}</div>
              <button onClick={() => { setAttempt(2); startChat(stageId, 2); }}
                style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                🚀 {isKz ? '3-кезең: Қайта жаттығу →' : '3 стадия: Практика снова →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT 2 — After second attempt */}
      {step === 'result2' && result1 && result2 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ background: '#0f172a', border: '1px solid #10b981', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>📊 {isKz ? 'ПРОГРЕСС' : 'ПРОГРЕСС'}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: vc[result1.verdict] || '#3b82f6' }}>{result1.totalScore}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{isKz ? '1-жаттығу' : '1-я практика'}</div>
                </div>
                <div style={{ fontSize: 28, color: result2.totalScore > result1.totalScore ? '#10b981' : '#ef4444' }}>
                  {result2.totalScore > result1.totalScore ? '↗' : result2.totalScore === result1.totalScore ? '→' : '↘'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: vc[result2.verdict] || '#3b82f6' }}>{result2.totalScore}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{isKz ? '2-жаттығу' : '2-я практика'}</div>
                </div>
              </div>
              {result2.totalScore > result1.totalScore && (
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                  +{result2.totalScore - result1.totalScore} {isKz ? 'балл өсті! 🎉' : 'балла роста! 🎉'}
                </div>
              )}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{isKz ? 'ЕКІНШІ ЖАТТЫҒУ НӘТИЖЕСІ' : 'РЕЗУЛЬТАТ ВТОРОЙ ПРАКТИКИ'}</div>
              {[
                { label: isKz ? '✓ Үздік сәт' : '✓ Лучший момент', text: result2.bestMoment, color: '#10b981' },
                { label: isKz ? '✗ Басты қате' : '✗ Главная ошибка', text: result2.worstMoment, color: '#ef4444' },
                { label: isKz ? '→ Кеңес' : '→ Совет', text: result2.tip, color: '#f59e0b' },
              ].map(({ label, text, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
              {result2.detailedFeedback && (
                <div style={{ paddingTop: 12, borderTop: '1px solid #1e293b', marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>🎓 {isKz ? 'Нұрасылдың толық талдауы' : 'Подробный разбор Нурасыла'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>{result2.detailedFeedback}</div>
                </div>
              )}
            </div>

            <button onClick={generateSummary} style={{ width: '100%', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              📋 {isKz ? '4-кезең: Резюме →' : '4 стадия: Резюме →'}
            </button>
          </div>
        </div>
      )}

      {/* LOADING SUMMARY */}
      {step === 'loading_summary' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 14, color: '#3b82f6' }}>{isKz ? '⏳ Нұрасыл резюме дайындап жатыр...' : '⏳ Нурасыл готовит резюме...'}</div>
          </div>
        </div>
      )}

      {/* SUMMARY — Stage 4 */}
      {step === 'summary' && summary && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>🎓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{isKz ? 'Оқу аяқталды!' : 'Обучение завершено!'}</h2>
              <div style={{ fontSize: 13, color: '#64748b' }}>{isKz ? '4-кезең: Резюме' : '4 стадия: Резюме'}</div>
            </div>

            {[
              { icon: '📈', label: isKz ? 'Прогрессіңіз' : 'Ваш прогресс', text: summary.progress, color: '#10b981' },
              { icon: '🏆', label: isKz ? 'Не үйрендіңіз' : 'Что освоили', text: summary.achievement, color: '#3b82f6' },
              { icon: '🎯', label: isKz ? 'Не жетіспейді' : 'Что ещё нужно', text: summary.stillNeed, color: '#f59e0b' },
              { icon: '📝', label: isKz ? 'Үй тапсырмасы' : 'Домашнее задание', text: summary.homework, color: '#8b5cf6' },
              { icon: '➡️', label: isKz ? 'Келесі кезең' : 'Следующий этап', text: summary.nextStage, color: '#64748b' },
            ].map(({ icon, label, text, color }) => (
              <div key={label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{icon} {label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{text}</div>
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button onClick={() => { setProblem(''); setBusiness(''); setCoaching(null); setResult1(null); setResult2(null); setSummary(null); setAttempt(1); setHistory([]); setResult(null); setStep('problem'); }}
                style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isKz ? '🔄 Жаңа мәселе' : '🔄 Новая проблема'}
              </button>
              <button onClick={reset} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isKz ? '⚡ Басты мәзір' : '⚡ Главное меню'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGES LIST */}
      {step === 'stages_list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{isKz ? 'Сату кезеңдері' : 'Этапы продаж'}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{isKz ? 'Кезеңді таңдаңыз — теория, фразалар және жаттығу' : 'Выберите этап — теория, фразы и практика'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STAGES_THEORY[lang]?.map((s, i) => (
                <button key={s.id} onClick={() => { setSelectedStage(s); setStageId(s.id); setTheoryTab('theory'); setStep('theory'); }}
                  style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.emoji}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{i + 1}. {s.label}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{s.goal}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* THEORY (mode 2) */}
      {step === 'theory' && selectedStage && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <button onClick={() => setStep('stages_list')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{selectedStage.emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedStage.label}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedStage.goal}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 10, padding: 4, marginBottom: 20 }}>
              {[{ id: 'theory', label: '📖 ' + (isKz ? 'Теория' : 'Теория') }, { id: 'phrases', label: '💬 ' + (isKz ? 'Фразалар' : 'Фразы') }, { id: 'mistakes', label: '✗ ' + (isKz ? 'Қателер' : 'Ошибки') }].map(tab => (
                <button key={tab.id} onClick={() => setTheoryTab(tab.id)}
                  style={{ flex: 1, background: theoryTab === tab.id ? '#1e293b' : 'none', border: 'none', borderRadius: 8, padding: '8px 4px', fontSize: 12, color: theoryTab === tab.id ? '#e2e8f0' : '#64748b', cursor: 'pointer', fontWeight: theoryTab === tab.id ? 600 : 400 }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {theoryTab === 'theory' && (
              <div>
                <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>🧠 {isKz ? 'НЕЛІКТЕН МАҢЫЗДЫ?' : 'ПОЧЕМУ ВАЖНО?'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{selectedStage.why}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>📖 {isKz ? 'ТЕОРИЯ' : 'ТЕОРИЯ'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{selectedStage.theory}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>✅ {isKz ? 'ҚАДАМДАР' : 'ШАГИ'}</div>
                  {selectedStage.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {theoryTab === 'phrases' && (
              <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>💬 {isKz ? 'ДАЙЫН ФРАЗАЛАР' : 'ГОТОВЫЕ ФРАЗЫ'}</div>
                {selectedStage.phrases.map((phrase, i) => (
                  <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px', marginBottom: 10, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                    <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{phrase}
                  </div>
                ))}
              </div>
            )}
            {theoryTab === 'mistakes' && (
              <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>✗ {isKz ? 'ЖАСАУҒА БОЛМАЙДЫ' : 'ЧТО НЕЛЬЗЯ ДЕЛАТЬ'}</div>
                {selectedStage.mistakes.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <span style={{ color: '#ef4444', fontSize: 16, flexShrink: 0 }}>✗</span>
                    <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{m}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🎯 {isKz ? 'Жаттығуға дайынсыз ба?' : 'Готовы практиковаться?'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{isKz ? 'Бизнесіңізді жазыңыз және жаттығуды бастаңыз' : 'Укажите ваш бизнес и начните практику'}</div>
              <input value={stageBusiness} onChange={e => setStageBusiness(e.target.value)}
                placeholder={isKz ? 'Бизнесіңіз...' : 'Ваш бизнес...'}
                style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }} />
              <button onClick={() => { setBusiness(stageBusiness); startChat(selectedStage.id, 1); }}
                disabled={!stageBusiness.trim()}
                style={{ width: '100%', background: stageBusiness.trim() ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: stageBusiness.trim() ? 'pointer' : 'default' }}>
                ⚡ {isKz ? 'Жаттығуды бастау' : 'Начать практику'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
