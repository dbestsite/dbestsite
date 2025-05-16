

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query,
  where, orderBy, serverTimestamp, doc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWqWfKWRY7nxZTIXxgV1j_baHY0m8F_Ng",
  authDomain: "dbest-rating.firebaseapp.com",
  databaseURL: "https://dbest-rating-default-rtdb.firebaseio.com",
  projectId: "dbest-rating",
  storageBucket: "dbest-rating.firebasestorage.app",
  messagingSenderId: "951177510571",
  appId: "1:951177510571:web:8e5917a62e3443e1dbc1ee",
  measurementId: "G-9DSK5WTW62"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentPostId = null;
let currentUser = null;

const popup = document.getElementById("comment-popup");
const goBackBtn = document.getElementById("go-back");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");
const commentSection = document.getElementById("comment-section");

// Open popup when comment button clicked
document.addEventListener("click", async (e) => {
  if (e.target.matches(".open-comments-btn")) {
    currentPostId = e.target.dataset.postId;
    popup.classList.remove("hidden");
    await loadComments(currentPostId);
  }
});

// Close popup
goBackBtn.onclick = () => {
  popup.classList.add("hidden");
  commentSection.innerHTML = "";
};

commentForm.onsubmit = async (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text) return;
  const user = await getUserName();
  await addDoc(collection(db, "comments"), {
    postId: currentPostId,
    parentId: null,
    text,
    user,
    likes: 0,
    timestamp: serverTimestamp()
  });
  commentInput.value = "";
  await loadComments(currentPostId);
};

async function loadComments(postId) {
  commentSection.innerHTML = "<p>Loading...</p>";
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("timestamp", "asc")
  );
  const snap = await getDocs(q);
  const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  commentSection.innerHTML = "";
  const tree = buildTree(comments);
  tree.forEach(c => renderComment(c, commentSection));
}

function buildTree(comments, parentId = null) {
  return comments
    .filter(c => c.parentId === parentId)
    .map(c => ({ ...c, replies: buildTree(comments, c.id) }));
}

function renderComment(comment, container) {
  const div = document.createElement("div");
  div.className = "comment";
  div.innerHTML = `
    <p><strong>${comment.user}</strong>: ${comment.text}</p>
    <p>
      <button class="reply-btn" data-id="${comment.id}">Reply</button>
      <button class="like-btn" data-id="${comment.id}" data-liked="${hasLiked(comment.id)}">❤️ ${comment.likes || 0}</button>
    </p>
  `;
  container.appendChild(div);

  const replyForm = document.createElement("form");
  replyForm.classList.add("hidden");
  replyForm.innerHTML = `
    <textarea required placeholder="Write a reply..."></textarea>
    <button type="submit">Send</button>
  `;
  div.appendChild(replyForm);

  div.querySelector(".reply-btn").onclick = () => {
    replyForm.classList.toggle("hidden");
  };

  replyForm.onsubmit = async (e) => {
    e.preventDefault();
    const replyText = replyForm.querySelector("textarea").value.trim();
    if (!replyText) return;
    const user = await getUserName();
    await addDoc(collection(db, "comments"), {
      postId: currentPostId,
      parentId: comment.id,
      text: replyText,
      user,
      likes: 0,
      timestamp: serverTimestamp()
    });
    await loadComments(currentPostId);
  };

  div.querySelector(".like-btn").onclick = async (e) => {
    const btn = e.target;
    const id = btn.dataset.id;
    if (hasLiked(id)) return;
    await updateDoc(doc(db, "comments", id), {
      likes: increment(1)
    });
    saveLike(id);
    await loadComments(currentPostId);
  };

  comment.replies?.forEach(r => renderComment(r, div));
}

// Get or ask for username
async function getUserName() {
  if (currentUser) return currentUser;

  const saved = localStorage.getItem("commentName");
  if (saved) {
    currentUser = saved;
    return saved;
  }

  const name = prompt("Enter your name to comment or like:");
  if (!name) throw new Error("Name required");
  localStorage.setItem("commentName", name);
  currentUser = name;
  return name;
}

// Local like control
function hasLiked(commentId) {
  const liked = JSON.parse(localStorage.getItem("likedComments") || "[]");
  return liked.includes(commentId);
}
function saveLike(commentId) {
  const liked = JSON.parse(localStorage.getItem("likedComments") || "[]");
  liked.push(commentId);
  localStorage.setItem("likedComments", JSON.stringify(liked));
}
