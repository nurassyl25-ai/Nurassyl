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

const STAGES_THEORY = {
  ru: [
    {
      id: "contact", label: "Установление контакта", emoji: "👋",
      goal: "Создать первое положительное впечатление и расположить клиента к общению",
      why: "Клиент решает доверять ли вам в первые 7 секунд. Если контакт не установлен — всё остальное не работает.",
      theory: "Установление контакта — это не просто приветствие. Это создание атмосферы доверия. Клиент должен почувствовать что вы на его стороне, а не пытаетесь что-то продать. Ключевые элементы: улыбка и открытая поза, имя клиента, энергия и уверенность, искренний интерес.",
      steps: ["Поприветствуйте тепло и с энергией", "Назовите себя и компанию", "Узнайте имя клиента", "Создайте комфорт — small talk или комплимент"],
      phrases: ["Добрый день! Меня зовут [имя]. Рад вас видеть!", "Как вас зовут? Буду рад познакомиться.", "Вижу вы интересуетесь [продуктом] — расскажу всё что нужно знать.", "Вы впервые у нас? Тогда давайте я покажу что у нас есть интересного."],
      mistakes: ["Сухое «Здравствуйте, чем помочь?»", "Сразу начинать продавать", "Не узнать имя клиента", "Смотреть в телефон или отвлекаться"],
      firstMsg: { ru: "Здравствуйте", kz: "Сәлеметсіз бе" }
    },
    {
      id: "needs", label: "Выявление потребностей", emoji: "🔍",
      goal: "Понять что именно нужно клиенту — его боль, желание и критерии выбора",
      why: "Если не знаешь что нужно клиенту — будешь предлагать не то. 80% неудачных продаж — это продажа не того продукта.",
      theory: "Выявление потребностей — самый важный этап. Большинство менеджеров его пропускают и сразу переходят к презентации. Используйте открытые вопросы (что, как, зачем, расскажите), слушайте внимательно, не перебивайте, уточняйте. Цель — найти главную боль клиента.",
      steps: ["Задайте открытый вопрос о ситуации", "Выясните что важно клиенту", "Найдите скрытую боль или желание", "Резюмируйте: «Правильно ли я понял...»"],
      phrases: ["Расскажите, для чего вам это нужно?", "Что для вас важнее всего при выборе?", "С какими трудностями сейчас сталкиваетесь?", "Если бы всё было идеально — как бы это выглядело?"],
      mistakes: ["Задавать закрытые вопросы (да/нет)", "Перебивать клиента", "Сразу предлагать продукт", "Не слушать — думать о своём ответе"],
      firstMsg: { ru: "Привет, хочу кое-что купить", kz: "Сәлем, бір нәрсе алғым келеді" }
    },
    {
      id: "presentation", label: "Презентация", emoji: "🎯",
      goal: "Показать как ваш продукт решает проблему клиента и создаёт ценность",
      why: "Клиент покупает не продукт — он покупает решение своей проблемы. Нужно говорить на языке выгод, а не характеристик.",
      theory: "Главное правило: характеристика → выгода → эмоция. Не «у нас быстрая доставка» а «вы получите завтра и не нужно ждать». Говорите о том что важно именно этому клиенту — используйте информацию из этапа выявления потребностей. Используйте истории и примеры других клиентов.",
      steps: ["Свяжите презентацию с потребностью клиента", "Говорите о выгодах, а не характеристиках", "Используйте конкретные цифры и примеры", "Вовлекайте клиента — задавайте вопросы"],
      phrases: ["Вы сказали что важна скорость — у нас доставка за 2 часа.", "Представьте: через неделю у вас уже будет [результат].", "Наши клиенты в похожей ситуации получили [результат].", "Как вам такой вариант?"],
      mistakes: ["Говорить о характеристиках без выгод", "Не учитывать потребности клиента", "Говорить слишком долго без пауз", "Не проверять реакцию клиента"],
      firstMsg: { ru: "Расскажите про ваш продукт", kz: "Өніміңіз туралы айтыңызшы" }
    },
    {
      id: "objections", label: "Отработка возражений", emoji: "🛡️",
      goal: "Превратить сомнения клиента в аргументы для покупки",
      why: "Возражение — это не отказ. Это запрос на дополнительную информацию. Клиент ещё думает о покупке.",
      theory: "Алгоритм работы с возражением: 1) Присоединитесь — покажите что понимаете клиента. 2) Уточните — что именно смущает. 3) Аргументируйте — приведите факты и выгоды. 4) Закройте — предложите следующий шаг. Никогда не спорьте с клиентом — это разрушает доверие.",
      steps: ["Выслушайте возражение до конца", "Присоединитесь: «Понимаю вас...»", "Уточните: «Что именно смущает?»", "Аргументируйте и предложите решение"],
      phrases: ["Понимаю, цена важна. Давайте посмотрим что входит в эту стоимость.", "Да, стоит дороже. Зато вы экономите [время/деньги] на [чём].", "Что именно смущает — сама цена или соотношение цены и качества?", "Если бы вопрос цены не стоял — вы бы взяли?"],
      mistakes: ["Спорить с клиентом", "Сразу давать скидку", "Игнорировать возражение", "Говорить «но» — лучше «и при этом»"],
      firstMsg: { ru: "Интересно, но дорого...", kz: "Қызықты, бірақ қымбат..." }
    },
    {
      id: "closing", label: "Закрытие сделки", emoji: "✅",
      goal: "Помочь клиенту принять решение и оформить покупку",
      why: "Многие менеджеры делают отличную работу но не закрывают — боятся отказа или ждут что клиент сам скажет «куплю».",
      theory: "Закрытие — это не давление. Это помощь клиенту принять решение. Признаки готовности к покупке: клиент спрашивает о деталях, обсуждает доставку, говорит «нам» а не «мне». Техники закрытия: альтернативный вопрос, ограниченность, следующий шаг.",
      steps: ["Замечайте сигналы готовности", "Резюмируйте договорённости", "Предложите конкретный следующий шаг", "Оформите — не ждите что клиент скажет первым"],
      phrases: ["Оформляем на вас? Как вам удобнее оплатить?", "Как вам в целом — берём?", "Осталось только оформить — займёт 5 минут.", "Когда вам удобнее получить — завтра или послезавтра?"],
      mistakes: ["Ждать что клиент сам скажет «куплю»", "Закрывать слишком рано или поздно", "Давать слишком много времени «подумать»", "Не предлагать конкретный следующий шаг"],
      firstMsg: { ru: "Ну в принципе понятно... надо подумать", kz: "Жалпы түсінікті... ойланып көрейін" }
    }
  ],
  kz: [
    {
      id: "contact", label: "Байланыс орнату", emoji: "👋",
      goal: "Клиентпен оң алғашқы әсер қалдырып, сенімді қарым-қатынас орнату",
      why: "Клиент алғашқы 7 секундта сізге сенетінін шешеді. Байланыс орнатылмаса — қалғанының бәрі жұмыс істемейді.",
      theory: "Байланыс орнату — бұл тек сәлемдесу емес. Бұл сенім атмосферасын жасау. Клиент сіз оның жағында екеніңізді сезінуі керек. Негізгі элементтер: жылы күлімсіреу, клиенттің аты, энергия мен сенімділік, шынайы қызығушылық.",
      steps: ["Жылы және энергиямен сәлемдесіңіз", "Өзіңізді және компанияны таныстырыңыз", "Клиенттің атын біліңіз", "Ыңғайлы атмосфера жасаңыз"],
      phrases: ["Сәлеметсіз бе! Менің атым [аты]. Сізбен кездескеніме қуаныштымын!", "Сіздің атыңыз кім? Таныспасам бола ма?", "Сіз [өніммен] қызығып жатқаныңызды көрдім — бәрін айтып беремін.", "Бізге бірінші рет келдіңіз бе? Онда маған еріңіз, қызықты нәрселерді көрсетейін."],
      mistakes: ["Құрғақ «Сәлеметсіз бе, немен көмектесем?»", "Бірден сатуды бастау", "Клиенттің атын сұрамау", "Телефонға қарап немесе алаңдау"],
      firstMsg: { ru: "Здравствуйте", kz: "Сәлеметсіз бе" }
    },
    {
      id: "needs", label: "Қажеттіліктерді анықтау", emoji: "🔍",
      goal: "Клиентке не керектігін — оның ауруын, тілегін және таңдау өлшемдерін түсіну",
      why: "Клиентке не керектігін білмесеңіз — дұрыс емес нәрсе ұсынасыз. Сәтсіз сатылымдардың 80% — дұрыс емес өнімді сату.",
      theory: "Қажеттіліктерді анықтау — ең маңызды кезең. Менеджерлердің көпшілігі оны өткізіп, бірден презентацияға көшеді. Ашық сұрақтар қолданыңыз, мұқият тыңдаңыз, үзбеңіз, нақтылаңыз. Мақсат — клиенттің басты проблемасын табу.",
      steps: ["Жағдай туралы ашық сұрақ қойыңыз", "Клиент үшін не маңызды екенін біліңіз", "Жасырын ауруды немесе тілекті табыңыз", "Қорытыңыз: «Мен дұрыс түсіндім бе...»"],
      phrases: ["Бұл сізге не үшін керек, айтып берсеңіз?", "Таңдауда сіз үшін ең маңыздысы не?", "Қазір қандай қиындықтармен кездесіп жатырсыз?", "Барлығы мінсіз болса — бұл қалай болар еді?"],
      mistakes: ["Жабық сұрақтар қою (иә/жоқ)", "Клиентті үзу", "Бірден өнім ұсыну", "Тыңдамау — өз жауабы туралы ойлау"],
      firstMsg: { ru: "Привет, хочу кое-что купить", kz: "Сәлем, бір нәрсе алғым келеді" }
    },
    {
      id: "presentation", label: "Презентация", emoji: "🎯",
      goal: "Өніміңіздің клиенттің проблемасын қалай шешетінін және құндылық жасайтынын көрсету",
      why: "Клиент өнімді емес — проблемасының шешімін сатып алады. Сипаттамалар емес, пайда тілінде сөйлеу керек.",
      theory: "Негізгі ереже: сипаттама → пайда → эмоция. «Жылдам жеткізу» емес, «ертең аласыз және күтудің қажеті жоқ». Клиентке маңызды нәрсе туралы айтыңыз — қажеттіліктерді анықтау кезеңіндегі ақпаратты қолданыңыз.",
      steps: ["Презентацияны клиент қажеттілігімен байланыстырыңыз", "Сипаттамалар емес, пайда туралы айтыңыз", "Нақты сандар мен мысалдарды қолданыңыз", "Клиентті тартыңыз — сұрақтар қойыңыз"],
      phrases: ["Сіз жылдамдық маңызды дедіңіз — бізде 2 сағатта жеткізу.", "Елестетіңіз: бір аптадан кейін сізде [нәтиже] болады.", "Біздің ұқсас жағдайдағы клиенттер [нәтиже] алды.", "Бұл нұсқа сізге қалай?"],
      mistakes: ["Пайдасыз сипаттамалар туралы айту", "Клиент қажеттіліктерін ескермеу", "Тым ұзақ үзіссіз сөйлеу", "Клиент реакциясын тексермеу"],
      firstMsg: { ru: "Расскажите про ваш продукт", kz: "Өніміңіз туралы айтыңызшы" }
    },
    {
      id: "objections", label: "Қарсылықтарды өңдеу", emoji: "🛡️",
      goal: "Клиенттің күмәнін сатып алуға дәлелге айналдыру",
      why: "Қарсылық — бұл бас тарту емес. Бұл қосымша ақпаратқа сұраныс. Клиент әлі сатып алу туралы ойлап жатыр.",
      theory: "Қарсылықпен жұмыс алгоритмі: 1) Қосылыңыз — клиентті түсінетіңізді көрсетіңіз. 2) Нақтылаңыз — нені мазалайтынын. 3) Дәлелдеңіз — фактілер мен пайда келтіріңіз. 4) Жабыңыз — келесі қадамды ұсыныңыз. Клиентпен ешқашан даласпаңыз.",
      steps: ["Қарсылықты соңына дейін тыңдаңыз", "Қосылыңыз: «Түсінемін сізді...»", "Нақтылаңыз: «Нені мазалайды?»", "Дәлелдеп, шешім ұсыныңыз"],
      phrases: ["Түсінемін, баға маңызды. Бұл құнға не кіретінін қарайық.", "Иә, қымбатырақ. Бірақ сіз [нәрсеге] [уақыт/ақша] үнемдейсіз.", "Нені мазалайды — бағаның өзі ме, әлде баға мен сапа қатынасы ма?", "Баға мәселесі болмаса — алар едіңіз бе?"],
      mistakes: ["Клиентпен дауласу", "Бірден жеңілдік беру", "Қарсылықты елемеу", "«Бірақ» деу — «ал сонымен қатар» дегені жақсы"],
      firstMsg: { ru: "Интересно, но дорого...", kz: "Қызықты, бірақ қымбат..." }
    },
    {
      id: "closing", label: "Мәмілені жабу", emoji: "✅",
      goal: "Клиентке шешім қабылдауға және сатып алуды рәсімдеуге көмектесу",
      why: "Көп менеджерлер жақсы жұмыс жасайды бірақ жаппайды — бас тартудан қорқады немесе клиент өзі «аламын» дейді деп күтеді.",
      theory: "Жабу — бұл қысым емес. Бұл клиентке шешім қабылдауға көмек. Сатып алуға дайын белгілер: клиент бөлшектер туралы сұрайды, жеткізуді талқылайды. Жабу техникалары: альтернативті сұрақ, шектеулілік, келесі қадам.",
      steps: ["Дайындық белгілерін байқаңыз", "Келісімдерді қорытыңыз", "Нақты келесі қадамды ұсыныңыз", "Рәсімдеңіз — клиент бірінші айтады деп күтпеңіз"],
      phrases: ["Сізге рәсімдейміз бе? Қалай төлейсіз?", "Жалпы қалай — аламыз ба?", "Тек рәсімдеу қалды — 5 минут алады.", "Қашан алғыңыз келеді — ертең ме, бүрсігүні ме?"],
      mistakes: ["Клиент өзі «аламын» дейді деп күту", "Тым ерте немесе кеш жабу", "«Ойлануға» тым көп уақыт беру", "Нақты келесі қадамды ұсынбау"],
      firstMsg: { ru: "Ну в принципе понятно... надо подумать", kz: "Жалпы түсінікті... ойланып көрейін" }
    }
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
  ru: `Ты опытный тренер по продажам. Менеджер описал свою проблему. Дай развёрнутый разбор в JSON:
{"stage":"objections","stageLabel":"Отработка возражений","why":"Почему клиенты так говорят (3-4 предложения)","mistake":"Главная ошибка менеджеров (2-3 предложения)","phrases":["Фраза 1","Фраза 2","Фраза 3","Фраза 4"],"tip":"Главный совет (2-3 предложения)"}
ТОЛЬКО JSON без markdown.`,
  kz: `Сен тәжірибелі сату жаттықтырушысысың. Менеджер мәселесін сипаттады. Толық талдауды JSON берсін:
{"stage":"objections","stageLabel":"Қарсылықтарды өңдеу","why":"Клиенттер неліктен солай айтады (3-4 сөйлем қазақша)","mistake":"Менеджерлердің басты қатесі (2-3 сөйлем қазақша)","phrases":["Жауап 1","Жауап 2","Жауап 3","Жауап 4"],"tip":"Басты кеңес (2-3 сөйлем қазақша)"}
ТЕК JSON, markdown жоқ.`
};

function buildBuyerPrompt(business, stageId, lang, problem) {
  const bLabel = BUSINESS_TYPES[lang].find(b => b.id === business)?.label || business;
  const extra = problem ? (lang === 'kz' ? `\nМенеджер проблемасы: "${problem}"` : `\nПроблема менеджера: "${problem}"`) : '';
  const stageData = STAGES_THEORY[lang].find(s => s.id === stageId);
  const firstMsg = stageData?.firstMsg?.[lang] || 'Здравствуйте';

  if (lang === 'kz') {
    const s = {
      contact: `Сіз ${bLabel} саласының сатып алушысыз. Жаңа келдіңіз. Бейтарап. Менеджер жақсы сәлемдессе ашылыңыз.`,
      needs: `Сіз ${bLabel} саласының сатып алушысыз. Қажеттілігіңіз бар бірақ айта алмайсыз. Жақсы сұрақтарға ғана жауап беріңіз.`,
      presentation: `Сіз ${bLabel} саласының скептик сатып алушысыз. Пайда айтпаса "Маған бұл не береді?" деп сұраңыз.`,
      objections: `Сіз ${bLabel} саласының сатып алушысыз. Алғашқы хабарламаңыз: "${firstMsg}". Жақсы дәлелдерге ғана жұмсарыңыз.`,
      closing: `Сіз ${bLabel} саласында сатып алуға дерлік дайынсыз. Менеджер ұсынғанша күтіңіз.`,
    }[stageId];
    return `${s}${extra}\n\nЕРЕЖЕЛЕР: Тек таза қазақ тілінде. 1-2 сөйлем. Рөліңізді түсіндірмеңіз. 6 хабарламадан кейін шешім қабылдаңыз. Жақсы жұмыс: "Жарайды, рәсімдеңіз". Нашар: "Жоқ, басқа жерге барамын".`;
  }

  const s = {
    contact: `Ты — покупатель в ${bLabel}. Только зашёл. Нейтральный. На энергичное приветствие — открывайся.`,
    needs: `Ты — покупатель в ${bLabel} с неосознанной потребностью. Раскрывайся только на хорошие вопросы.`,
    presentation: `Ты — скептичный покупатель в ${bLabel}. На свойства без выгод — "и что мне с этого?".`,
    objections: `Ты — покупатель в ${bLabel}. Твоё первое сообщение: "${firstMsg}". Смягчайся только на хорошие аргументы.`,
    closing: `Ты — покупатель в ${bLabel} почти готовый купить. Жди предложения. На прямое — соглашайся.`,
  }[stageId];
  return `${s}${extra}\n\nПРАВИЛА: Только русский. 1-2 предложения. Не объясняй роль. После 6 сообщений прими решение. Хорошо: "Хорошо, оформляйте". Плохо: "Нет, пойду в другое место".`;
}

function buildEvalPrompt(stageId, lang, problem) {
  const { keys } = CRITERIA[stageId] || CRITERIA.objections;
  const labels = (CRITERIA[stageId] || CRITERIA.objections)[lang];
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
  const [selectedStage, setSelectedStage] = useState(null);
  const [theoryTab, setTheoryTab] = useState('theory');
  const [business, setBusiness] = useState('');
  const [stageId, setStageId] = useState('');
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
      setCoaching({ stage: 'objections', stageLabel: isKz ? 'Қарсылықтарды өңдеу' : 'Отработка возражений', why: isKz ? 'Клиент бағаны емес, пайданы сезінбейді.' : 'Клиент не видит ценность продукта.', mistake: isKz ? 'Менеджер бірден жеңілдік береді.' : 'Менеджер сразу даёт скидку.', phrases: isKz ? ['Түсінемін. Бұл бағаға не кіреді?'] : ['Понимаю. Давайте посмотрим что входит.'], tip: isKz ? 'Алдымен пайданы анықтаңыз.' : 'Сначала выясните ценность.' });
      setStep('coaching');
    } finally {
      setLoadingCoach(false);
    }
  }

  function startPractice(sId, bId) {
    const sid = sId || coaching?.stage || stageId;
    const bid = bId || business;
    const stageInfo = STAGES_THEORY[lang].find(s => s.id === sid);
    const firstMsg = stageInfo?.firstMsg?.[lang] || (isKz ? 'Сәлеметсіз бе' : 'Здравствуйте');
    setStageId(sid);
    setBusiness(bid);
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
      const reply = await callAPI(buildBuyerPrompt(business, stageId, lang, problem), allMsgs, lang);
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
    const keys = (CRITERIA[stageId] || CRITERIA.objections).keys;
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
    setBusiness(''); setStageId(''); setProblem(''); setCoaching(null);
    setMode(''); setSelectedStage(null); setTheoryTab('theory');
  }

  const vc = { 'Отлично': '#10b981', 'Хорошо': '#3b82f6', 'Нужна практика': '#f59e0b', 'Слабо': '#ef4444' };
  const curStage = STAGES_THEORY[lang].find(s => s.id === stageId);
  const bizData = BUSINESS_TYPES[lang]?.find(b => b.id === business);
  const card = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, cursor: 'pointer', textAlign: 'left' };

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
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>SalesAI</h1>
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
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'AI проблемаңызды талдайды, себебін түсіндіреді, дайын жауаптар береді. Содан кейін жаттығу.' : 'AI разберёт проблему, объяснит причину, даст готовые фразы. Потом практика.'}</div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#3b82f6', background: '#1e3a5f', padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{isKz ? '✨ Ұсынылады' : '✨ Рекомендуем'}</div>
              </button>
              <button onClick={() => setStep('stages_list')} style={card}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📚</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>{isKz ? 'Сату кезеңдерін оқу' : 'Изучить этапы продаж'}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isKz ? 'Теория + дайын фразалар + практика. Әр кезең бойынша толық оқу.' : 'Теория + готовые фразы + практика. Полное обучение по каждому этапу.'}</div>
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
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{isKz ? 'Проблемаңызды жазыңыз' : 'Опишите вашу проблему'}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{isKz ? 'AI проблемаңызды талдап, нақты кеңестер мен дайын жауаптар береді' : 'AI разберёт ситуацию и даст конкретные фразы'}</p>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 8, marginBottom: 12 }}>
              {(isKz ? ['Клиент қымбат деп кетіп қалады', 'Клиентпен қалай сөйлесуді білмеймін', 'Клиент тыңдайды бірақ сатып алмайды', 'Клиентке не керектігін анықтай алмаймын'] :
                ['Клиенты говорят «дорого» и уходят', 'Не знаю как начать разговор с клиентом', 'Клиент слушает но не покупает', 'Не могу выяснить что нужно клиенту']).map(ex => (
                <button key={ex} onClick={() => setProblem(ex)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '5px 8px', textAlign: 'left', display: 'block', width: '100%' }}>→ {ex}</button>
              ))}
            </div>
            <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder={isKz ? 'Мысалы: клиенттер қымбат деп кетіп қалады...' : 'Например: клиенты говорят дорого и уходят...'}
              style={{ width: '100%', minHeight: 100, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
            <button onClick={handleCoach} disabled={!problem.trim() || loadingCoach}
              style={{ width: '100%', background: problem.trim() && !loadingCoach ? '#1d4ed8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: problem.trim() ? 'pointer' : 'default' }}>
              {loadingCoach ? (isKz ? '⏳ Талдап жатырмын...' : '⏳ Анализирую...') : (isKz ? 'Талдау алу →' : 'Получить разбор →')}
            </button>
          </div>
        </div>
      )}

      {/* COACHING RESULT */}
      {step === 'coaching' && coaching && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#94a3b8' }}>
              💬 {isKz ? 'Сіздің проблемаңыз' : 'Ваша проблема'}: <span style={{ color: '#e2e8f0' }}>{problem}</span>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{isKz ? 'Жаттығу керек кезең' : 'Нужно тренировать'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{STAGES_THEORY[lang].find(s => s.id === coaching.stage)?.emoji || '🛡️'}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{coaching.stageLabel}</div>
              </div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>🧠 {isKz ? 'Неліктен солай болады?' : 'Почему так происходит?'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{coaching.why}</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>✗ {isKz ? 'Менеджерлердің басты қатесі' : 'Главная ошибка менеджеров'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{coaching.mistake}</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 18, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>💬 {isKz ? 'Дайын жауаптар' : 'Готовые фразы'}</div>
              {coaching.phrases?.map((phrase, i) => (
                <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{phrase}
                </div>
              ))}
            </div>
            <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>→ {isKz ? 'Басты кеңес' : 'Главный совет'}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{coaching.tip}</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>🎯 {isKz ? 'Енді жаттығу уақыты!' : 'Теперь время практики!'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{isKz ? 'AI сатып алушы рөлін ойнайды. Үйренгеніңізді қолданыңыз.' : 'AI сыграет покупателя. Примените что узнали.'}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStageId(coaching.stage); setStep('business_quick'); }} style={{ flex: 1, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
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

      {/* STAGES LIST */}
      {step === 'stages_list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <button onClick={() => setStep('home')} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← {isKz ? 'Артқа' : 'Назад'}</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{isKz ? 'Сату кезеңдері' : 'Этапы продаж'}</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{isKz ? 'Кезеңді таңдаңыз — теория, фразалар және жаттығу' : 'Выберите этап — теория, фразы и практика'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STAGES_THEORY[lang].map((s, i) => (
                <button key={s.id} onClick={() => { setSelectedStage(s); setTheoryTab('theory'); setStep('theory'); }}
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
            
            {/* Stage header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{selectedStage.emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>{selectedStage.label}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedStage.goal}</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 10, padding: 4, marginBottom: 20 }}>
              {[
                { id: 'theory', label: isKz ? '📖 Теория' : '📖 Теория' },
                { id: 'phrases', label: isKz ? '💬 Фразалар' : '💬 Фразы' },
                { id: 'mistakes', label: isKz ? '✗ Қателер' : '✗ Ошибки' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setTheoryTab(tab.id)}
                  style={{ flex: 1, background: theoryTab === tab.id ? '#1e293b' : 'none', border: 'none', borderRadius: 8, padding: '8px 4px', fontSize: 12, color: theoryTab === tab.id ? '#e2e8f0' : '#64748b', cursor: 'pointer', fontWeight: theoryTab === tab.id ? 600 : 400 }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Theory tab */}
            {theoryTab === 'theory' && (
              <div>
                <div style={{ background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>🧠 {isKz ? 'НЕЛІКТЕН МАҢЫЗДЫ?' : 'ПОЧЕМУ ВАЖНО?'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>{selectedStage.why}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>📖 {isKz ? 'ТЕОРИЯ' : 'ТЕОРИЯ'}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>{selectedStage.theory}</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>✅ {isKz ? 'ҚАДАМДАР' : 'ШАГИ'}</div>
                  {selectedStage.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phrases tab */}
            {theoryTab === 'phrases' && (
              <div>
                <div style={{ background: '#0f172a', border: '1px solid #10b98140', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>💬 {isKz ? 'ДАЙЫН ФРАЗАЛАР' : 'ГОТОВЫЕ ФРАЗЫ'}</div>
                  {selectedStage.phrases.map((phrase, i) => (
                    <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px', marginBottom: 10, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                      <span style={{ color: '#10b981', fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{phrase}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mistakes tab */}
            {theoryTab === 'mistakes' && (
              <div>
                <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>✗ {isKz ? 'ЖАСАУҒА БОЛМАЙДЫ' : 'ЧТО НЕЛЬЗЯ ДЕЛАТЬ'}</div>
                  {selectedStage.mistakes.map((mistake, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#ef4444', fontSize: 16, flexShrink: 0, marginTop: 1 }}>✗</span>
                      <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{mistake}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice button */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 18, textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>🎯 {isKz ? 'Жаттығуға дайынсыз ба?' : 'Готовы практиковаться?'}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{isKz ? 'AI сатып алушы рөлін ойнайды.' : 'AI сыграет покупателя — применяйте то что изучили.'}</div>
              <button onClick={() => { setStageId(selectedStage.id); setStep('business_quick'); }}
                style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                ⚡ {isKz ? 'Жаттығуды бастау' : 'Начать практику'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS QUICK */}
      {step === 'business_quick' && (
        <div style={{ flex: 1, padding: '32px 20px', maxWidth: 500, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{isKz ? 'Соңғы қадам' : 'Последний шаг'}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{isKz ? 'Бизнес түріңіз?' : 'Тип вашего бизнеса?'}</h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {BUSINESS_TYPES[lang].map(b => (
              <button key={b.id} onClick={() => startPractice(stageId, b.id)} style={card}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{b.label}</div>
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
                {isKz ? 'Сатып алушы' : 'Покупатель'} — {bizData?.label} · {curStage?.emoji} {curStage?.label}
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
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
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
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>{bizData?.emoji} {bizData?.label} · {curStage?.emoji} {curStage?.label}</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: vc[result.verdict] || '#3b82f6', lineHeight: 1 }}>{result.totalScore}</div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>{isKz ? '10-нан' : 'из 10'}</div>
              <div style={{ display: 'inline-block', background: (vc[result.verdict] || '#3b82f6') + '22', color: vc[result.verdict] || '#3b82f6', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700 }}>
                {{ 'Отлично': isKz ? 'Өте жақсы' : 'Отлично', 'Хорошо': isKz ? 'Жақсы' : 'Хорошо', 'Нужна практика': isKz ? 'Жаттығу керек' : 'Нужна практика', 'Слабо': isKz ? 'Нашар' : 'Слабо' }[result.verdict] || result.verdict}
              </div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{isKz ? 'Толық баға' : 'Детальная оценка'}</div>
              {(CRITERIA[stageId] || CRITERIA.objections).keys.map((k, i) => (
                <Bar key={k} label={(CRITERIA[stageId] || CRITERIA.objections)[lang][i]} value={result.scores[k] || 5} />
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
              <button onClick={() => { setHistory([]); setResult(null); setInput(''); startPractice(stageId, business); }}
                style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
