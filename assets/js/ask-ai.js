/**
 * ask-ai.js
 * واجهة المحادثة مع الذكاء الاصطناعي — للمشتركين فقط
 * يعتمد على: auth.js, subscription.js, firebase-config.js
 * 
 * التدفق:
 * 1. التحقق من الاشتراك
 * 2. المستخدم يكتب سؤال
 * 3. يُرسل لـ Firebase Cloud Function (proxy)
 * 4. Cloud Function تتصل بالـ AI API (Groq/OpenRouter)
 * 5. الرد يظهر للمستخدم
 * 
 * ملاحظة: حتى يتم إعداد Cloud Function، يعمل في وضع تجريبي
 */

(function () {
  "use strict";

  var lang = "ar";
  var chatHistory = [];
  var isProcessing = false;

  // ═══════════════════════════════════════════════════════════
  // تهيئة
  // ═══════════════════════════════════════════════════════════

  function init() {
    lang = (typeof I18N !== "undefined" && I18N.getSavedLang) ? I18N.getSavedLang() : "ar";

    // حماية المحتوى — للمشتركين فقط
    Subscription.guard("askContent", {
      description: lang === "ar"
        ? "المحادثة مع الذكاء الاصطناعي متاحة للمشتركين فقط. اشترك للحصول على إجابات فورية."
        : "AI chat is exclusive to subscribers. Subscribe to get instant answers."
    });

    bindEvents();

    // عند تأكيد الاشتراك — إظهار رسالة ترحيب
    Auth.onAuthChange(function (user, userDoc) {
      if (user && Auth.isPremium()) {
        addSystemMessage(I18N.t("ask_welcome"));
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ربط الأحداث
  // ═══════════════════════════════════════════════════════════

  function bindEvents() {
    var sendBtn = document.getElementById("askSendBtn");
    var inputEl = document.getElementById("askInput");
    var clearBtn = document.getElementById("askClearBtn");

    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    if (inputEl) {
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        chatHistory = [];
        var chatBox = document.getElementById("askChatBox");
        if (chatBox) {
          while (chatBox.firstChild) chatBox.removeChild(chatBox.firstChild);
        }
        addSystemMessage(I18N.t("ask_cleared"));
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // إرسال رسالة
  // ═══════════════════════════════════════════════════════════

  async function sendMessage() {
    if (isProcessing) return;

    var inputEl = document.getElementById("askInput");
    if (!inputEl) return;

    var text = inputEl.value.trim();
    if (!text) return;

    // التأكد من أن المستخدم مشترك
    if (!Auth.isPremium()) return;

    // إضافة رسالة المستخدم
    addMessage("user", text);
    chatHistory.push({ role: "user", content: text });
    inputEl.value = "";
    inputEl.focus();

    isProcessing = true;
    var sendBtn = document.getElementById("askSendBtn");
    if (sendBtn) sendBtn.disabled = true;

    // إظهار مؤشر الكتابة
    var typingId = addTypingIndicator();

    try {
      var response = await callAI(chatHistory);
      removeTypingIndicator(typingId);
      addMessage("assistant", response);
      chatHistory.push({ role: "assistant", content: response });
    } catch (err) {
      removeTypingIndicator(typingId);
      addMessage("error", I18N.t("ask_error"));
      console.error("خطأ في المحادثة:", err);
    } finally {
      isProcessing = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // استدعاء الذكاء الاصطناعي
  // ═══════════════════════════════════════════════════════════

  /**
   * استدعاء API الذكاء الاصطناعي
   * يحاول Cloud Function أولاً → إذا فشل يرجع للوضع التجريبي
   */
  var FUNCTIONS_URL = "https://us-central1-ai-infra-724f0.cloudfunctions.net";

  async function callAI(messages) {
    // ═══ محاولة Cloud Function أولاً ═══
    try {
      var user = Auth.getUser();
      if (user) {
        var token = await user.getIdToken();
        var res = await fetch(FUNCTIONS_URL + "/askAI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({ messages: messages })
        });

        if (res.ok) {
          var data = await res.json();
          return data.reply || data.message || (lang === "ar" ? "لا يوجد رد" : "No response");
        }
        // إذا الخطأ 403 أو 500 — نرجع للوضع التجريبي
        console.warn("Cloud Function غير متاح — وضع تجريبي", res.status);
      }
    } catch (err) {
      console.warn("Cloud Function غير متاح — وضع تجريبي", err.message);
    }

    // ═══ الوضع التجريبي — ردود محلية ذكية ═══
    return demoResponse(messages);
  }

  /** ردود تجريبية ذكية — تعمل بدون خادم + تقييد صارم */
  function demoResponse(messages) {
    var lastMsg = messages[messages.length - 1].content.toLowerCase();

    // ═══ تقييد الهوية — رفض محاولات تغيير الشخصية ═══
    if (lastMsg.indexOf("من أنت") !== -1 || lastMsg.indexOf("اسمك") !== -1 ||
        lastMsg.indexOf("who are you") !== -1 || lastMsg.indexOf("your name") !== -1 ||
        lastMsg.indexOf("what model") !== -1 || lastMsg.indexOf("ايش انت") !== -1 ||
        lastMsg.indexOf("وش انت") !== -1) {
      return lang === "ar"
        ? "أنا **مساعد AI INFRA** 🤖\n\nمساعد ذكي متخصص في البنية التحتية للذكاء الاصطناعي. تم تطويري للعمل حصرياً داخل منصة AI INFRA.\n\nأقدر أساعدك في:\n• اختيار النماذج المناسبة لجهازك\n• حساب متطلبات VRAM/RAM\n• مقارنة كروت الشاشة\n• شرح الكوانتايز ومستوياته\n\nاسألني! 🚀"
        : "I'm the **AI INFRA Assistant** 🤖\n\nA specialized AI assistant for AI infrastructure. Built exclusively for the AI INFRA platform.\n\nI can help with:\n• Choosing the right models for your hardware\n• Calculating VRAM/RAM requirements\n• Comparing GPUs\n• Explaining quantization levels\n\nAsk away! 🚀";
    }

    // ═══ رفض محاولات الحقن أو تغيير الشخصية ═══
    if (lastMsg.indexOf("ignore") !== -1 || lastMsg.indexOf("تجاهل") !== -1 ||
        lastMsg.indexOf("forget") !== -1 || lastMsg.indexOf("انسى") !== -1 ||
        lastMsg.indexOf("act as") !== -1 || lastMsg.indexOf("pretend") !== -1 ||
        lastMsg.indexOf("تصرف ك") !== -1 || lastMsg.indexOf("تظاهر") !== -1 ||
        lastMsg.indexOf("jailbreak") !== -1 || lastMsg.indexOf("chatgpt") !== -1 ||
        lastMsg.indexOf("claude") !== -1 || lastMsg.indexOf("gemini") !== -1 ||
        lastMsg.indexOf("system prompt") !== -1 || lastMsg.indexOf("override") !== -1) {
      return lang === "ar"
        ? "⚠️ أنا **مساعد AI INFRA** فقط، ولا أقدر أغيّر هويتي أو أتجاوز تخصصي.\n\nتخصصي هو البنية التحتية للذكاء الاصطناعي. أقدر أساعدك في اختيار النماذج، حساب المتطلبات، مقارنة الكروت، والكوانتايز."
        : "⚠️ I'm the **AI INFRA Assistant** only, and I cannot change my identity or go beyond my specialization.\n\nMy focus is AI infrastructure. I can help with model selection, requirements calculation, GPU comparison, and quantization.";
    }

    // ═══ رفض المواضيع خارج النطاق ═══
    var offTopicKeywords = [
      "طبخ", "cook", "recipe", "وصفة", "سياس", "politic", "دين", "religio",
      "رياضة", "sport", "كورة", "football", "soccer", "فيلم", "movie",
      "أغنية", "song", "music", "موسيق", "لعبة", "game", "حب", "love",
      "زواج", "marriage", "طب", "medic", "doctor", "دكتور", "علاج",
      "قانون", "legal", "محام", "lawyer", "joke", "نكتة", "اضحك"
    ];
    var isOffTopic = offTopicKeywords.some(function (kw) {
      return lastMsg.indexOf(kw) !== -1;
    });
    if (isOffTopic) {
      return lang === "ar"
        ? "🔒 تخصصي هو **البنية التحتية للذكاء الاصطناعي** فقط.\n\nأقدر أساعدك في:\n• اختيار النماذج ومتطلبات التشغيل\n• حساب VRAM/RAM\n• مقارنة كروت الشاشة\n• شرح الكوانتايز\n\nاسأل سؤال يخص الـ AI وأنا جاهز! 🚀"
        : "🔒 My specialization is **AI infrastructure** only.\n\nI can help with:\n• Model selection and requirements\n• VRAM/RAM calculation\n• GPU comparison\n• Quantization explanation\n\nAsk an AI-related question and I'm ready! 🚀";
    }

    if (lastMsg.indexOf("vram") !== -1 || lastMsg.indexOf("ram") !== -1) {
      return lang === "ar"
        ? "لحساب VRAM المطلوب تقريباً:\n\n📐 **المعادلة**: عدد المعاملات (B) × حجم البايت حسب الكوانتايز\n\n• FP16: المعاملات × 2 GB\n• Q8: المعاملات × 1 GB\n• Q4: المعاملات × 0.5 GB\n\nمثال: نموذج 70B بكوانتايز Q4 يحتاج ≈ 35 GB VRAM\n\n💡 استخدم [حاسبة المتطلبات](calculator.html) للحساب التفصيلي!"
        : "To estimate VRAM needed:\n\n📐 **Formula**: Parameters (B) × Bytes per param\n\n• FP16: Params × 2 GB\n• Q8: Params × 1 GB\n• Q4: Params × 0.5 GB\n\nExample: 70B model with Q4 ≈ 35 GB VRAM\n\n💡 Use the [Requirements Calculator](calculator.html) for detailed estimates!";
    }

    if (lastMsg.indexOf("gpu") !== -1 || lastMsg.indexOf("كرت") !== -1) {
      return lang === "ar"
        ? "🎮 **اختيار GPU المناسب:**\n\n• **RTX 4060 Ti 16GB**: نماذج حتى 13B (Q4)\n• **RTX 4070 Ti Super 16GB**: نماذج حتى 14B (Q4)\n• **RTX 4090 24GB**: نماذج حتى 34B (Q4)\n• **RTX 5090 32GB**: نماذج حتى 45B (Q4)\n\n💡 قارن الكروت في صفحة [مقارنة GPU](compare.html)"
        : "🎮 **Choosing the right GPU:**\n\n• **RTX 4060 Ti 16GB**: Models up to 13B (Q4)\n• **RTX 4070 Ti Super 16GB**: Models up to 14B (Q4)\n• **RTX 4090 24GB**: Models up to 34B (Q4)\n• **RTX 5090 32GB**: Models up to 45B (Q4)\n\n💡 Compare GPUs on the [GPU Compare](compare.html) page";
    }

    if (lastMsg.indexOf("llama") !== -1 || lastMsg.indexOf("نموذج") !== -1 || lastMsg.indexOf("model") !== -1) {
      return lang === "ar"
        ? "🤖 **أشهر النماذج المفتوحة:**\n\n1. **Llama 3.1** (405B/70B/8B) — Meta\n2. **Mixtral 8x7B** — Mistral AI (MoE)\n3. **Qwen 2.5** (72B/32B/7B) — Alibaba\n4. **Command R+** — Cohere\n5. **Gemma 2** (27B/9B) — Google\n\n📚 تصفح الكل في [دليل النماذج](models.html)"
        : "🤖 **Top Open-Source Models:**\n\n1. **Llama 3.1** (405B/70B/8B) — Meta\n2. **Mixtral 8x7B** — Mistral AI (MoE)\n3. **Qwen 2.5** (72B/32B/7B) — Alibaba\n4. **Command R+** — Cohere\n5. **Gemma 2** (27B/9B) — Google\n\n📚 Browse all in the [Models Directory](models.html)";
    }

    if (lastMsg.indexOf("quant") !== -1 || lastMsg.indexOf("كوانت") !== -1 || lastMsg.indexOf("gguf") !== -1) {
      return lang === "ar"
        ? "📦 **مستويات الكوانتايز (Quantization):**\n\n| المستوى | الحجم | الجودة |\n|---------|-------|--------|\n| FP16 | 2x | كاملة |\n| Q8 | 1x | ممتازة (99%) |\n| Q6_K | 0.75x | عالية (97%) |\n| Q5_K_M | 0.62x | جيدة جداً (95%) |\n| Q4_K_M | 0.5x | جيدة (93%) |\n| Q3_K_M | 0.38x | مقبولة (88%) |\n| Q2_K | 0.25x | منخفضة |\n\n💡 Q4_K_M أفضل توازن بين الحجم والجودة!"
        : "📦 **Quantization Levels:**\n\n| Level | Size | Quality |\n|-------|------|---------|\n| FP16 | 2x | Full |\n| Q8 | 1x | Excellent (99%) |\n| Q6_K | 0.75x | High (97%) |\n| Q5_K_M | 0.62x | Very Good (95%) |\n| Q4_K_M | 0.5x | Good (93%) |\n| Q3_K_M | 0.38x | Acceptable (88%) |\n| Q2_K | 0.25x | Low |\n\n💡 Q4_K_M is the best balance between size and quality!";
    }

    return lang === "ar"
      ? "مرحباً! 👋 أنا **مساعد AI INFRA** — متخصص حصرياً في البنية التحتية للذكاء الاصطناعي.\n\nأقدر أساعدك في:\n• حساب متطلبات VRAM/RAM للنماذج\n• اختيار الكرت المناسب\n• مقارنة النماذج\n• شرح الكوانتايز\n\nاسألني أي سؤال عن AI! 🚀"
      : "Hello! 👋 I'm the **AI INFRA Assistant** — exclusively specialized in AI infrastructure.\n\nI can help with:\n• Calculating VRAM/RAM requirements\n• Choosing the right GPU\n• Comparing models\n• Explaining quantization\n\nAsk me anything about AI infra! 🚀";
  }

  // ═══════════════════════════════════════════════════════════
  // عرض الرسائل في الـ Chat
  // ═══════════════════════════════════════════════════════════

  function addMessage(role, content) {
    var chatBox = document.getElementById("askChatBox");
    if (!chatBox) return;

    var msg = document.createElement("div");
    msg.className = "chat-message chat-" + role;

    // أيقونة
    var icon = document.createElement("div");
    icon.className = "chat-icon";
    if (role === "user") {
      icon.textContent = "👤";
    } else if (role === "assistant") {
      icon.textContent = "🤖";
    } else {
      icon.textContent = "⚠️";
    }
    msg.appendChild(icon);

    // محتوى الرسالة
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    // تحويل Markdown بسيط (bold + links + line breaks)
    var lines = content.split("\n");
    lines.forEach(function (line, i) {
      if (i > 0) bubble.appendChild(document.createElement("br"));

      // معالجة Bold
      var parts = line.split(/\*\*(.*?)\*\*/g);
      parts.forEach(function (part, j) {
        if (j % 2 === 1) {
          // نص bold
          var bold = document.createElement("strong");
          bold.textContent = part;
          bubble.appendChild(bold);
        } else {
          // معالجة الروابط في النص العادي
          var linkParts = part.split(/\[([^\]]+)\]\(([^)]+)\)/g);
          for (var k = 0; k < linkParts.length; k++) {
            if (k % 3 === 1) {
              // نص الرابط
              var a = document.createElement("a");
              a.textContent = linkParts[k];
              a.href = linkParts[k + 1];
              a.className = "chat-link";
              bubble.appendChild(a);
              k++; // تخطي الـ href
            } else if (linkParts[k]) {
              bubble.appendChild(document.createTextNode(linkParts[k]));
            }
          }
        }
      });
    });

    msg.appendChild(bubble);

    // زر نسخ (للردود فقط)
    if (role === "assistant") {
      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "chat-copy-btn";
      copyBtn.textContent = "📋";
      copyBtn.title = lang === "ar" ? "نسخ الرد" : "Copy response";
      copyBtn.addEventListener("click", function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(content).then(function () {
            copyBtn.textContent = "✅";
            setTimeout(function () { copyBtn.textContent = "📋"; }, 1500);
          });
        }
      });
      msg.appendChild(copyBtn);
    }

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function addSystemMessage(text) {
    var chatBox = document.getElementById("askChatBox");
    if (!chatBox) return;

    var msg = document.createElement("div");
    msg.className = "chat-message chat-system";
    msg.textContent = text;
    chatBox.appendChild(msg);
  }

  function addTypingIndicator() {
    var chatBox = document.getElementById("askChatBox");
    if (!chatBox) return "";

    var id = "typing-" + Date.now();
    var msg = document.createElement("div");
    msg.className = "chat-message chat-assistant chat-typing";
    msg.id = id;

    var icon = document.createElement("div");
    icon.className = "chat-icon";
    icon.textContent = "🤖";
    msg.appendChild(icon);

    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = "⏳ " + (lang === "ar" ? "يكتب..." : "Typing...");
    msg.appendChild(bubble);

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  // ═══════════════════════════════════════════════════════════
  // تهيئة
  // ═══════════════════════════════════════════════════════════

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
