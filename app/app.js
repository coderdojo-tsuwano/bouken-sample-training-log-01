// IndexedDB 設定
const DB_NAME = "trainingLogDB";
const STORE_NAME = "logs";
let db;

// データベースを開く
const openDB = () => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadLogs();
    };

    request.onerror = (event) => {
        console.error("DBエラー", event.target.error);
    };
};

// データを保存
const saveLog = (log) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.add(log);
    transaction.oncomplete = () => loadLogs();
};

// データを読み込む
const loadLogs = () => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const logs = request.result;
        displayLogs(logs);
    };
};

// データを表示
const displayLogs = (logs) => {
    const logList = document.getElementById("logList");
    logList.innerHTML = "";
    logs.forEach(log => {
        const li = document.createElement("li");
        li.innerHTML = `${log.date} - ${log.exercise} ${log.sets}セット × ${log.reps}回`;
        logList.appendChild(li);
    });
};

// フォーム処理
document.getElementById("logForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const exercise = document.getElementById("exercise").value;
    const sets = document.getElementById("sets").value;
    const reps = document.getElementById("reps").value;

    if (!date || !exercise || !sets || !reps) {
        alert("すべての項目を入力してください");
        return;
    }

    const log = { date, exercise, sets: Number(sets), reps: Number(reps) };
    saveLog(log);

    event.target.reset();
});

// アプリ起動時にデータベースを開く
window.onload = openDB;

