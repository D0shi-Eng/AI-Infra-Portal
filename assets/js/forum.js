/**
 * forum.js
 * منتدى النقاش — يعتمد على Firebase Firestore
 * مميّزات: إنشاء موضوع، ردود، إعجاب، فلترة، ترتيب
 * محمي: يتطلب اشتراك نشط (isPremium)
 */

(function () {
  "use strict";

  var lang = "ar";
  var currentCategory = "";
  var currentSort = "newest";

  // ═══════════════════════════════════════════════════════════
  // حماية المحتوى — للمشتركين فقط
  // ═══════════════════════════════════════════════════════════

  function init() {
    lang = (typeof I18N !== "undefined" && I18N.getSavedLang) ? I18N.getSavedLang() : "ar";

    // تفعيل حماية الاشتراك
    Subscription.guard("forumContent", {
      description: lang === "ar"
        ? "المنتدى متاح حصرياً للمشتركين. اشترك للوصول إلى النقاشات والمشاركة مع المجتمع."
        : "The forum is exclusive to subscribers. Subscribe to access discussions and engage with the community."
    });

    // ربط الأحداث
    bindEvents();

    // تحميل المواضيع عند تغيّر حالة المصادقة
    Auth.onAuthChange(function (user, userDoc) {
      if (user && Auth.isPremium()) {
        loadPosts();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ربط الأحداث
  // ═══════════════════════════════════════════════════════════

  function bindEvents() {
    var newPostBtn = document.getElementById("newPostBtn");
    var submitPostBtn = document.getElementById("submitPostBtn");
    var cancelPostBtn = document.getElementById("cancelPostBtn");
    var closePostModal = document.getElementById("closePostModal");
    var forumCategory = document.getElementById("forumCategory");
    var forumSort = document.getElementById("forumSort");
    var modal = document.getElementById("newPostModal");

    if (newPostBtn) {
      newPostBtn.addEventListener("click", function () {
        if (modal) modal.style.display = "flex";
      });
    }

    if (cancelPostBtn) {
      cancelPostBtn.addEventListener("click", function () {
        if (modal) modal.style.display = "none";
        _clearForm();
      });
    }

    if (closePostModal) {
      closePostModal.addEventListener("click", function () {
        if (modal) modal.style.display = "none";
        _clearForm();
      });
    }

    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) {
          modal.style.display = "none";
          _clearForm();
        }
      });
    }

    if (submitPostBtn) {
      submitPostBtn.addEventListener("click", submitPost);
    }

    if (forumCategory) {
      forumCategory.addEventListener("change", function () {
        currentCategory = forumCategory.value;
        loadPosts();
      });
    }

    if (forumSort) {
      forumSort.addEventListener("change", function () {
        currentSort = forumSort.value;
        loadPosts();
      });
    }
  }

  function _clearForm() {
    var title = document.getElementById("postTitle");
    var body = document.getElementById("postBody");
    var err = document.getElementById("postError");
    if (title) title.value = "";
    if (body) body.value = "";
    if (err) err.textContent = "";
  }

  // ═══════════════════════════════════════════════════════════
  // إنشاء موضوع جديد
  // ═══════════════════════════════════════════════════════════

  async function submitPost() {
    var titleEl = document.getElementById("postTitle");
    var bodyEl = document.getElementById("postBody");
    var catEl = document.getElementById("postCategory");
    var errEl = document.getElementById("postError");
    var submitBtn = document.getElementById("submitPostBtn");

    var title = (titleEl ? titleEl.value : "").trim();
    var body = (bodyEl ? bodyEl.value : "").trim();
    var category = catEl ? catEl.value : "general";

    // تحقق
    if (!title || title.length < 3) {
      if (errEl) errEl.textContent = I18N.t("forum_err_title_short");
      return;
    }
    if (!body || body.length < 10) {
      if (errEl) errEl.textContent = I18N.t("forum_err_body_short");
      return;
    }

    var user = Auth.getUser();
    if (!user) return;

    try {
      if (submitBtn) submitBtn.disabled = true;
      if (errEl) errEl.textContent = "";

      var db = FirebaseConfig.db();
      await db.collection("posts").add({
        title: title,
        body: body,
        category: category,
        authorId: user.uid,
        authorName: user.displayName || user.email || "مجهول",
        authorPhoto: user.photoURL || "",
        likes: 0,
        likedBy: [],
        replyCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // إغلاق النافذة وإعادة التحميل
      var modal = document.getElementById("newPostModal");
      if (modal) modal.style.display = "none";
      _clearForm();
      loadPosts();
    } catch (err) {
      console.error("خطأ في نشر الموضوع:", err);
      if (errEl) errEl.textContent = I18N.t("forum_err_submit");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // تحميل المواضيع
  // ═══════════════════════════════════════════════════════════

  async function loadPosts() {
    var container = document.getElementById("forumPosts");
    var loading = document.getElementById("forumLoading");
    if (!container) return;

    if (loading) loading.style.display = "block";

    try {
      var db = FirebaseConfig.db();
      var query = db.collection("posts");

      // فلترة بالقسم
      if (currentCategory) {
        query = query.where("category", "==", currentCategory);
      }

      // ترتيب
      if (currentSort === "popular") {
        query = query.orderBy("likes", "desc");
      } else {
        query = query.orderBy("createdAt", "desc");
      }

      // حد أقصى 50 موضوع
      query = query.limit(50);

      var snapshot = await query.get();

      // مسح المحتوى السابق
      while (container.firstChild) container.removeChild(container.firstChild);

      if (snapshot.empty) {
        var empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = I18N.t("forum_no_posts");
        container.appendChild(empty);
      } else {
        snapshot.forEach(function (doc) {
          var post = doc.data();
          post.id = doc.id;
          container.appendChild(buildPostCard(post));
        });
      }
    } catch (err) {
      console.error("خطأ في تحميل المواضيع:", err);
      while (container.firstChild) container.removeChild(container.firstChild);
      var errEl = document.createElement("p");
      errEl.className = "muted";
      errEl.textContent = I18N.t("forum_err_load");
      container.appendChild(errEl);
    } finally {
      if (loading) loading.style.display = "none";
    }
  }

  // ═══════════════════════════════════════════════════════════
  // بناء بطاقة موضوع (DOM آمن)
  // ═══════════════════════════════════════════════════════════

  function buildPostCard(post) {
    var card = document.createElement("article");
    card.className = "neon-card forum-post-card";

    // رأس الموضوع (مؤلف + تاريخ)
    var header = document.createElement("div");
    header.className = "forum-post-header";

    // صورة المؤلف
    if (post.authorPhoto) {
      var avatar = document.createElement("img");
      avatar.src = post.authorPhoto;
      avatar.alt = post.authorName;
      avatar.className = "forum-avatar";
      avatar.referrerPolicy = "no-referrer";
      header.appendChild(avatar);
    } else {
      var avatarPlaceholder = document.createElement("div");
      avatarPlaceholder.className = "forum-avatar-placeholder";
      avatarPlaceholder.textContent = (post.authorName || "?")[0];
      header.appendChild(avatarPlaceholder);
    }

    var authorInfo = document.createElement("div");
    authorInfo.className = "forum-author-info";

    var authorName = document.createElement("span");
    authorName.className = "forum-author-name";
    authorName.textContent = post.authorName;
    authorInfo.appendChild(authorName);

    var date = document.createElement("span");
    date.className = "forum-post-date";
    if (post.createdAt) {
      var d = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      date.textContent = d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
        year: "numeric", month: "short", day: "numeric"
      });
    }
    authorInfo.appendChild(date);

    header.appendChild(authorInfo);

    // شارة القسم
    var catBadge = document.createElement("span");
    catBadge.className = "badge badge-category";
    catBadge.textContent = _catLabel(post.category);
    header.appendChild(catBadge);

    card.appendChild(header);

    // عنوان الموضوع
    var title = document.createElement("h3");
    title.className = "forum-post-title";
    title.textContent = post.title;
    card.appendChild(title);

    // نص الموضوع (مقتطف)
    var body = document.createElement("p");
    body.className = "forum-post-body";
    body.textContent = post.body.length > 300 ? post.body.substring(0, 300) + "…" : post.body;
    card.appendChild(body);

    // أزرار التفاعل
    var actions = document.createElement("div");
    actions.className = "forum-post-actions";

    // زر إعجاب
    var likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = "forum-action-btn";
    var user = Auth.getUser();
    var userLiked = user && post.likedBy && post.likedBy.indexOf(user.uid) !== -1;
    likeBtn.textContent = (userLiked ? "❤️" : "🤍") + " " + (post.likes || 0);
    if (userLiked) likeBtn.classList.add("liked");
    likeBtn.addEventListener("click", function () {
      toggleLike(post.id, userLiked);
    });
    actions.appendChild(likeBtn);

    // عدد الردود
    var replyInfo = document.createElement("span");
    replyInfo.className = "forum-action-btn";
    replyInfo.textContent = "💬 " + (post.replyCount || 0);
    actions.appendChild(replyInfo);

    card.appendChild(actions);

    // عند النقر على البطاقة — فتح الموضوع
    title.style.cursor = "pointer";
    title.addEventListener("click", function () {
      showPostDetail(post);
    });

    return card;
  }

  // ═══════════════════════════════════════════════════════════
  // إعجاب / إلغاء إعجاب
  // ═══════════════════════════════════════════════════════════

  async function toggleLike(postId, currentlyLiked) {
    var user = Auth.getUser();
    if (!user) return;

    try {
      var db = FirebaseConfig.db();
      var ref = db.collection("posts").doc(postId);

      if (currentlyLiked) {
        await ref.update({
          likes: firebase.firestore.FieldValue.increment(-1),
          likedBy: firebase.firestore.FieldValue.arrayRemove(user.uid)
        });
      } else {
        await ref.update({
          likes: firebase.firestore.FieldValue.increment(1),
          likedBy: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });
      }
      loadPosts();
    } catch (err) {
      console.error("خطأ في الإعجاب:", err);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // عرض تفاصيل الموضوع مع الردود
  // ═══════════════════════════════════════════════════════════

  async function showPostDetail(post) {
    // إزالة أي overlay سابق
    var old = document.getElementById("postDetailOverlay");
    if (old) old.remove();

    var overlay = document.createElement("div");
    overlay.id = "postDetailOverlay";
    overlay.className = "auth-modal-overlay";

    var modal = document.createElement("div");
    modal.className = "auth-modal forum-detail-modal";

    // زر إغلاق
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "auth-close-btn";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", function () { overlay.remove(); });
    modal.appendChild(closeBtn);

    // عنوان الموضوع
    var title = document.createElement("h2");
    title.textContent = post.title;
    modal.appendChild(title);

    // معلومات المؤلف
    var meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = post.authorName;
    if (post.createdAt) {
      var d = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      meta.textContent += " • " + d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US");
    }
    modal.appendChild(meta);

    // نص الموضوع الكامل
    var body = document.createElement("div");
    body.className = "forum-detail-body";
    body.textContent = post.body;
    modal.appendChild(body);

    // فاصل
    var sep = document.createElement("hr");
    modal.appendChild(sep);

    // الردود
    var repliesTitle = document.createElement("h3");
    repliesTitle.textContent = I18N.t("forum_replies") + " (" + (post.replyCount || 0) + ")";
    modal.appendChild(repliesTitle);

    var repliesContainer = document.createElement("div");
    repliesContainer.id = "repliesList";
    repliesContainer.className = "forum-replies";
    modal.appendChild(repliesContainer);

    // تحميل الردود
    try {
      var db = FirebaseConfig.db();
      var snap = await db.collection("posts").doc(post.id)
        .collection("replies").orderBy("createdAt", "asc").limit(100).get();
      snap.forEach(function (doc) {
        var reply = doc.data();
        var replyCard = document.createElement("div");
        replyCard.className = "forum-reply";

        var rHeader = document.createElement("div");
        rHeader.className = "forum-reply-header";
        var rName = document.createElement("strong");
        rName.textContent = reply.authorName;
        rHeader.appendChild(rName);
        if (reply.createdAt) {
          var rd = reply.createdAt.toDate ? reply.createdAt.toDate() : new Date(reply.createdAt);
          var rDate = document.createElement("span");
          rDate.className = "muted";
          rDate.textContent = " • " + rd.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US");
          rHeader.appendChild(rDate);
        }
        replyCard.appendChild(rHeader);

        var rBody = document.createElement("p");
        rBody.textContent = reply.body;
        replyCard.appendChild(rBody);

        repliesContainer.appendChild(replyCard);
      });
    } catch (err) {
      console.error("خطأ في تحميل الردود:", err);
    }

    // حقل رد جديد
    var replyInput = document.createElement("textarea");
    replyInput.className = "auth-input forum-textarea";
    replyInput.placeholder = lang === "ar" ? "اكتب ردّك..." : "Write your reply...";
    replyInput.maxLength = 2000;
    replyInput.rows = 3;
    modal.appendChild(replyInput);

    var replyBtn = document.createElement("button");
    replyBtn.type = "button";
    replyBtn.className = "btn cta-btn";
    replyBtn.textContent = I18N.t("forum_reply_btn");
    replyBtn.addEventListener("click", async function () {
      var text = replyInput.value.trim();
      if (!text || text.length < 2) return;
      var user = Auth.getUser();
      if (!user) return;

      replyBtn.disabled = true;
      try {
        var db = FirebaseConfig.db();
        await db.collection("posts").doc(post.id).collection("replies").add({
          body: text,
          authorId: user.uid,
          authorName: user.displayName || user.email || "مجهول",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // تحديث عداد الردود
        await db.collection("posts").doc(post.id).update({
          replyCount: firebase.firestore.FieldValue.increment(1)
        });
        overlay.remove();
        loadPosts();
      } catch (err) {
        console.error("خطأ في الرد:", err);
      } finally {
        replyBtn.disabled = false;
      }
    });
    modal.appendChild(replyBtn);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  // ═══════════════════════════════════════════════════════════
  // تسميات الأقسام
  // ═══════════════════════════════════════════════════════════

  function _catLabel(cat) {
    var labels = {
      ar: { general: "نقاشات عامة", technical: "أسئلة تقنية", projects: "مشاريع", requests: "طلبات نماذج" },
      en: { general: "General", technical: "Technical", projects: "Projects", requests: "Model Requests" }
    };
    return (labels[lang] || labels.ar)[cat] || cat;
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
