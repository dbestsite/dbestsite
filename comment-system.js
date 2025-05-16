import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 🔐 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDWqWfKWRY7nxZTIXxgV1j_baHY0m8F_Ng",
  authDomain: "dbest-rating.firebaseapp.com",
  databaseURL: "https://dbest-rating-default-rtdb.firebaseio.com",
  projectId: "dbest-rating",
  storageBucket: "dbest-rating.appspot.com",
  messagingSenderId: "951177510571",
  appId: "1:951177510571:web:8e5917a62e3443e1dbc1ee",
  measurementId: "G-9DSK5WTW62"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentPostId = null;
const popup = document.getElementById("comment-popup");
const section = document.getElementById("comment-section");
const form = document.getElementById("comment-form");
const input = document.getElementById("comment-input");
const goBack = document.getElementById("go-back");

// 🔁 User name
let username = localStorage.getItem("username") || null;
if (!username) username = prompt("Enter your name:") || "Anonymous";
localStorage.setItem("username", username);

// ⬅️ Close popup
goBack.onclick = () => popup.classList.remove("active");

// 🔄 Load comments
function loadComments(postId) {
  section.innerHTML = "Loading...";
  const commentsRef = ref(db, "comments/" + postId);
  onValue(commentsRef, snapshot => {
    const data = snapshot.val() || {};
    section.innerHTML = "";
    Object.entries(data).forEach(([key, val]) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <b>${val.name}</b>: ${val.text}
        <br><small>👍 ${val.likes || 0}</small>
        <button data-key="${key}" class="like-btn">Like</button>
      `;
      section.appendChild(div);
    });
  });
}

// ➕ Submit comment
form.onsubmit = (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  const newRef = push(ref(db, "comments/" + currentPostId));
  newRef.set({ name: username, text: input.value.trim(), likes: 0 });
  input.value = "";
};

// 👍 Like button
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("like-btn")) {
    const key = e.target.dataset.key;
    const likeKey = `liked-${currentPostId}-${key}`;
    if (localStorage.getItem(likeKey)) return alert("You already liked this.");
    const likeRef = ref(db, `comments/${currentPostId}/${key}/likes`);
    runTransaction(likeRef, n => (n || 0) + 1);
    localStorage.setItem(likeKey, "1");
  }
});

// 📦 Public setup function
export function setupCommentButton(btn) {
  btn.addEventListener("click", () => {
    currentPostId = btn.dataset.postId;
    popup.classList.add("active");
    loadComments(currentPostId);
  });
}
