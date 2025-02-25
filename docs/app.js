// IndexedDB 設定
const DB_NAME = "molkkyDB";
const STORE_NAME = "players";
let db;

// 初期プレイヤー
const players = [
    { name: "プレイヤー1", score: 0 },
    { name: "プレイヤー2", score: 0 }
];

// データベースを開く
const openDB = () => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "name" });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadPlayers();
    };
};

// データを読み込む
const loadPlayers = () => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        if (request.result.length > 0) {
            updatePlayers(request.result);
        } else {
            savePlayers(players);
        }
    };
};

// プレイヤー情報を保存
const savePlayers = (players) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    players.forEach(player => store.put(player));
    transaction.oncomplete = () => updatePlayers(players);
};

// スコアを追加
const addScore = (name, points) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(name);

    request.onsuccess = () => {
        let player = request.result;
        if (!player) return;

        player.score += points;

        // 50点超えたら25点にリセット
        if (player.score > 50) {
            player.score = 25;
        }

        store.put(player);
        transaction.oncomplete = () => updatePlayersFromDB();
    };
};

// プレイヤー表示を更新
const updatePlayersFromDB = () => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => updatePlayers(request.result);
};

// プレイヤー情報を表示
const updatePlayers = (players) => {
    const playerContainer = document.getElementById("players");
    const playerSelect = document.getElementById("playerSelect");

    playerContainer.innerHTML = "";
    playerSelect.innerHTML = "";

    players.forEach(player => {
        const div = document.createElement("div");
        div.textContent = `${player.name}: ${player.score}点`;
        if (player.score === 50) {
            div.style.color = "green";
            div.style.fontWeight = "bold";
            alert(`${player.name} が勝ちました！ 🎉`);
        }
        playerContainer.appendChild(div);

        const option = document.createElement("option");
        option.value = player.name;
        option.textContent = player.name;
        playerSelect.appendChild(option);
    });
};

// スコア追加処理
document.getElementById("scoreForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("playerSelect").value;
    const points = Number(document.getElementById("scoreInput").value);
    if (points > 0) {
        addScore(name, points);
    }
    event.target.reset();
});

// ゲームリセット
document.getElementById("resetButton").addEventListener("click", () => {
    savePlayers(players.map(p => ({ name: p.name, score: 0 })));
});

// アプリ起動時にデータベースを開く
window.onload = openDB;

