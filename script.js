const DEFAULT_PAGE = "home";
const AppState = {
  currentPage: "",
  startX: 0,
  details: [],
  cards: [],
  tabOrder: ["home", "ticket", "collection", "scrollArea"],

  load: document.getElementById("load"),
  scrollArea: document.getElementById("scrollArea"),
  collectionGrid: document.getElementById("collectionGrid"),
  postList: document.getElementById("post-list"),
  modal: document.getElementById("modal"),
  backBtn: document.getElementById("backBtn"),
  titleBar: document.getElementById("titleBar"),
  pageTilte: document.getElementById("pageTitle"),
  homeBottom: document.getElementById("homeBottom"),
  detailPanel: document.getElementById("ticket-detail-panel"),
  ticketAnim: document.getElementById("ticketAnimation"),
  tabs: document.querySelectorAll(".tab"),
};

document.addEventListener("DOMContentLoaded", () => {
  fetch("https://kkkkame0721.github.io/Akashic/data.json?ver=" + Date.now())
    .then(res => res.json())
    .then(data => {
      createCards(data);
      createThumb(data);
      createTicketList(data);
    })
    .then(init);
});

/* --- 要素生成系 --- */
function createCards(data) {
  data.forEach(item => {
    AppState.details.push(item);

    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.cardid = item.id;
    card.innerHTML = `
            <video class="card-video" id=${item.id} playsinline muted>
                <source src=${item.video+"?ver=1.1"} type="video/mp4">
            </video>
            <div class="info">
                ${item.title}
                <br>
                ${item.date}
            </div>
        `;
    // 再生が終わったら最初に戻す
    const v = card.querySelector(".card-video");
    v.addEventListener("ended", () => {
      animationReset(v);
    });

    AppState.scrollArea.appendChild(card);
    AppState.cards.push(card);
  });
}

function createThumb(data) {
  data.forEach(item => {
    // サムネイル設定
    const thumb = document.createElement('img');
    thumb.classList.add("thumbnail");
    thumb.src = item.thumbnail + "?ver=1.3";
    thumb.dataset.thumbid = item.id;

    // サムネイルクリック時の挙動を登録
    thumb.addEventListener("click", e => {
      const targetId = e.target.dataset.thumbid;
      const targetIndex = data.findIndex(item => item.id === targetId);
      const targetVideo = document.getElementById(targetId);

      // 全ての動画状況をリセットしてからscrollAreaへ遷移
      allCardVideoStop();
      showPage("scrollArea");

      // 遷移が終わった後にスクロール位置を調整し、再生
      requestAnimationFrame(() => {
        const height = window.innerHeight;
        AppState.scrollArea.scrollTop = targetIndex * height;
        playVideo(targetVideo);
      });
    });

    AppState.collectionGrid.appendChild(thumb);
  });
}

function createTicketList(data) {
  data.forEach(item => {
    // 開催済みチケット生成
    const usedCard = document.createElement("div");
    usedCard.classList.add("ticket-card", "used");
    usedCard.dataset.thumbid = item.id;
    usedCard.innerHTML = `
            <div class="ticket-title">${item.title}</div>
            <div class="ticket-date">${item.date}</div>
        `;
    AppState.postList.appendChild(usedCard);
  });
}

/* --- 縦スクロールアニメーション制御 --- */
function updateVideoPlayback() {
  const scrollPos = AppState.scrollArea.scrollTop;
  const height = window.innerHeight;

  AppState.cards.forEach((card, index) => {
    const video = card.querySelector(".card-video");
    const offset = Math.abs(scrollPos - index * height);
    const progress = Math.min(offset / height, 1);

    // スケール & 透明度
    card.style.transform = `scale(${1 - progress * 0.05})`;
    card.style.opacity = `${1 - progress * 0.3}`;

    // 画面中央に一番近いカードだけ再生、それ以外停止
    if (offset < height * 0.4) {
      card.classList.add("active");
      if (video.paused) {
        video.play();
      }
    } else {
      card.classList.remove("active");
      animationReset(video);
    }
  });
}

/* --- スワイプ関連 --- */
function swipeHandle(target, forwardFn, backFn) {
  target.addEventListener("touchstart", e => {
    AppState.startX = e.touches[0].clientX;
  });
  target.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - AppState.startX;

    if (AppState.startX > 300 && diff < -80) {
      // 左から右へスワイプしたときの関数を登録
      if (!!forwardFn) forwardFn();
    } else if (AppState.startX < 100 && diff > 80) {
      // 右から左へスワイプしたときの関数を登録
      if (!!backFn) backFn();
    }
  });
}

/* --- モーダル関連 --- */
// モーダル内のデータを更新する関数
function updateModalInner(data) {
  const eventTitle = document.getElementById("eventTitle");
  const eventDate = document.getElementById("eventDate");
  const eventImage = document.getElementById("eventImage");
  const stubImage = document.getElementById("modalHeroStubImage");
  const ticketImage = document.getElementById("modalHeroTicketImage");
  eventTitle.textContent = data.title;
  eventDate.textContent = data.date;
  eventImage.src = data.eventimage;
  stubImage.src = data.thumbnail;
  ticketImage.src = data.ticketimage;
}

// モーダルを開く関数
function openModal() {
  const activeCardId = document.querySelector('.card.active').dataset.cardid;
  const cardIdList = Array.from(AppState.cards).map(c => c.dataset.cardid);
  const index = cardIdList.indexOf(activeCardId);
  const activeCardDetail = AppState.details[index];

  updateModalInner(activeCardDetail);

  AppState.modal.classList.add('open');
  AppState.backBtn.classList.remove("active");
}

// モーダルを閉じる関数
function closeModal() {
  AppState.modal.classList.remove('open');
  AppState.backBtn.classList.add("active");
}

// 詳細パネルを開く関数
function openDetailPanel() {
  AppState.detailPanel.classList.add("active");
}

// 詳細パネルを閉じる関数
function closeDetailPanel() {
  AppState.detailPanel.classList.remove("active");
}

/* --- 表示切り替え系 --- */
// 動画を止める
function animationReset(target) {
  target.pause();
  target.currentTime = 0;
}

// 全ての動画を止める
function allCardVideoStop() {
  const videos = document.querySelectorAll(".card-video");
  videos.forEach(v => animationReset(v));
}

// 動画を再生する
function playVideo(target) {
  target.play();
}

//タブバー切り替え処理
function tabChange(targetTabName) {
  AppState.tabs.forEach(tab => {
    const name = tab.dataset.tab;
    const img = tab.querySelector("img");
    if (name === targetTabName) {
      tab.classList.add("active");
      img.src = `https://kkkkame0721.github.io/Akashic/icon/${name}_active.svg`;
    } else {
      tab.classList.remove("active");
      img.src = `https://kkkkame0721.github.io/Akashic/icon/${name}.svg`;
    }
  });
}

// スライドアニメーション
function slideAnimation(targetPage) {
  const currentIndex = AppState.tabOrder.indexOf(AppState.currentPage.id);
  const targetIndex = AppState.tabOrder.indexOf(targetPage.id);
  const isForward = targetIndex > currentIndex; // 右側にあればTrue

  // 準備：ターゲットを左外 or 右外に置く
  targetPage.classList.remove('left', 'right', 'active');
  targetPage.classList.add(isForward ? 'right' : 'left');

  // force reflow（ブラウザに状態を認識させる）
  targetPage.offsetHeight;

  // 現在ページを左外 or 右外に出す
  AppState.currentPage.classList.remove('active');
  AppState.currentPage.classList.add(isForward ? 'left' : 'right');

  // ターゲットを中央に入れる
  targetPage.classList.remove('right', 'left');
  targetPage.classList.add('active');

  // 左外に出た元ページのクラスをリセット(0.4秒後)
  setTimeout(() => {
    AppState.currentPage.classList.remove('left', 'right');
  }, 400);

  AppState.currentPage = targetPage;
}

// ロード画面を消す関数
function hideLoad() {
  AppState.load.classList.add("hidden");
}

/* --- 表示系まとめ --- */
function displayUpdate(targetPage) {
  // モーダル、タイトルバーの表示・非表示切り替え
  if (targetPage.id === "scrollArea") {
    AppState.titleBar.classList.add("hidden");
    AppState.modal.classList.remove("open", "hidden");
    AppState.backBtn.classList.add("active");
  } else {
    AppState.titleBar.classList.remove("hidden");
    AppState.modal.classList.remove("open");
    AppState.modal.classList.add("hidden");
    AppState.backBtn.classList.remove("active");
  }

  // ホーム下部画像の表示・非表示切り替え
  AppState.homeBottom.style.display = (targetPage.id === "home") ? "block" : "none";

  // チケット詳細パネル、入場アニメーションのリセット
  closeDetailPanel();
  AppState.ticketAnim.classList.remove("active");
  animationReset(AppState.ticketAnim);
}

/* --- ページ表示処理 --- */
function showPage(targetPageName) {
  const targetPage = document.getElementById(targetPageName);

  // タブバー切り替え
  tabChange(targetPageName);

  // タイトルバー表示切り替え
  AppState.pageTilte.textContent = targetPage.dataset.tabname;


  // 表示切り替え
  displayUpdate(targetPage);

  // タブスライドアニメーション処理
  slideAnimation(targetPage);
}

/* --- 初期化 --- */
function init() {
  /* --- 関数登録系 --- */
  // スクロールイベント登録
  AppState.scrollArea.addEventListener("scroll", updateVideoPlayback);

  // チケット詳細パネル関連
  const detailTitle = document.getElementById("detail-title");
  const detailBody = document.getElementById("detail-body");
  const ticketBackBtn = document.getElementById("detail-back-btn");

  // カードをクリックするとスライドイン
  document.querySelectorAll(".ticket-card").forEach((card, index) => {
    card.addEventListener("click", () => {

      const title = card.querySelector(".ticket-title").textContent;
      const date = card.querySelector(".ticket-date").textContent;
      let tmpPanel = "";
      if (index === 0) {
        tmpPanel = `
                    <div class="dummy-detail">名古屋ミュージックホール"ダミー" 東2ホール</div>
                    <button id="enter-btn" class="action-btn">入場する</button>
                `;
      } else if (index === 1) {
        tmpPanel = '<button class="action-btn inactive">まだ入場できません</button>';
      } else if (index === 2) {
        tmpPanel = `
                    <img id="stub-image" src="https://kkkkame0721.github.io/Akashic/img/ticket_blank.jpg" style="width: 60%; display: block; margin: 0 auto; border-radius: 12px;">
                    <div class="stub-actions">
                        <button class="action-btn">撮影する</button>
                        <button class="action-btn">写真・動画を選ぶ</button>
                    </div>
                `;
      } else {
        tmpPanel = `
                    <img src="https://kkkkame0721.github.io/Akashic/video/${card.dataset.thumbid}-thumbnail.jpg?ver=1.3" style="width: 60%; display: block; margin: 0 auto; border-radius: 12px;"/>
                    <button class="action-btn" onclick=showPage('collection')>コレクションへ</button>
                `;
      }
      detailTitle.textContent = "チケット詳細";
      detailBody.innerHTML = `
                <div class="detail-section">
                    <h3>${title}</h3>
                    <p>${(index === 0) ? date+" 18:00 開場 / 19:00 開演":date}</p>
                    ${tmpPanel}
            `;
      openDetailPanel();

      if (index === 0) {
        // チケットアニメーション登録（押すと始まる）
        AppState.ticketAnim.addEventListener("click", () => AppState.ticketAnim.play());
        AppState.ticketAnim.addEventListener("ended", () => {
          closeDetailPanel();
          AppState.ticketAnim.classList.remove("active");
          animationReset(AppState.ticketAnim);
        });
        // 入場ボタン → 動画再生紐付け
        document.getElementById("enter-btn").addEventListener("click", () => {
          animationReset(AppState.ticketAnim);
          AppState.ticketAnim.classList.add("active");
        });
      }
    });
  });

  // チケット詳細パネルから戻る
  ticketBackBtn.addEventListener("click", () => {
    closeDetailPanel();
  });

  // 動画クリックで再生
  AppState.scrollArea.addEventListener("click", e => {
    const target = e.target;
    if (target.classList.contains("card-video")) {
      if (target.paused) {
        target.play();
      } else {
        target.pause();
      }
    }
  });
  // スワイプ動作登録
  swipeHandle(document.getElementById("home"), () => showPage("ticket"), "");
  swipeHandle(document.getElementById("ticket"), () => showPage("collection"), () => showPage("home"));
  swipeHandle(document.getElementById("collection"), "", () => showPage("ticket"));
  swipeHandle(AppState.scrollArea, openModal, () => showPage("collection"));
  swipeHandle(AppState.modal, "", closeModal);
  swipeHandle(AppState.detailPanel, "", closeDetailPanel);

  // タブアイコンに関数を登録
  AppState.tabs.forEach(tab => {
    const name = tab.dataset.tab;
    tab.addEventListener('click', () => {
      showPage(name);
    });
  });

  // ホーム下部画像 → チケットページへ
  document.getElementById("homeBottomToTicket").addEventListener("click", () => {
    const activeTabBtn = document.querySelector(".tab-btn.active");
    activeTabBtn.classList.remove("active");
    const preListTabBtn = document.getElementById("pre-list-btn");
    preListTabBtn.classList.add("active");

    const activeTab = document.querySelector(".ticket-list.active");
    activeTab.classList.remove("active");
    const preListTab = document.getElementById("pre-list");
    preListTab.classList.add("active");

    showPage("ticket");
  });

  // チケットタブ内のタブ切り替え
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".tab-btn.active").classList.remove("active");
      btn.classList.add("active");

      document.querySelector(".ticket-list.active").classList.remove("active");
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });

  // 動画ページ ← 戻る
  AppState.backBtn.addEventListener('click', () => {
    showPage("collection");
  });

  /* --- デフォルトページ表示 --- */
  AppState.currentPage = document.getElementById(DEFAULT_PAGE);
  showPage(DEFAULT_PAGE);


  // デバッグ用
  document.getElementById("modal-swipe-handle").addEventListener("click", openModal);

  // 0.4秒待ってからロード画面を隠す
  setTimeout(() => {
    hideLoad();
  }, 400);
}
