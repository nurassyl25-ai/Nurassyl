import { useState, useRef, useEffect } from "react";
import { STAGES_THEORY } from '../lib/theory';

const ACCESS_CODES = [
  "NURASSYL0625", "NURASSYL0725", "NURASSYL0825", "NURASSYL0925",
  "NURASSYL1025", "NURASSYL1125", "NURASSYL1225", "NURASSYL0126",
  "NURASSYL0226", "NURASSYL0326", "NURASSYL0426", "NURASSYL0526",
  "DEMO123",
];

const CRITERIA = {
  contact: { keys: ["greeting","rapport","energy","opening","interest"], ru: ["Приветствие","Расположение","Энергия","Открытие","Интерес"], kz: ["Сәлемдесу","Сенімділік","Энергия","Ашу","Қызығушылық"] },
  needs: { keys: ["questions","listening","empathy","discovery","summary"], ru: ["Вопросы","Слушание","Эмпатия","Выявление","Резюме"], kz: ["Сұрақтар","Тыңдау","Эмпатия","Анықтау","Қорыту"] },
  presentation: { keys: ["benefits","examples","clarity","value","relevance"], ru: ["Выгоды","Примеры","Ясность","Ценность","Релевантность"], kz: ["Пайда","Мысалдар","Анықтық","Құндылық","Өзектілік"] },
  objections: { keys: ["joining","questions","arguments","price","closing"], ru: ["Присоединение","Уточнение","Аргументы","Цена","Закрытие"], kz: ["Қосылу","Нақтылау","Дәлелдер","Баға","Жабу"] },
  closing: { keys: ["signal","offer","urgency","confirmation","nextStep"], ru: ["Сигнал","Предложение","Срочность","Подтверждение","Следующий шаг"], kz: ["Сигнал","Ұсыныс","Шұғылдық","Растау","Келесі қадам"] },
};

const DETECT_PROMPT = {
  ru: `Ты тренер по продажам Нурасыл. Менеджер описал проблему. Определи этап:
- contact: проблемы с приветствием, первым впечатлением
- needs: не может выяснить что нужно клиенту
- presentation: клиент не заинтересован, не видит ценности
- objections: клиент говорит дорого, подумаю
- closing: клиент уходит думать, не решается купить
Не обучай кредитам и рассрочкам.
JSON: {"stage":"objections","stageLabel":"Отработка возражений"}`,
  kz: `Сен сату жаттықтырушысы Нұрасылсың. Менеджер мәселесін сипаттады. Кезеңді анықта:
- contact: сәлемдесу, бірінші әсер мәселесі
- needs: клиентке не керектігін анықтай алмайды
- presentation: клиент қызықпайды
- objections: клиент қымбат дейді, ойланамын дейді
- closing: клиент шешім қабылдамайды
JSON: {"stage":"objections","stageLabel":"Қарсылықтарды өңдеу"}`
};

const COACHING_PROMPT = {
  ru: (stage, stageLabel) => `Ты тренер по продажам Нурасыл. Проанализируй последний ответ МЕНЕДЖЕРА в диалоге.

Этап продаж: ${stageLabel}

Если менеджер допустил ошибку — дай короткую подсказку прямо сейчас.
Если всё хорошо — напиши null.

Не обучай кредитам и рассрочкам от банков.

JSON (или null):
{"hasError": true, "errorText": "Что именно сделал не так (1 предложение)", "correctPhrase": "Как надо было сказать (конкретная фраза)", "tip": "Короткий совет (1 предложение)"}`,
  kz: (stage, stageLabel) => `Сен сату жаттықтырушысы Нұрасылсың. Диалогтағы МЕНЕДЖЕРДІҢ соңғы жауабын талда.

Сату кезеңі: ${stageLabel}

Менеджер қате жіберсе — қазір қысқа кеңес бер.
Жақсы болса — null жаз.

JSON (немесе null):
{"hasError": true, "errorText": "Нені дұрыс жасамады (1 сөйлем)", "correctPhrase": "Қалай айту керек еді (нақты фраза)", "tip": "Қысқа кеңес (1 сөйлем)"}`
};

function buildBuyerPrompt(business, stageId, lang) {
  const stageData = STAGES_THEORY[lang]?.find(s => s.id === stageId);
  const firstMsg = stageData?.firstMsg?.[lang] || (lang === 'kz' ? 'Сәлеметсіз бе' : 'Здравствуйте');

  if (lang === 'kz') {
    const s = {
      contact: `Сен — "${business}" саласының нақты сатып алушысысың. Жаңа келдің. Шынайы реакция бер.`,
      needs: `Сен — "${business}" саласының нақты сатып алушысысың. Бір нәрсе алғың келеді бірақ не керектігін толық білмейсің.`,
      presentation: `Сен — "${business}" саласының скептик сатып алушысысың. Нақты пайда көрмесең "Маған бұл не береді?" деп сұра.`,
      objections: `Сен — "${business}" саласының сатып алушысысың. Бірінші сөзің: "${firstMsg}". Шынайы мінез көрсет — нашар дәлелге қарсылық бер.`,
      closing: `Сен — "${business}" саласында сатып алуға дерлік дайын сатып алушысысың.`,
    }[stageId] || '';
    return `${s}

ЕРЕЖЕЛЕР:
- Тек сатып алушы бол — тренер емес, кеңес берме, үйретпе
- Менеджерге көмектеспе — ол өзі шешсін
- Қысқа жауап — 1-2 сөйлем
- Тек таза қазақша
- Кредит ұсынса: "Маған кредит керек емес"
- 8 хабарламадан кейін шешім: "Жарайды, рәсімдеңіз" немесе "Жоқ, басқа жерге барамын"`;
  }

  const s = {
    contact: `Ты — реальный покупатель в "${business}". Только зашёл. Реагируй естественно.`,
    needs: `Ты — реальный покупатель в "${business}". Хочешь что-то купить но не знаешь точно что.`,
    presentation: `Ты — скептичный покупатель в "${business}". Нет конкретной выгоды — спрашивай "и что мне с этого?".`,
    objections: `Ты — реальный покупатель в "${business}". Первая фраза: "${firstMsg}". Веди себя как настоящий клиент — на слабый аргумент возражай снова.`,
    closing: `Ты — покупатель в "${business}" почти готовый купить.`,
  }[stageId] || '';

  return `${s}

ПРАВИЛА:
- Только покупатель — не тренер, не учи, не помогай менеджеру
- Менеджер должен сам справиться
- Короткие ответы — 1-2 предложения
- Только русский язык
- Кредит/рассрочку: "Меня не интересует кредит"
- После 8 сообщений: "Хорошо, оформляйте" или "Нет, пойду в другое место"`;
}

function buildEvalPrompt(stageId, lang, problem, business) {
  const { keys } = CRITERIA[stageId] || CRITERIA.objections;
  const labels = (CRITERIA[stageId] || CRITERIA.objections)[lang];
  const ex = {};
  keys.forEach(k => ex[k] = 5);
  const isKz = lang === 'kz';
  return `Ты тренер Нурасыл. Бизнес: "${business}". Проблема: "${problem}".
Оцени МЕНЕДЖЕРА. Критерии: ${keys.map((k,i)=>k+'('+labels[i]+')').join(', ')}.
${isKz ? 'Барлығын қазақша жаз.' : 'Всё на русском.'}
JSON: ${JSON.stringify({scores:ex,totalScore:5,verdict:"Хорошо",bestMoment:"конкретный момент из диалога",worstMoment:"конкретная ошибка с цитатой",tip:"конкретный совет",detailedFeedback:"разбор 3-4 предложения с конкретными фразами"})}`;
}

function buildSummaryPrompt(lang, problem, score1, score2, stageLabel) {
  const isKz = lang === 'kz';
  return `Тренер Нурасыл. Тема: "${stageLabel}". Проблема: "${problem}".
1-я попытка: ${score1}/10. 2-я попытка: ${score2}/10.
${isKz ? 'Қазақша жаз.' : 'На русском.'}
JSON: ${JSON.stringify({progress:"оценка прогресса",achievement:"что освоил",stillNeed:"что доработать",homework:"конкретное задание",nextStage:"следующий этап для изучения"})}`;
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

  const [problem, setProblem] = useState('');
  const [business, setBusiness] = useState('');
  const [stageId, setStageId] = useState('');
  const [stageLabel, setStageLabel] = useState('');
  const [attempt, setAttempt] = useState(1);
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [summary, setSummary] = useState(null);

  const [selectedStage, setSelectedStage] = useState(null);
  const [theoryTab, setTheoryTab] = useState('theory');
  const [stageBusiness, setStageBusiness] = useState('');

  // Chat with inline coaching
  const [history, setHistory] = useState([]); // {from, text, coaching?}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingCoach, setCheckingCoach] = useState(false);

  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading, checkingCoach]);

  const isKz = lang === 'kz';

  function handleLogin() {
    if (ACCESS_CODES.map(c => c.toUpperCase()).includes(codeInput.trim().toUpperCase())) {
      setStep('lang'); setCodeError('');
    } else {
      setCodeError(isKz ? 'Қате код.' : 'Неверный код.');
    }
  }

  async function startProblemFlow() {
    if (!problem.trim() || !business.trim()) return;
    setStep('detecting');
    try {
      const raw = await callAPI(DETECT_PROMPT[lang], [{ role: 'user', content: problem }], lang);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setStageId(parsed.stage);
      setStageLabel(parsed.stageLabel);
      startChat(parsed.stage, parsed.stageLabel, 1);
    } catch {
      setStageId('objections');
      setStageLabel(isKz ? 'Қарсылықтарды өңдеу' : 'Отработка возражений');
      startChat('objections', isKz ? 'Қарсылықтарды өңдеу' : 'Отработка возражений', 1);
    }
  }

  function startChat(sid, slabel, attemptNum) {
    const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === sid);
    const firstMsg = stageInfo?.firstMsg?.[lang] || (isKz ? 'Сәлеметсіз бе' : 'Здравствуйте');
    setAttempt(attemptNum);
    setHistory([{ from: 'client', text: firstMsg }]);
    setStep('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send() {
    if (!input.trim() || loading || checkingCoach) return;
    const text = input.trim();
    setInput('');

    // Add manager message
    const newHistory = [...history, { from: 'manager', text }];
    setHistory(newHistory);
    setLoading(true);

    const allMsgs = newHistory.map(m => ({ role: m.from === 'manager' ? 'user' : 'assistant', content: m.text }));
    while (allMsgs.length > 0 && allMsgs[0].role === 'assistant') allMsgs.shift();

    try {
      // Get buyer response
      const reply = await callAPI(buildBuyerPrompt(business || stageBusiness, stageId, lang), allMsgs, lang);
      const withClient = [...newHistory, { from: 'client', text: reply }];

      // Check if dialog is done
      const managerCount = withClient.filter(m => m.from === 'manager').length;
      const lastMsg = withClient[withClient.length - 1];
      const isDone = lastMsg.from === 'client' && (
        managerCount >= 8 ||
        lastMsg.text.includes('оформляйте') || lastMsg.text.includes('другое место') ||
        lastMsg.text.includes('рәсімдеңіз') || lastMsg.text.includes('басқа жерге')
      );

      if (isDone) {
        setHistory(withClient);
        setLoading(false);
        setTimeout(() => evaluate(withClient), 800);
        return;
      }

      setHistory(withClient);
      setLoading(false);

      // Only show inline coaching during attempt 2 (after theory)
      if (attempt !== 2) return;

      // Now check manager's last message for errors (inline coaching)
      setCheckingCoach(true);
      try {
        const sl = stageLabel || (isKz ? 'Сату' : 'Продажи');
        const dialogForCheck = withClient.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
        const coachRaw = await callAPI(
          COACHING_PROMPT[lang](stageId, sl),
          [{ role: 'user', content: `Диалог:\n${dialogForCheck}\n\nПоследняя фраза менеджера: "${text}"` }],
          lang
        );
        const coachClean = coachRaw.replace(/```json|```/g, '').trim();

        if (coachClean && coachClean !== 'null') {
          try {
            const coachData = JSON.parse(coachClean);
            if (coachData?.hasError) {
              // Add coaching hint after the last client message
              setHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  coaching: coachData
                };
                return updated;
              });
            }
          } catch {}
        }
      } catch {}
      setCheckingCoach(false);

    } catch {
      setHistory(prev => [...prev, { from: 'client', text: '...' }]);
      setLoading(false);
      setCheckingCoach(false);
    }
  }

  async function evaluate(fin) {
    setStep('evaluating');
    const dialog = fin.filter(m => !m.coaching).map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
    const keys = (CRITERIA[stageId] || CRITERIA.objections).keys;
    const biz = business || stageBusiness;
    try {
      const raw = await callAPI(buildEvalPrompt(stageId, lang, problem, biz), [{ role: 'user', content: dialog }], 'ru');
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (attempt === 1) { setResult1(parsed); setStep('result1'); }
      else { setResult2(parsed); setStep('result2'); }
    } catch {
      const def = {};
      keys.forEach(k => def[k] = 5);
      const fallback = { scores: def, totalScore: 5, verdict: 'Хорошо', bestMoment: '—', worstMoment: '—', tip: '—', detailedFeedback: '—' };
      if (attempt === 1) { setResult1(fallback); setStep('result1'); }
      else { setResult2(fallback); setStep('result2'); }
    }
  }

  async function generateSummary() {
    setStep('loading_summary');
    const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === stageId);
    try {
      const raw = await callAPI(
        buildSummaryPrompt(lang, problem, result1?.totalScore || 5, result2?.totalScore || 5, stageInfo?.label || stageLabel),
        [{ role: 'user', content: 'Дай резюме' }], lang
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
    setHistory([]); setResult1(null); setResult2(null); setSummary(null);
    setInput(''); setStep('home'); setProblem(''); setBusiness('');
    setStageId(''); setStageLabel(''); setSelectedStage(null);
    setTheoryTab('theory'); setStageBusiness(''); setAttempt(1);
  }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
  const curStage = STAGES_THEORY[lang]?.find(s => s.id === stageId);
  const verdictLabel = (v) => ({ 'Отлично': isKz ? 'Өте жақсы' : 'Отлично', 'Хорошо': isKz ? 'Жақсы' : 'Хорошо', 'Нужна практика': isKz ? 'Жаттығу керек' : 'Нужна практика', 'Слабо': isKz ? 'Нашар' : 'Слабо' }[v] || v);
  const card = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, cursor: 'pointer', textAlign: 'left' };

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
            {(step === 'chat') && (
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
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  {isKz ? 'Жаттығу → қателерді көру → теория → қайта жаттығу → резюме' : 'Практика → ошибки → теория → практика снова → резюме'}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(isKz ? ['1. Жаттығу', '2. Қателер', '3. Теория', '4. Резюме'] : ['1. Практика', '2. Ошибки', '3. Теория', '4. Резюме']).map(s => (
                    <span key={s} style={{ fontSize: 11, color: '#3b82f6', background: '#1e3a5f', padding: '2px 8px', borderRadius: 10 }}>{s}</span>
                  ))}
                </div>
              </button>
              <button onClick={() => setStep('stages_list')} style={card}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📚</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{isKz ? 'Сату кезеңдерін оқу' : 'Изучить этапы продаж'}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'Нұрасылдың теориясы + дайын фразалар + жаттығу' : 'Теория Нурасыла + готовые фразы + практика'}</div>
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
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{isKz ? 'Нұрасыл жаттығу барысында қателерді бірден көрсетеді' : 'Нурасыл будет показывать ошибки прямо во время практики'}</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isKz ? '🏢 Сіздің бизнесіңіз:' : '🏢 Ваш бизнес:'}</label>
              <input value={business} onChange={e => setBusiness(e.target.value)}
                placeholder={isKz ? 'Мысалы: киім дүкені, жылжымайтын мүлік, IT қызметтер...' : 'Например: магазин одежды, недвижимость, IT услуги...'}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '12px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isKz ? '💬 Проблемаңыз:' : '💬 Ваша проблема:'}</label>
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

            <button onClick={startProblemFlow} disabled={!problem.trim() || !business.trim()}
              style={{ width: '100%', background: (problem.trim() && business.trim()) ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: (problem.trim() && business.trim()) ? 'pointer' : 'default' }}>
              {isKz ? '▶ Жаттығуды бастау →' : '▶ Начать практику →'}
            </button>
          </div>
        </div>
      )}

      {/* DETECTING */}
      {step === 'detecting' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 14, color: '#3b82f6' }}>{isKz ? '⏳ Нұрасыл проблемаңызды талдап жатыр...' : '⏳ Нурасыл анализирует вашу проблему...'}</div>
          </div>
        </div>
      )}

      {/* CHAT */}
      {(step === 'chat' || step === 'evaluating') && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Header info */}
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, marginBottom: 2 }}>
                {attempt === 1 ? (isKz ? '🎯 Жаттығу — өзіңіз байқаңыз' : '🎯 Практика — попробуй сам') : (isKz ? '🚀 Жаттығу — теориядан кейін' : '🚀 Практика — после теории')}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>
                💼 {isKz ? 'Сіз — менеджерсіз. Нұрасыл қателерді бірден көрсетеді.' : 'Вы — менеджер. Нурасыл будет показывать ошибки сразу.'}
              </div>
              {problem && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>📋 {problem}</div>}
            </div>

            {history.map((m, i) => (
              <div key={i}>
                {/* Message */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'client' ? 'flex-start' : 'flex-end', gap: 2 }}>
                  <div style={{ fontSize: 10, color: '#475569', marginLeft: m.from === 'client' ? 36 : 0 }}>
                    {m.from === 'client' ? (isKz ? '👤 Сатып алушы' : '👤 Покупатель') : (isKz ? '💼 Сіз (менеджер)' : '💼 Вы (менеджер)')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    {m.from === 'client' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>}
                    <div style={{ maxWidth: '72%', padding: '10px 14px', fontSize: 14, lineHeight: 1.5, borderRadius: m.from === 'client' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: m.from === 'client' ? '#0f172a' : '#1d4ed8', color: '#e2e8f0', border: m.from === 'client' ? '1px solid #1e293b' : 'none' }}>{m.text}</div>
                    {m.from === 'manager' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💼</div>}
                  </div>
                </div>

                {/* Inline coaching hint */}
                {m.coaching && m.coaching.hasError && (
                  <div style={{ margin: '8px 0 4px 0', background: '#1a1a2e', border: '1px solid #f59e0b', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>
                      ⚡ {isKz ? 'Нұрасыл:' : 'Нурасыл:'}
                    </div>
                    <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 6, lineHeight: 1.5 }}>
                      ⚠️ {m.coaching.errorText}
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: '#10b981', marginBottom: 3 }}>{isKz ? '✓ Дұрыс фраза:' : '✓ Правильная фраза:'}</div>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontStyle: 'italic' }}>«{m.coaching.correctPhrase}»</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>💡 {m.coaching.tip}</div>
                  </div>
                )}
              </div>
            ))}

            {(loading || checkingCoach) && (
              <div>
                {loading && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', color: '#334155', letterSpacing: 4, fontSize: 18 }}>•••</div>
                  </div>
                )}
                {checkingCoach && !loading && (
                  <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', padding: '4px 0' }}>
                    ⚡ {isKz ? 'Нұрасыл тексеріп жатыр...' : 'Нурасыл проверяет...'}
                  </div>
                )}
              </div>
            )}

            {step === 'evaluating' && (
              <div style={{ textAlign: 'center', color: '#3b82f6', fontSize: 14, padding: 16 }}>
                ⏳ {isKz ? 'Нұрасыл талдап жатыр...' : 'Нурасыл анализирует...'}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {step === 'chat' && (
            <div style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '10px 14px', display: 'flex', gap: 8 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !loading && !checkingCoach) send(); }}
                placeholder={isKz ? 'Сатып алушыға жауабыңыз...' : 'Ваш ответ покупателю...'}
                style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={send} disabled={!input.trim() || loading || checkingCoach}
                style={{ background: (input.trim() && !loading && !checkingCoach) ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 18, cursor: 'pointer' }}>↑</button>
            </div>
          )}
        </>
      )}

      {/* RESULT 1 */}
      {step === 'result1' && result1 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 700 }}>{isKz ? '1-кезең аяқталды' : 'Стадия 1 завершена'}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{isKz ? 'Енді теорияны оқып, қайта жаттығасыз' : 'Теперь изучите теорию и попробуйте снова'}</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 60, fontWeight: 900, color: vc[result1.verdict] || '#3b82f6', lineHeight: 1 }}>{result1.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>{isKz ? '10-нан' : 'из 10'}</div>
              <div style={{ display: 'inline-block', background: (vc[result1.verdict] || '#3b82f6') + '22', color: vc[result1.verdict] || '#3b82f6', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{verdictLabel(result1.verdict)}</div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{isKz ? 'ТОЛЫҚ БАҒА' : 'ДЕТАЛЬНАЯ ОЦЕНКА'}</div>
              {(CRITERIA[stageId] || CRITERIA.objections).keys.map((k, i) => (
                <Bar key={k} label={(CRITERIA[stageId] || CRITERIA.objections)[lang][i]} value={result1.scores[k] || 5} />
              ))}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>✗ {isKz ? 'БАСТЫ ҚАТЕ' : 'ГЛАВНАЯ ОШИБКА'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, marginBottom: 10 }}>{result1.worstMoment}</div>
              {result1.detailedFeedback && <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, paddingTop: 10, borderTop: '1px solid #1e293b' }}>{result1.detailedFeedback}</div>}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>✓ {isKz ? 'ҮЗДІК СӘТ' : 'ЛУЧШИЙ МОМЕНТ'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{result1.bestMoment}</div>
            </div>

            <button onClick={() => {
              const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === stageId);
              setSelectedStage(stageInfo);
              setTheoryTab('theory');
              setStep('theory_between');
            }} style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              📚 {isKz ? 'Теорияны оқу →' : 'Изучить теорию →'}
            </button>
          </div>
        </div>
      )}

      {/* THEORY BETWEEN */}
      {step === 'theory_between' && selectedStage && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 700 }}>{isKz ? '2-кезең: Теория' : '2 стадия: Теория'}</div>
            </div>

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
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
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
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🚀 {isKz ? 'Теорияны үйрендіңіз!' : 'Теорию изучили!'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{isKz ? 'Енді үйренгеніңізді қолданыңыз' : 'Теперь применяйте знания на практике'}</div>
              <button onClick={() => { setAttempt(2); startChat(stageId, stageLabel, 2); }}
                style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                🚀 {isKz ? 'Қайта жаттығу →' : 'Практика снова →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT 2 */}
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
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: '#10b981', fontWeight: 700 }}>
                  +{result2.totalScore - result1.totalScore} {isKz ? 'балл өсті! 🎉' : 'балла роста! 🎉'}
                </div>
              )}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
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
                <div style={{ paddingTop: 12, borderTop: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>🎓 {isKz ? 'Нұрасылдың толық талдауы' : 'Подробный разбор Нурасыла'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>{result2.detailedFeedback}</div>
                </div>
              )}
            </div>

            <button onClick={generateSummary} style={{ width: '100%', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              📋 {isKz ? 'Резюме →' : 'Резюме →'}
            </button>
          </div>
        </div>
      )}

      {/* LOADING SUMMARY */}
      {step === 'loading_summary' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 14, color: '#3b82f6' }}>{isKz ? '⏳ Нұрасыл резюме дайындап жатыр...' : '⏳ Нурасыл готовит резюме...'}</div>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {step === 'summary' && summary && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>🎓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{isKz ? 'Оқу аяқталды!' : 'Обучение завершено!'}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: vc[result1?.verdict] || '#3b82f6' }}>{result1?.totalScore}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{isKz ? 'Бастапқы' : 'Начало'}</div>
                </div>
                <div style={{ fontSize: 20, color: '#475569', display: 'flex', alignItems: 'center' }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: vc[result2?.verdict] || '#10b981' }}>{result2?.totalScore}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{isKz ? 'Соңы' : 'Итог'}</div>
                </div>
              </div>
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
              <button onClick={() => { setProblem(''); setBusiness(''); setResult1(null); setResult2(null); setSummary(null); setAttempt(1); setHistory([]); setStep('problem'); }}
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
              <input value={stageBusiness} onChange={e => setStageBusiness(e.target.value)}
                placeholder={isKz ? 'Бизнесіңіз...' : 'Ваш бизнес...'}
                style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }} />
              <button onClick={() => { setBusiness(stageBusiness); startChat(selectedStage.id, selectedStage.label, 1); }}
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
