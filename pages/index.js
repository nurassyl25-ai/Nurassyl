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

const ANALYZE_PROMPT = {
  ru: `Ты тренер по продажам Нурасыл. Менеджер описал свою проблему и бизнес.

Определи этап продаж:
- contact: проблемы с приветствием, первым впечатлением
- needs: не может выяснить что нужно клиенту
- presentation: клиент не видит ценности
- objections: клиент говорит дорого, подумаю
- closing: клиент уходит, не решается купить

Не обучай кредитам и рассрочкам. Если про это — направь на работу с ценностью.

Дай полный разбор в JSON:
{"stage":"objections","stageLabel":"Отработка возражений","why":"Почему возникает эта проблема (3-4 предложения)","mistake":"Главная ошибка менеджеров (2-3 предложения)","phrases":["Готовая фраза 1","Готовая фраза 2","Готовая фраза 3","Готовая фраза 4"],"tip":"Главный совет (2-3 предложения)"}
ТОЛЬКО JSON без markdown.`,

  kz: `Сен сату жаттықтырушысы Нұрасылсың. Менеджер мәселесі мен бизнесін сипаттады.

Сату кезеңін анықта:
- contact: сәлемдесу, бірінші әсер мәселесі
- needs: клиентке не керектігін анықтай алмайды
- presentation: клиент құндылықты көрмейді
- objections: клиент қымбат дейді, ойланамын дейді
- closing: клиент шешім қабылдамайды

Кредит немесе бөліп төлеу туралы болса — үйретпе, құндылықпен жұмысқа бағытта.

Толық талдау JSON:
{"stage":"objections","stageLabel":"Қарсылықтарды өңдеу","why":"Проблема неліктен туындайды (3-4 сөйлем)","mistake":"Менеджерлердің басты қатесі (2-3 сөйлем)","phrases":["Дайын жауап 1","Дайын жауап 2","Дайын жауап 3","Дайын жауап 4"],"tip":"Басты кеңес (2-3 сөйлем)"}
ТЕК JSON, markdown жоқ.`
};

const COACHING_PROMPT = {
  ru: (stageLabel) => `Ты тренер Нурасыл. Этап: ${stageLabel}.
Проверь ПОСЛЕДНЮЮ фразу МЕНЕДЖЕРА. Если ошибка — дай короткую подсказку.
Не обучай кредитам и рассрочкам.
Если всё хорошо — верни: null
Если ошибка — JSON:
{"hasError":true,"errorText":"Что не так (1 предложение)","correctPhrase":"Правильная фраза","tip":"Короткий совет"}`,

  kz: (stageLabel) => `Сен тренер Нұрасылсың. Кезең: ${stageLabel}.
МЕНЕДЖЕРДІҢ СОҢҒЫ фразасын тексер. Қате болса — қысқа кеңес бер.
Кредит/бөліп төлеу болса үйретпе.
Жақсы болса — қайтар: null
Қате болса — JSON:
{"hasError":true,"errorText":"Нені дұрыс жасамады (1 сөйлем)","correctPhrase":"Дұрыс фраза","tip":"Қысқа кеңес"}`
};

function buildBuyerPrompt(business, stageId, lang) {
  const stageData = STAGES_THEORY[lang]?.find(s => s.id === stageId);
  const firstMsg = stageData?.firstMsg?.[lang] || (lang === 'kz' ? 'Сәлеметсіз бе' : 'Здравствуйте');

  if (lang === 'kz') {
    const s = {
      contact: `Сен — "${business}" саласының нақты сатып алушысысың. Жаңа келдің. Қарапайым адам сияқты сөйлес — ресми емес, тірі адам сияқты.`,
      needs: `Сен — "${business}" саласының нақты сатып алушысысың. Бір нәрсе алғың келеді бірақ не керектігін толық білмейсің. Ойланып, екілана сөйлес.`,
      presentation: `Сен — "${business}" саласының скептик сатып алушысысың. Сенімсіз, нақты пайда көрмесең "Е, бұл маған не береді?" немесе "Мм, білмеймін..." деп күмәнмен жауап бер.`,
      objections: `Сен — "${business}" саласының сатып алушысысың. Бірінші сөзің: "${firstMsg}". Тірі адам сияқты — эмоциямен, ренжіп немесе таңданып жауап бер.`,
      closing: `Сен — "${business}" саласында сатып алуға дерлік дайын сатып алушысысың. Бірақ соңғы сәтте де екіланасың.`,
    }[stageId] || '';
    return `${s}

МАҢЫЗДЫ: Тірі адам сияқты сөйлес!
- Менеджер нені айтса — сол туралы жауап бер. Өзінен ештеңе қоспа.
- Егер түсінбесең — "Қалай?" немесе "Яғни не?" деп қайта сұра
- Қысқа, бейресми: "Ой, қымбат екен...", "Мм, білмеймін", "Е, айтыңызшы"
- Эмоция болсын — таңдану, күмән, қызығушылық
- Тренер емессің — кеңес берме, менеджерге көмектеспе
- Тек қазақша
- Кредит ұсынса: "Жоқ, кредит керек емес маған"
- МАҢЫЗДЫ: Егер менеджер "Ок", "Иә", "Ештене", "Жарайды" сияқты қысқа мағынасыз жауап берсе — табиғи түрде кетіп қал: "Түсінікті, онда мен басқа жерге қараймын" немесе "Жарайды, ойланып көрейін"
- 8 хабарламадан кейін шешім: "Жарайды, рәсімдейік" немесе "Жоқ, басқа жерге барамын"`;
  }

  const s = {
    contact: `Ты — обычный живой покупатель в "${business}". Только зашёл. Говори как нормальный человек — неформально, с живыми реакциями.`,
    needs: `Ты — живой покупатель в "${business}". Хочешь что-то купить но сам ещё не разобрался. Говори с сомнением, думай вслух.`,
    presentation: `Ты — скептичный покупатель в "${business}". Говори как обычный человек — "Ну и что с того?", "Хм, не знаю...", "А это точно поможет?"`,
    objections: `Ты — живой покупатель в "${business}". Первая фраза: "${firstMsg}". Говори с эмоцией — удивлённо, немного раздражённо или задумчиво.`,
    closing: `Ты — покупатель в "${business}" почти готовый купить, но всё ещё немного сомневаешься.`,
  }[stageId] || '';

  return `${s}

ВАЖНО: Говори как живой человек, не робот!
- Отвечай ТОЛЬКО на то что сказал менеджер — не додумывай и не предполагай.
- Если непонятно — переспроси: "Это как?" или "В смысле?"
- Разговорный стиль: "Ну дорого же...", "Хм, надо подумать", "Интересно..."
- Короткие живые реплики — как в реальном разговоре или WhatsApp
- Эмоции — удивление, сомнение, любопытство
- Не учи и не помогай менеджеру
- Только русский язык
- Кредит/рассрочку: "Нет, кредит не хочу"
- ВАЖНО: Если менеджер пишет бессмысленный короткий ответ — "Ок", "Да", "Ничего", "Понял" без продолжения — уходи естественно: "Ладно, пойду в другое место посмотрю" или "Ну ок, подумаю"
- После 8 сообщений: "Ладно, оформляем" или "Нет, пойду ещё посмотрю"`;
}

function buildEvalPrompt(stageId, lang, problem, business) {
  const { keys } = CRITERIA[stageId] || CRITERIA.objections;
  const labels = (CRITERIA[stageId] || CRITERIA.objections)[lang];
  const ex = {};
  keys.forEach(k => ex[k] = 5);
  const isKz = lang === 'kz';
  return `Тренер Нурасыл. Бизнес: "${business}". Проблема: "${problem}".
Оцени МЕНЕДЖЕРА. Критерии: ${keys.map((k,i)=>k+'('+labels[i]+')').join(', ')}.
${isKz ? 'Барлығын қазақша жаз.' : 'Всё на русском.'}
JSON: ${JSON.stringify({scores:ex,totalScore:5,verdict:"Хорошо",bestMoment:"конкретный момент",worstMoment:"конкретная ошибка",tip:"совет",detailedFeedback:"разбор 3-4 предложения"})}`;
}

function buildSummaryPrompt(lang, problem, score, stageLabel) {
  const isKz = lang === 'kz';
  return `Тренер Нурасыл. Тема: "${stageLabel}". Проблема: "${problem}". Результат: ${score}/10.
${isKz ? 'Қазақша жаз.' : 'На русском.'}
JSON: ${JSON.stringify({achievement:"что освоил",stillNeed:"что доработать",homework:"конкретное задание для самостоятельной практики",nextStage:"следующий этап для изучения и почему"})}`;
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
  const [analysis, setAnalysis] = useState(null);
  const [stageId, setStageId] = useState('');
  const [stageLabel, setStageLabel] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [selectedStage, setSelectedStage] = useState(null);
  const [theoryTab, setTheoryTab] = useState('theory');
  const [stageBusiness, setStageBusiness] = useState('');

  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingCoach, setCheckingCoach] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);
  const [summary, setSummary] = useState(null);

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

  async function handleAnalyze() {
    if (!problem.trim() || !business.trim()) return;
    setLoadingAnalysis(true);
    try {
      const prompt = `Бизнес: ${business}\nПроблема: ${problem}`;
      const raw = await callAPI(ANALYZE_PROMPT[lang], [{ role: 'user', content: prompt }], lang);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
      setStageId(parsed.stage);
      setStageLabel(parsed.stageLabel);
      setStep('analysis');
    } catch {
      const fallback = {
        stage: 'objections',
        stageLabel: isKz ? 'Қарсылықтарды өңдеу' : 'Отработка возражений',
        why: isKz ? 'Клиент бағаны емес, пайданы сезінбейді.' : 'Клиент не видит ценность продукта.',
        mistake: isKz ? 'Менеджер бірден жеңілдік береді.' : 'Менеджер сразу даёт скидку.',
        phrases: isKz
          ? ['Түсінемін. Бұл бағаға не кіреді?', 'Неге қарағанда қымбат?', 'Баға мәселесі болмаса — алар едіңіз бе?', 'Сіз үшін маңыздысы не — баға ма, сапа ма?']
          : ['Понимаю. Давайте посмотрим что входит в цену.', 'По сравнению с чем дорого?', 'Если бы цена не стояла — вы бы взяли?', 'Что для вас важнее — цена или качество?'],
        tip: isKz ? 'Алдымен пайданы анықтаңыз.' : 'Сначала выясните ценность для клиента.',
      };
      setAnalysis(fallback);
      setStageId(fallback.stage);
      setStageLabel(fallback.stageLabel);
      setStep('analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  }

  function startPractice() {
    const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === stageId);
    const firstMsg = stageInfo?.firstMsg?.[lang] || (isKz ? 'Сәлеметсіз бе' : 'Здравствуйте');
    setHistory([{ from: 'client', text: firstMsg }]);
    setPracticeResult(null);
    setStep('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send() {
    if (!input.trim() || loading || checkingCoach) return;
    const text = input.trim();
    setInput('');
    const newHistory = [...history, { from: 'manager', text }];
    setHistory(newHistory);
    setLoading(true);

    const allMsgs = newHistory.map(m => ({ role: m.from === 'manager' ? 'user' : 'assistant', content: m.text }));
    while (allMsgs.length > 0 && allMsgs[0].role === 'assistant') allMsgs.shift();

    try {
      const biz = business || stageBusiness;
      const reply = await callAPI(buildBuyerPrompt(biz, stageId, lang), allMsgs, lang);
      const withClient = [...newHistory, { from: 'client', text: reply }];

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

      // Inline coaching
      setCheckingCoach(true);
      try {
        const sl = stageLabel || (isKz ? 'Сату' : 'Продажи');
        const dialogForCheck = withClient.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
        const coachRaw = await callAPI(
          COACHING_PROMPT[lang](sl),
          [{ role: 'user', content: `${dialogForCheck}\n\nПоследняя фраза менеджера: "${text}"` }],
          lang
        );
        const coachClean = coachRaw.replace(/```json|```/g, '').trim();
        if (coachClean && coachClean !== 'null') {
          try {
            const coachData = JSON.parse(coachClean);
            if (coachData?.hasError) {
              setHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], coaching: coachData };
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
    const dialog = fin.map(m => `${m.from === 'client' ? 'КЛИЕНТ' : 'МЕНЕДЖЕР'}: ${m.text}`).join('\n');
    const biz = business || stageBusiness;
    const keys = (CRITERIA[stageId] || CRITERIA.objections).keys;
    try {
      const raw = await callAPI(buildEvalPrompt(stageId, lang, problem, biz), [{ role: 'user', content: dialog }], 'ru');
      const clean = raw.replace(/```json|```/g, '').trim();
      setPracticeResult(JSON.parse(clean));
    } catch {
      const def = {};
      keys.forEach(k => def[k] = 5);
      setPracticeResult({ scores: def, totalScore: 5, verdict: 'Хорошо', bestMoment: '—', worstMoment: '—', tip: '—', detailedFeedback: '—' });
    }
    setStep('result');
  }

  async function generateSummary() {
    setStep('loading_summary');
    try {
      const raw = await callAPI(
        buildSummaryPrompt(lang, problem, practiceResult?.totalScore || 5, stageLabel),
        [{ role: 'user', content: 'Дай резюме' }], lang
      );
      const clean = raw.replace(/```json|```/g, '').trim();
      setSummary(JSON.parse(clean));
    } catch {
      setSummary({
        achievement: '—', stillNeed: '—', homework: '—', nextStage: '—'
      });
    }
    setStep('summary');
  }

  function reset() {
    setHistory([]); setPracticeResult(null); setSummary(null); setInput('');
    setStep('home'); setProblem(''); setBusiness(''); setAnalysis(null);
    setStageId(''); setStageLabel(''); setSelectedStage(null);
    setTheoryTab('theory'); setStageBusiness('');
  }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
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
            {step === 'chat' && (
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
            <button onClick={handleLogin} disabled={!codeInput.trim()} style={{ width: '100%', background: codeInput.trim() ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: codeInput.trim() ? 'pointer' : 'default' }}>
              Войти / Кіру →
            </button>
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
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 10 }}>
                  {isKz ? 'Нұрасыл проблемаңызды талдайды → теория + фишкалар → жаттығу → резюме' : 'Нурасыл разберёт проблему → теория + фишки → практика с подсказками → резюме'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(isKz ? ['1. Талдау', '2. Теория', '3. Жаттығу', '4. Резюме'] : ['1. Разбор', '2. Теория', '3. Практика', '4. Резюме']).map(s => (
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
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              {isKz ? 'Нұрасыл талдап, теория мен фишкаларды береді. Содан кейін жаттығу.' : 'Нурасыл разберёт и даст теорию + фишки. Потом практика с подсказками.'}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>🏢 {isKz ? 'Сіздің бизнесіңіз:' : 'Ваш бизнес:'}</label>
              <input value={business} onChange={e => setBusiness(e.target.value)}
                placeholder={isKz ? 'Мысалы: киім дүкені, жылжымайтын мүлік, IT қызметтер...' : 'Например: магазин одежды, недвижимость, IT услуги...'}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '12px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>💬 {isKz ? 'Проблемаңыз (толығырақ жазыңыз):' : 'Ваша проблема (опишите подробно):'}</label>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 8, marginBottom: 8 }}>
                {(isKz
                  ? ['Клиент қымбат деп кетіп қалады', 'Клиентпен қалай сөйлесуді білмеймін', 'Клиент тыңдайды бірақ сатып алмайды', 'Клиент шешім қабылдамайды']
                  : ['Клиенты говорят «дорого» и уходят', 'Не знаю как начать разговор', 'Клиент слушает но не покупает', 'Клиент не принимает решение']
                ).map(ex => (
                  <button key={ex} onClick={() => setProblem(ex)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '5px 8px', textAlign: 'left', display: 'block', width: '100%' }}>→ {ex}</button>
                ))}
              </div>
              <textarea value={problem} onChange={e => setProblem(e.target.value)}
                placeholder={isKz ? 'Проблемаңызды толығырақ сипаттаңыз...' : 'Опишите проблему подробнее — что происходит, как реагирует клиент...'}
                style={{ width: '100%', minHeight: 110, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleAnalyze} disabled={!problem.trim() || !business.trim() || loadingAnalysis}
              style={{ width: '100%', background: (problem.trim() && business.trim() && !loadingAnalysis) ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: (problem.trim() && business.trim()) ? 'pointer' : 'default' }}>
              {loadingAnalysis ? (isKz ? '⏳ Нұрасыл талдап жатыр...' : '⏳ Нурасыл анализирует...') : (isKz ? 'Талдау алу →' : 'Получить разбор →')}
            </button>
          </div>
        </div>
      )}

      {/* ANALYSIS — разбор + теория + фишки */}
      {step === 'analysis' && analysis && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>

            {/* Problem recap */}
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
              🏢 {business} · 💬 {problem}
            </div>

            {/* Stage */}
            <div style={{ background: '#0f172a', border: '1px solid #3b82f6', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{isKz ? 'ЖАТТЫҒУ КЕРЕК КЕЗЕҢ' : 'НУЖНО ТРЕНИРОВАТЬ'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{STAGES_THEORY[lang]?.find(s => s.id === analysis.stage)?.emoji || '🛡️'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{analysis.stageLabel}</div>
              </div>
            </div>

            {/* Why */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>🧠 {isKz ? 'НЕЛІКТЕН СОЛАЙ БОЛАДЫ?' : 'ПОЧЕМУ ТАК ПРОИСХОДИТ?'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{analysis.why}</div>
            </div>

            {/* Mistake */}
            <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>✗ {isKz ? 'МЕНЕДЖЕРЛЕРДІҢ БАСТЫ ҚАТЕСІ' : 'ГЛАВНАЯ ОШИБКА МЕНЕДЖЕРОВ'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{analysis.mistake}</div>
            </div>

            {/* Phrases */}
            <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>💬 {isKz ? 'ДАЙЫН ФРАЗАЛАР' : 'ГОТОВЫЕ ФРАЗЫ'}</div>
              {analysis.phrases?.map((phrase, i) => (
                <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{phrase}
                </div>
              ))}
            </div>

            {/* Tip */}
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>⚡ {isKz ? 'НҰРАСЫЛДЫҢ БАСТЫ КЕҢЕСІ' : 'ГЛАВНЫЙ СОВЕТ НУРАСЫЛА'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{analysis.tip}</div>
            </div>

            {/* Theory from lib */}
            {(() => {
              const stageInfo = STAGES_THEORY[lang]?.find(s => s.id === analysis.stage);
              if (!stageInfo) return null;
              return (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>📖 {isKz ? 'ТЕОРИЯ' : 'ТЕОРИЯ'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: 14 }}>{stageInfo.theory}</div>
                  <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>✅ {isKz ? 'ҚАДАМДАР' : 'ШАГИ'}</div>
                  {stageInfo.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{s}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Start practice */}
            <div style={{ background: '#0f172a', border: '1px solid #10b981', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>🎯 {isKz ? 'Жаттығуға дайынсыз ба?' : 'Готовы к практике?'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                {isKz ? 'Нұрасыл жаттығу барысында қателерді бірден көрсетеді' : 'Нурасыл будет показывать ошибки прямо во время диалога'}
              </div>
              <button onClick={startPractice} style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                ⚡ {isKz ? 'Жаттығуды бастау →' : 'Начать практику →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT */}
      {(step === 'chat' || step === 'evaluating') && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, marginBottom: 2 }}>
                🎯 {isKz ? 'Жаттығу · ' + stageLabel : 'Практика · ' + stageLabel}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>
                💼 {isKz ? 'Сіз — менеджерсіз. Нұрасыл қателерді бірден көрсетеді.' : 'Вы — менеджер. Нурасыл показывает ошибки сразу.'}
              </div>
            </div>

            {history.map((m, i) => (
              <div key={i}>
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

                {m.coaching?.hasError && (
                  <div style={{ margin: '8px 0 4px 36px', background: '#1a1a2e', border: '1px solid #f59e0b', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>⚡ {isKz ? 'Нұрасыл:' : 'Нурасыл:'}</div>
                    <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 8, lineHeight: 1.5 }}>⚠️ {m.coaching.errorText}</div>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: '#10b981', marginBottom: 3 }}>{isKz ? '✓ Дұрыс фраза:' : '✓ Правильная фраза:'}</div>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontStyle: 'italic' }}>«{m.coaching.correctPhrase}»</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>💡 {m.coaching.tip}</div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '4px 16px 16px 16px', color: '#334155', letterSpacing: 4, fontSize: 18 }}>•••</div>
              </div>
            )}
            {checkingCoach && !loading && (
              <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center', padding: '4px 0' }}>
                ⚡ {isKz ? 'Нұрасыл тексеріп жатыр...' : 'Нурасыл проверяет...'}
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

      {/* RESULT */}
      {step === 'result' && practiceResult && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 72, fontWeight: 900, color: vc[practiceResult.verdict] || '#3b82f6', lineHeight: 1 }}>{practiceResult.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>{isKz ? '10-нан' : 'из 10'}</div>
              <div style={{ display: 'inline-block', background: (vc[practiceResult.verdict] || '#3b82f6') + '22', color: vc[practiceResult.verdict] || '#3b82f6', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>
                {verdictLabel(practiceResult.verdict)}
              </div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{isKz ? 'ТОЛЫҚ БАҒА' : 'ДЕТАЛЬНАЯ ОЦЕНКА'}</div>
              {(CRITERIA[stageId] || CRITERIA.objections).keys.map((k, i) => (
                <Bar key={k} label={(CRITERIA[stageId] || CRITERIA.objections)[lang][i]} value={practiceResult.scores[k] || 5} />
              ))}
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              {[
                { label: isKz ? '✓ Үздік сәт' : '✓ Лучший момент', text: practiceResult.bestMoment, color: '#10b981' },
                { label: isKz ? '✗ Басты қате' : '✗ Главная ошибка', text: practiceResult.worstMoment, color: '#ef4444' },
                { label: isKz ? '→ Кеңес' : '→ Совет', text: practiceResult.tip, color: '#f59e0b' },
              ].map(({ label, text, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
              {practiceResult.detailedFeedback && (
                <div style={{ paddingTop: 12, borderTop: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                    🎓 {isKz ? 'Нұрасылдың толық талдауы' : 'Подробный разбор Нурасыла'}
                  </div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>{practiceResult.detailedFeedback}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <button onClick={startPractice} style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isKz ? '🔄 Қайталау' : '🔄 Повторить'}
              </button>
              <button onClick={generateSummary} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {isKz ? '📋 Резюме →' : '📋 Резюме →'}
              </button>
            </div>
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
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{isKz ? 'Оқу аяқталды!' : 'Обучение завершено!'}</h2>
            </div>

            {[
              { icon: '🏆', label: isKz ? 'Не үйрендіңіз' : 'Что освоили', text: summary.achievement, color: '#10b981' },
              { icon: '🎯', label: isKz ? 'Не жетіспейді' : 'Что ещё нужно', text: summary.stillNeed, color: '#f59e0b' },
              { icon: '📝', label: isKz ? 'Үй тапсырмасы' : 'Домашнее задание', text: summary.homework, color: '#8b5cf6' },
              { icon: '➡️', label: isKz ? 'Келесі кезең' : 'Следующий этап', text: summary.nextStage, color: '#3b82f6' },
            ].map(({ icon, label, text, color }) => (
              <div key={label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{icon} {label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{text}</div>
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button onClick={() => { setProblem(''); setBusiness(''); setAnalysis(null); setPracticeResult(null); setSummary(null); setHistory([]); setStep('problem'); }}
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
                <button key={s.id} onClick={() => { setSelectedStage(s); setStageId(s.id); setStageLabel(s.label); setTheoryTab('theory'); setStep('theory'); }}
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

      {/* THEORY */}
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
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🎯 {isKz ? 'Жаттығуға дайынсыз ба?' : 'Готовы практиковаться?'}</div>
              <input value={stageBusiness} onChange={e => setStageBusiness(e.target.value)}
                placeholder={isKz ? 'Бизнесіңіз...' : 'Ваш бизнес...'}
                style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }} />
              <button onClick={() => { setBusiness(stageBusiness); startPractice(); }}
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
