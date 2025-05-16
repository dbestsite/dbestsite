// comment.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue, push, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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
let username = localStorage.getItem("username");

function promptName() {
  if (!username) {
    username = prompt("Enter your name:");
    if (username) {
      localStorage.setItem("username", username);
    }
  }
}

export function attachCommentFeature(videoCard, postId) {
  const btn = document.createElement("button");
  btn.textContent = "💬 Comments";
  btn.onclick = () => showPopup(postId);
  videoCard.appendChild(btn);
}

function showPopup(postId) {
  promptName();

  let popup = document.getElementById("comment-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "comment-popup";
    popup.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); color: white; overflow-y: auto;
      z-index: 9999; padding: 1rem;
    `;

    popup.innerHTML = `
      <button id="close-popup" style="position:absolute;top:10px;right:20px;font-size:1.2rem;">Go Back</button>
      <h2>Comments</h2>
      <div id="comment-list"></div>
      <textarea id="new-comment" placeholder="Write a comment..." style="width:100%;height:60px;"></textarea>
      <button id="send-comment">Send</button>
    `;
    document.body.appendChild(popup);

    document.getElementById("close-popup").onclick = () => popup.remove();
    document.getElementById("send-comment").onclick = () => postComment(postId);
  }

  loadComments(postId);
}

function postComment(postId, parentId = null) {
  const text = document.getElementById("new-comment").value.trim();
  if (!text) return;

  const commentRef = ref(db, `comments/${postId}`);
  push(commentRef, {
    user: username,
    text,
    likes: 0,
    replies: [],
    parentId,
    timestamp: Date.now()
  });

  document.getElementById("new-comment").value = "";
}

function loadComments(postId) {
  const commentList = document.getElementById("comment-list");
  const commentRef = ref(db, `comments/${postId}`);
  onValue(commentRef, (snapshot) => {
    const data = snapshot.val() || {};
    commentList.innerHTML = "";
    const comments = Object.entries(data);

    const render = (entries, parent = null) => {
      entries.filter(([_, v]) => v.parentId === parent).forEach(([key, comment]) => {
        const div = document.createElement("div");
        div.style.margin = parent ? "0 0 0 20px" : "1rem 0";

        div.innerHTML = `
          <b>${comment.user}</b>: ${comment.text} <br/>
          <small>${new Date(comment.timestamp).toLocaleString()}</small><br/>
          <button onclick="likeComment('${postId}','${key}')">❤️ ${comment.likes || 0}</button>
          <button onclick="replyToComment('${key}')">Reply</button>
        `;

        commentList.appendChild(div);
        render(comments, key); // recurse
      });
    };

    render(comments);
  });
}

// Like tracking
window.likeComment = function (postId, key) {
  promptName();
  const likeKey = `liked-${postId}-${key}`;
  if (localStorage.getItem(likeKey)) return alert("You already liked this comment.");
  localStorage.setItem(likeKey, true);

  const commentRef = ref(db, `comments/${postId}/${key}`);
  update(commentRef, { likes: (Math.floor(Math.random() * 100) + 1) }); // naive increment
};

window.replyToComment = function (parentId) {
  document.getElementById("new-comment").focus();
  document.getElementById("new-comment").placeholder = `Replying to comment ${parentId}...`;
  document
