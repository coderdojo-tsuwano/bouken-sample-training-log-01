// =======================
// データ構造 & IndexedDB
// =======================
const DB_NAME = "molkkyDB_v2";
const STORE_NAME = "scoreboardStore";
let db = null;

// 初期スコアボード
// ※ 好きなだけプレイヤーを増やすなら、この players に追加
let scoreboard = {
  players: [
    { name: "プレイヤー1", total: 0, scores: [] },
    { name: "プレイヤー2", total: 0, scores: [] },
    { name: "プレイヤー3", total: 0, scores: [] },
    { name: "プレイヤー4", total: 0, scores: [] },
  ],
  turnIndex: 0, // 何回目の投げか
};

// =======================
// IndexedDBを開く
// =======================
function openDB() {
  const request = indexedDB.open(DB_NAME, 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    loadScoreboard();
  };

  request.onerror = (event) => {
    console.error("DBエラー:", event.target.error);
  };
}

// =======================
// IndexedDBからデータ読み込み
// =======================
function loadScoreboard() {
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const getReq = store.get("molkkyScoreboard");

  getReq.onsuccess = () => {
    if (getReq.result) {
      scoreboard = getReq.result.data;
    }
    renderTable(); // 読み込み後に描画
  };
}

// =======================
// IndexedDBにデータを保存
// =======================
function saveScoreboard() {
  if (!db) return;

  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put({ id: "molkkyScoreboard", data: scoreboard });
}

// =======================
// スキットルボタンを作る
// =======================
function createSkittleButtons() {
  const skittlesDiv = document.getElementById("skittles");
  skittlesDiv.innerHTML = "";

  // スキットルは1～12
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "skittle";
    btn.textContent = String(i);
    btn.addEventListener("click", () => addScore(i));
    skittlesDiv.appendChild(btn);
  }
}

// =======================
// スコアを追加する関数
// =======================
function addScore(points) {
  const currentPlayerIndex = scoreboard.turnIndex % scoreboard.players.length;
  const currentPlayer = scoreboard.players[currentPlayerIndex];

  // 投げた点を記録
  currentPlayer.scores.push(points);

  // 合計加算
  currentPlayer.total += points;

  // 50点超え → 25点にリセット
  if (currentPlayer.total > 50) {
    currentPlayer.total = 25;
  }

  // 50点ちょうど → 勝利アラート
  if (currentPlayer.total === 50) {
    alert(`${currentPlayer.name} が勝ちました！ 🎉`);
  }

  // 次の投げへ
  scoreboard.turnIndex++;

  // DBに保存 & 画面更新
  saveScoreboard();
  renderTable();
}

// =======================
// テーブル描画
// =======================
function renderTable() {
  // ヘッダー行: 「Throw #」 + 各プレイヤー名
  const thead = document.getElementById("scoreHead");
  const tbody = document.getElementById("scoreBody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  // (1) ヘッダー作成
  //    例:  <th>Throw #</th> <th>プレイヤー1</th> <th>プレイヤー2</th> ...
  const headerRow = document.createElement("tr");
  const throwHeader = document.createElement("th");
  throwHeader.textContent = "Throw #";
  headerRow.appendChild(throwHeader);

  scoreboard.players.forEach(player => {
    const th = document.createElement("th");
    th.textContent = player.name;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // (2) 何投目まであるか -> 最大の投げ回数を計算
  let maxThrows = 0;
  scoreboard.players.forEach(player => {
    if (player.scores.length > maxThrows) {
      maxThrows = player.scores.length;
    }
  });

  // (3) 各投げごとに行を作成
  for (let i = 0; i < maxThrows; i++) {
    const row = document.createElement("tr");

    // 先頭セル → "i+1投目"
    const throwCell = document.createElement("td");
    throwCell.textContent = `${i + 1}投目`;
    row.appendChild(throwCell);

    // 各プレイヤーのスコア or "-"
    scoreboard.players.forEach(player => {
      const td = document.createElement("td");
      if (player.scores[i] !== undefined) {
        td.textContent = String(player.scores[i]);
      } else {
        td.textContent = "-";
      }
      row.appendChild(td);
    });

    tbody.appendChild(row);
  }

  // (4) 合計行
  const totalRow = document.createElement("tr");
  const totalLabel = document.createElement("td");
  totalLabel.textContent = "合計";
  totalRow.appendChild(totalLabel);

  scoreboard.players.forEach(player => {
    const td = document.createElement("td");
    td.textContent = String(player.total);
    // もし50点なら強調するなど
    if (player.total === 50) {
      td.style.color = "green";
      td.style.fontWeight = "bold";
    }
    totalRow.appendChild(td);
  });
  tbody.appendChild(totalRow);
}

// =======================
// リセット処理
// =======================
function resetGame() {
  // スコア履歴も含め全消去
  scoreboard.players.forEach(p => {
    p.total = 0;
    p.scores = [];
  });
  scoreboard.turnIndex = 0;

  saveScoreboard();
  renderTable();
}

// =======================
// アプリ起動時
// =======================
window.onload = () => {
  openDB();               // IndexedDBを開く & データ読み込み
  createSkittleButtons(); // スキットルボタン生成

  // リセットボタン
  document.getElementById("resetButton")
    .addEventListener("click", resetGame);
};

