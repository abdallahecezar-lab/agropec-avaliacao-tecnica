

// =========================
// V5 — CONVERSÃO E UX
// =========================

function atualizarCtaMobile_() {
  const cta = document.getElementById("mobileStickyStart");
  if (!cta) return;

  const intro = document.querySelector('[data-screen="intro"]');
  const introAtiva = intro && intro.classList.contains("active");

  cta.classList.toggle("visible", Boolean(introAtiva));
}

function anunciarTelaAtual_() {
  const live = document.getElementById("screenAnnouncement");
  const active = getActiveScreen();

  if (!live || !active) return;

  const title = active.querySelector("h1, h2, h3");
  live.textContent = title
    ? title.textContent.trim()
    : "Nova etapa do check-up";
}

function rolarParaTopoDoFormulario_() {
  const app = document.querySelector(".app, main, .container");
  const target = app || document.body;

  window.scrollTo({
    top: Math.max(target.getBoundingClientRect().top + window.scrollY - 12, 0),
    behavior: "smooth"
  });
}

function montarTextoDeAcaoResultado_(payload) {
  const el = document.getElementById("resultActionText");
  if (el) el.textContent = "Clique no botão abaixo para solicitar o Guia Técnico gratuitamente pelo WhatsApp.";
}

const mobileStickyStart = document.getElementById("mobileStickyStart");

if (mobileStickyStart) {
  mobileStickyStart.addEventListener("click", () => {
    const start = document.getElementById("startBtn");
    if (start) start.click();
  });
}


const TRACKING_CONFIG = {
  gtmId: "GTM-5T9LN9GZ",
  ga4Id: "G-1SERKV0FT1",
  metaPixelId: "879957080484866"
};

/*
      ETAPA DE INTEGRAÇÃO:
      Cole abaixo a URL do seu Google Apps Script publicado como Web App.
      Exemplo:

    */

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwiEcWjN8QdSdP3hGtb0d7XiR3DK5uDDbnZ8Npijeri6KU2yypqn-7t07jL5EWImxt3/exec";

    // Número central da Agropec Brasil: +55 62 92000-6286
    const WHATSAPP_CENTRAL = "5562920006286";
    let lastSubmittedPayload = null;


    const STORAGE_KEY = "agropec_avaliacao_progresso_v1";
    const SESSION_KEY = "agropec_avaliacao_session_id";
    const MIN_SUBMIT_SECONDS = 8;

    let assessmentStartedAt = null;
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    window.dataLayer = window.dataLayer || [];

    function pushTrackingEvent(eventName, details = {}) {
      window.dataLayer.push({
        event: eventName,
        assessment_session_id: sessionId,
        ...details
      });
    }

    
function sendGa4Event(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

function sendMetaEvent(eventName, params = {}, custom = false) {
  if (typeof window.fbq === "function") {
    window.fbq(custom ? "trackCustom" : "track", eventName, params);
  }
}

function trackMarketingEvent(eventName, details = {}) {
  pushTrackingEvent(eventName, details);

  const ga4Map = {
    ebook_offer_view: "view_ebook_offer",
    ebook_form_start: "begin_ebook_form",
    ebook_lead: "generate_ebook_lead",
    assessment_page_view: "page_view",
    start_assessment: "begin_checkup",
    assessment_step: "checkup_progress",
    complete_assessment: "complete_checkup",
    generate_lead: "generate_lead",
    whatsapp_click: "whatsapp_click",
    high_score_lead: "high_score_lead"
  };

  const metaMap = {
    ebook_offer_view: ["EbookOfferView", true],
    ebook_form_start: ["BeginEbookForm", true],
    ebook_lead: ["EbookLead", true],
    assessment_page_view: ["ViewContent", false],
    start_assessment: ["BeginCheckup", true],
    complete_assessment: ["CompleteRegistration", false],
    generate_lead: ["Lead", false],
    whatsapp_click: ["Contact", false],
    high_score_lead: ["HighScoreLead", true]
  };

  if (ga4Map[eventName]) sendGa4Event(ga4Map[eventName], details);

  if (metaMap[eventName]) {
    sendMetaEvent(metaMap[eventName][0], details, metaMap[eventName][1]);
  }
}

function saveProgress() {
      try {
        const active = getActiveScreen();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          answers,
          activeQuestion: active?.dataset?.question || "",
          activeScreen: active?.dataset?.screen || "",
          savedAt: Date.now()
        }));
      } catch (error) {
        console.warn("Não foi possível salvar o progresso.", error);
      }
    }

    function loadSavedProgress() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        if (!saved || !saved.savedAt) return null;

        const maxAge = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - saved.savedAt > maxAge) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return saved;
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }

    function restoreProgress(saved) {
      Object.assign(answers, saved.answers || {});

      questionScreens.forEach(screen => {
        const value = answers[screen.dataset.question];
        if (!value) return;
        screen.querySelectorAll(".option").forEach(option => {
          option.classList.toggle("selected", option.dataset.value === value);
        });
      });

      let target = null;
      if (saved.activeQuestion) {
        target = document.querySelector(`[data-question="${saved.activeQuestion}"]`);
      }
      if (!target && saved.activeScreen) {
        target = document.querySelector(`[data-screen="${saved.activeScreen}"]`);
      }
      if (!target || ["result", "loading"].includes(saved.activeScreen)) {
        target = questionScreens[0];
      }

      assessmentStartedAt = Date.now();
      pushTrackingEvent("assessment_resume", {
        resumed_question: saved.activeQuestion || "",
        resumed_screen: saved.activeScreen || ""
      });
      showScreen(target);
    }

    function clearProgress() {
      localStorage.removeItem(STORAGE_KEY);
    }

    const screens = Array.from(document.querySelectorAll(".screen"));
    const questionScreens = Array.from(document.querySelectorAll("[data-question]"));
    const progressBar = document.getElementById("progressBar");

    const answers = {};

    trackMarketingEvent("ebook_offer_view", {
      offer_name: "guia_sal_proteinado",
    });
    trackMarketingEvent("assessment_page_view", {
      page_type: "assessment_landing",
      assessment_name: "ebook_sal_proteinado"
    });
    let currentScreenIndex = 0;

    function showScreen(target) {
  window.setTimeout(() => {
    atualizarCtaMobile_();
    anunciarTelaAtual_();
    rolarParaTopoDoFormulario_();
  }, 20);

      screens.forEach(screen => screen.classList.remove("active"));
      target.classList.add("active");
      currentScreenIndex = screens.indexOf(target);
      updateProgress(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function updateProgress(screen) {
      if (screen.dataset.screen === "intro") {
        progressBar.style.width = "0%";
        return;
      }

      if (screen.dataset.screen === "result") {
        progressBar.style.width = "100%";
        return;
      }

      const questionIndex = questionScreens.indexOf(screen);
      if (questionIndex >= 0) {
        const percentage = ((questionIndex + 1) / (questionScreens.length + 1)) * 100;
        progressBar.style.width = `${percentage}%`;
        return;
      }

      if (screen.dataset.screen === "contact") {
        progressBar.style.width = "92%";
      }
    }

    function getActiveScreen() {
      return document.querySelector(".screen.active");
    }

    function getNextQuestionScreen(current) {
      const index = questionScreens.indexOf(current);
      if (index === questionScreens.length - 1) {
        return document.querySelector('[data-screen="contact"]');
      }
      return questionScreens[index + 1];
    }

    function getPreviousScreen(current) {
      if (current.dataset.screen === "contact") {
        return questionScreens[questionScreens.length - 1];
      }

      const index = questionScreens.indexOf(current);
      if (index <= 0) {
        return document.querySelector('[data-screen="intro"]');
      }
      return questionScreens[index - 1];
    }

    document.getElementById("startBtn").addEventListener("click", () => {
      assessmentStartedAt = Date.now();
      trackMarketingEvent("ebook_form_start", { offer_name: "guia_sal_proteinado" });
      trackMarketingEvent("start_assessment", {
        assessment_name: "ebook_sal_proteinado"
      });
      showScreen(questionScreens[0]);
      saveProgress();
    });

    document.querySelectorAll(".option").forEach(button => {
      button.addEventListener("click", () => {
        const screen = button.closest("[data-question]");
        screen.querySelectorAll(".option").forEach(opt => opt.classList.remove("selected"));
        button.classList.add("selected");
        answers[screen.dataset.question] = button.dataset.value;
        screen.querySelector(".error").textContent = "";

        pushTrackingEvent("assessment_answer", {
          question_key: screen.dataset.question,
          answer_value: button.dataset.value,
          question_number: questionScreens.indexOf(screen) + 1
        });

        saveProgress();
      });
    });

    document.querySelectorAll(".nextBtn").forEach(button => {
      button.addEventListener("click", () => {
        const screen = button.closest("[data-question]");
        const key = screen.dataset.question;

        if (!answers[key]) {
          screen.querySelector(".error").textContent = "Selecione uma opção para continuar.";
          return;
        }

        if (key === "cria_bovinos" && answers[key] === "Não") {
          showScreen(document.querySelector('[data-screen="disqualified"]'));
          return;
        }

        trackMarketingEvent("assessment_step", {
          completed_question: key,
          completed_question_number: questionScreens.indexOf(screen) + 1
        });

        const progressValue = Math.round(
          ((questionScreens.indexOf(screen) + 1) / questionScreens.length) * 100
        );

        [25, 50, 75].forEach(mark => {
          if (
            progressValue >= mark &&
            !sessionStorage.getItem(`checkup_progress_${mark}`)
          ) {
            sessionStorage.setItem(`checkup_progress_${mark}`, "1");
            pushTrackingEvent(`progress_${mark}`, {
              progress_percent: mark,
              assessment_name: "ebook_sal_proteinado"
            });
            sendGa4Event(`progress_${mark}`, {
              progress_percent: mark
            });
            sendMetaEvent(`Progress${mark}`, {
              progress_percent: mark
            }, true);
          }
        });

        showScreen(getNextQuestionScreen(screen));
        saveProgress();
      });
    });

    document.querySelectorAll(".backBtn").forEach(button => {
      button.addEventListener("click", () => {
        const current = getActiveScreen();
        showScreen(getPreviousScreen(current));
        saveProgress();
      });
    });


    const resumeBtn = document.getElementById("resumeBtn");
    const savedProgress = loadSavedProgress();

    if (savedProgress && resumeBtn) {
      resumeBtn.classList.remove("hidden");
      resumeBtn.addEventListener("click", () => restoreProgress(savedProgress));
    }

    function normalizePhone(value) {
      return value.replace(/\D/g, "");
    }

    function calculateScoreDetails() {
      const herdScores = {"Até 30":8,"31 a 100":18,"101 a 300":28,"301 a 800":35,"Mais de 800":40};
      const objectiveScores = {"Ganho de peso":20,"Carrapatos":16,"Vermes":16,"Saúde geral":14,"Todos":20};
      const productScores = {"Produtos de cocho":12,"Produtos injetáveis":15,"Produtos para passar no gado":12,"Todas as opções":20,"Nenhuma opção":5};
      const breakdown = {
        potencial_financeiro: herdScores[answers.quantidade_animais] || 0,
        objetivo: objectiveScores[answers.principal_dor] || 0,
        maturidade_manejo: productScores[answers.produtos_utilizados] || 0,
        conclusao: 20
      };
      const total = Math.min(Object.values(breakdown).reduce((a,b)=>a+b,0),100);
      return { total, breakdown };
    }

    function classifyLead(score) {
      if (score >= 75) return "🔥 Lead muito quente";
      if (score >= 55) return "🟠 Lead quente";
      if (score >= 35) return "🟡 Lead morno";
      return "🔵 Lead em pesquisa";
    }

    function getCommercialRecommendation() {
      const pain = answers.principal_dor;
      const purpose = answers.finalidade;

      const recommendations = {
        "Ganho de peso": {
          linha: "Promotores de desempenho e suporte ao ganho de peso",
          produtos: ["Hausther", "Aminomaxx", "Engordox", "Rumengor"],
          abordagem: "Explorar o objetivo de ganho de peso, o tempo do desafio e o manejo atual. Priorizar uma solução combinada de desempenho e suporte nutricional."
        },
        "Carrapatos": {
          linha: "Controle de carrapatos e ectoparasitas",
          produtos: ["Titanium Ox", "Iveron", "Oxydectin", "Adectin Trio"],
          abordagem: "Entender intensidade da infestação, frequência de aplicação, produtos já utilizados e possibilidade de resistência."
        },
        "Vermes": {
          linha: "Controle de vermes e endoparasitas",
          produtos: ["Defender", "Oxydectin", "Taurus", "Combat Plus"],
          abordagem: "Investigar histórico de vermifugação, intervalo entre aplicações, categoria dos animais e resposta aos produtos anteriores."
        },
        "Saúde geral": {
          linha: "Suporte nutricional, vitamínico e mineral",
          produtos: ["Aminomaxx", "Rumengor", "Multforth"],
          abordagem: "Explorar condição corporal, desempenho geral, recuperação dos animais e rotina de suplementação."
        },
        "Todos": {
          linha: "Estratégia combinada de desempenho e controle parasitário",
          produtos: ["Aminomaxx", "Rumengor", "Defender", "Oxydectin", "Titanium Ox"],
          abordagem: "Priorizar uma conversa consultiva, identificando qual problema causa maior impacto e montar uma solução por etapas."
        }
      };

      if (purpose === "Gado leiteiro") {
        return {
          linha: "Linha compatível com bovinos leiteiros",
          produtos: ["Iverleite"],
          abordagem: "Confirmar fase produtiva, manejo atual e necessidade de controle parasitário compatível com a atividade leiteira."
        };
      }

      return recommendations[pain] || {
        linha: "Suporte à saúde e ao desempenho do rebanho",
        produtos: ["Aminomaxx", "Rumengor", "Multforth"],
        abordagem: "Entender o histórico do manejo e identificar o principal fator limitante antes de indicar uma solução."
      };
    }

    function getClientDiagnostic() {
      return {
        attention: `Principal interesse informado: ${answers.principal_dor}.`,
        recommendation: "O Guia Técnico será disponibilizado pelo WhatsApp.",
        durationNote: `Manejo atual: ${answers.produtos_utilizados}.`
      };
    }

    function buildWhatsAppMessage(data) {
      const message = [
        "[EBOOK_SAL_PROTEINADO]",
        "Olá! Concluí o cadastro e quero receber gratuitamente o Guia Técnico de Sal Proteinado.",
        "",
        `*Nome:* ${data.nome}`,
        `*Cidade/UF:* ${data.cidade} - ${data.estado}`,
        `*Rebanho:* ${answers.quantidade_animais} bovinos`,
        `*Atividade:* ${answers.finalidade}`,
        `*Objetivo:* ${answers.principal_dor}`,
        `*Produtos usados:* ${answers.produtos_utilizados}`
      ].join("\n");
      return `https://wa.me/${WHATSAPP_CENTRAL}?text=${encodeURIComponent(message)}`;
    }

    function buildInternalCommercialSummary(data) {
      return [
        "LEAD — EBOOK SAL PROTEINADO",
        "",
        `Nome: ${data.nome}`,
        `WhatsApp: ${data.whatsapp}`,
        `Cidade/UF: ${data.cidade} - ${data.estado}`,
        `Rebanho: ${answers.quantidade_animais}`,
        `Atividade: ${answers.finalidade}`,
        `Objetivo: ${answers.principal_dor}`,
        `Produtos utilizados: ${answers.produtos_utilizados}`,
        `Score: ${data.score}/100`,
        `Classificação: ${data.classificacao}`,
        `Produtos sugeridos: ${data.produtos_recomendados}`
      ].join("\n");
    }

    function executarAnimacaoAnalise_() {
      const passos = Array.from(
        document.querySelectorAll("[data-analysis-step]")
      );

      passos.forEach(item => {
        item.classList.remove("active", "done");
        item.querySelector(".step-icon").textContent =
          item.dataset.analysisStep;
      });

      passos.forEach((item, index) => {
        window.setTimeout(() => {
          if (index > 0) {
            const anterior = passos[index - 1];
            anterior.classList.remove("active");
            anterior.classList.add("done");
            anterior.querySelector(".step-icon").textContent = "✓";
          }
          item.classList.add("active");
        }, index * 650);
      });

      window.setTimeout(() => {
        const ultimo = passos[passos.length - 1];
        ultimo.classList.remove("active");
        ultimo.classList.add("done");
        ultimo.querySelector(".step-icon").textContent = "✓";
      }, passos.length * 650);
    }


    function montarCardsDiagnostico_(data) {
      const grid = document.getElementById("diagnosticGrid");
      if (!grid) return;

      const cards = [
        {
          titulo: "🐂 Perfil do rebanho",
          texto: `${answers.quantidade_animais || "Não informado"} — ${answers.finalidade || "Atividade não informada"}`
        },
        {
          titulo: "🎯 Foco principal",
          texto: answers.principal_dor || "Não informado"
        },
        {
          titulo: "📦 Manejo atual",
          texto: answers.produtos_utilizados || "Não informado"
        },
        {
          titulo: "💡 Linha de atenção",
          texto: data.linha_recomendada || "Avaliação complementar recomendada"
        }
      ];

      grid.innerHTML = cards.map(card => `
        <div class="diagnostic-card">
          <strong>${escapeHtml(card.titulo)}</strong>
          <span>${escapeHtml(card.texto)}</span>
        </div>
      `).join("");
    }

    function renderResult(data) {
      document.getElementById("resultSummary").textContent =
        "Seu cadastro foi concluído. O Guia Técnico de Sal Proteinado já pode ser solicitado pelo WhatsApp.";
      document.getElementById("resultList").innerHTML = `
        <div><strong>📘 Material:</strong> Guia Técnico 001 — Sal Proteinado para Bovinos</div>
        <div><strong>🐄 Seu rebanho:</strong> ${answers.quantidade_animais} — ${answers.finalidade}</div>
        <div><strong>🎯 Principal objetivo:</strong> ${answers.principal_dor}</div>
        <div><strong>📦 Manejo informado:</strong> ${answers.produtos_utilizados}</div>
      `;
      montarCardsDiagnostico_(data);
      updateWhatsAppButton(data);
    }

    async function sendToGoogleSheets(payload) {
      if (!GOOGLE_SCRIPT_URL) {
        throw new Error("A URL do Google Apps Script não foi configurada.");
      }

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload),
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Falha de comunicação com a planilha. Código ${response.status}.`);
      }

      let result = null;

      try {
        result = await response.json();
      } catch (error) {
        throw new Error("O Apps Script respondeu em um formato inválido.");
      }

      if (result && result.sucesso === false) {
        throw new Error(result.mensagem || "O Apps Script não conseguiu registrar a avaliação.");
      }

      return result || { sucesso: true };
    }

    document.getElementById("submitBtn").addEventListener("click", async () => {
      const submitButton = document.getElementById("submitBtn");

      if (submitButton.disabled) {
        return;
      }

      const nome = document.getElementById("nome").value.trim();
      const whatsapp = normalizePhone(document.getElementById("whatsapp").value);
      const cidade = document.getElementById("cidade").value.trim();
      const estado = document.getElementById("estado").value;
      const consentimento = document.getElementById("consentimento").checked;
      const websiteField = document.getElementById("websiteField").value.trim();
      const error = document.getElementById("contactError");

      if (websiteField) {
        error.textContent = "Não foi possível validar o envio.";
        return;
      }

      if (!assessmentStartedAt) assessmentStartedAt = Date.now();
      const elapsedSeconds = Math.floor((Date.now() - assessmentStartedAt) / 1000);

      if (elapsedSeconds < MIN_SUBMIT_SECONDS) {
        error.textContent = "Revise suas respostas antes de concluir a avaliação.";
        return;
      }

      if (!nome || whatsapp.length < 10 || !cidade || !estado || !consentimento) {
        error.textContent = "Preencha todos os campos e autorize o contato para continuar.";
        return;
      }

      error.textContent = "";

      const scoreDetails = calculateScoreDetails();
      const score = scoreDetails.total;
      const classificacao = classifyLead(score);
      const recommendation = getCommercialRecommendation();
      const linha_recomendada = recommendation.linha;
      const produtos_recomendados = recommendation.produtos.join(", ");
      const abordagem_sugerida = recommendation.abordagem;

      const params = new URLSearchParams(window.location.search);

      const payload = {
        data_hora: new Date().toISOString(),
        nome,
        whatsapp,
        cidade,
        estado,
        consentimento: "Sim",
        ...answers,
        score,
        classificacao,
        score_potencial_financeiro: scoreDetails.breakdown.potencial_financeiro,
        score_objetivo: scoreDetails.breakdown.objetivo,
        score_conclusao: scoreDetails.breakdown.conclusao,
        score_maturidade_manejo: scoreDetails.breakdown.maturidade_manejo,
        
        linha_recomendada,
        produtos_recomendados,
        abordagem_sugerida,
        origem_lead: "Ebook Sal Proteinado",
        prioridade_contato:
          classificacao.includes("muito quente") ? "Contato imediato" :
          classificacao.includes("quente") ? "Contato no mesmo dia" :
          classificacao.includes("morno") ? "Acompanhamento prioritário" :
          "Nutrição e follow-up",
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
        utm_content: params.get("utm_content") || "",
        pagina: window.location.href,
        assessment_session_id: sessionId,
        tempo_preenchimento_segundos: elapsedSeconds,
        user_agent: navigator.userAgent
      };

      payload.resumo_interno = buildInternalCommercialSummary(payload);
      lastSubmittedPayload = payload;
      submitButton.disabled = true;
      submitButton.textContent = "ENVIANDO...";
      showScreen(document.querySelector('[data-screen="loading"]'));

      try {
        await sendToGoogleSheets(payload);

        setTimeout(() => {
          renderResult(payload);
          showScreen(document.querySelector('[data-screen="result"]'));
          submitButton.textContent = "EBOOK LIBERADO";

          trackMarketingEvent("complete_assessment", {
            assessment_name: "ebook_sal_proteinado",
            lead_score: payload.score,
            lead_classification: payload.classificacao,
            herd_size: answers.quantidade_animais,
            production_type: answers.finalidade,
            main_goal: answers.principal_dor,
            products_used: answers.produtos_utilizados
          });

          trackMarketingEvent("ebook_lead", { offer_name: "guia_sal_proteinado", lead_score: payload.score });
          trackMarketingEvent("generate_lead", {
            lead_source: "ebook_sal_proteinado",
            lead_score: payload.score,
            lead_classification: payload.classificacao
          });

          if (Number(payload.score) >= 80) {
            trackMarketingEvent("high_score_lead", {
              lead_score: payload.score,
              lead_classification: payload.classificacao,
              herd_size: answers.quantidade_animais,
              main_goal: answers.principal_dor,
              products_used: answers.produtos_utilizados
            });
          }

          clearProgress();
        }, 1200);
      } catch (err) {
        console.error(err);
        alert(err.message || "Ocorreu um erro ao registrar sua avaliação. Tente novamente.");
        submitButton.disabled = false;
        submitButton.textContent = "RECEBER MEU EBOOK GRÁTIS";
        showScreen(document.querySelector('[data-screen="contact"]'));
      }
    });


    document.getElementById("whatsappSpecialistBtn").addEventListener("click", () => {
      trackMarketingEvent("whatsapp_click", {
        contact_destination: WHATSAPP_CENTRAL,
        lead_score: lastSubmittedPayload?.score || 0,
        lead_classification: lastSubmittedPayload?.classificacao || "",
        main_goal: answers.principal_dor || ""
      });
    });

    document.getElementById("whatsapp").addEventListener("input", (event) => {
      let value = event.target.value.replace(/\D/g, "").slice(0, 11);

      if (value.length > 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      } else if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      } else if (value.length > 0) {
        value = value.replace(/(\d{0,2})/, "($1");
      }

      event.target.value = value;
    });


document.addEventListener("keydown", event => {
  if (event.key !== "Enter") return;

  const active = getActiveScreen();
  if (!active) return;

  const focused = document.activeElement;

  if (focused && focused.classList.contains("option")) {
    focused.click();
    return;
  }

  if (
    focused &&
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(focused.tagName)
  ) {
    return;
  }

  const next = active.querySelector(".next-btn, [data-next]");
  if (next && !next.disabled) next.click();
});

document.querySelectorAll(".option").forEach(option => {
  if (!option.hasAttribute("tabindex")) option.setAttribute("tabindex", "0");
  option.setAttribute("role", "button");
});

window.addEventListener("load", () => {
  atualizarCtaMobile_();
  anunciarTelaAtual_();
});
