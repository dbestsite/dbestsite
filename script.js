// script.js

import { setupRatingSystem } from './rating.js';
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// Firebase config
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

const videoContainer = document.getElementById("video-container");
const searchInput = document.getElementById("search");
const tagFilter = document.getElementById("tag-filter");
const pagination = document.getElementById("pagination");


const modal = document.getElementById("comment-modal");
const commentList = document.getElementById("comment-list");
const closeBtn = document.getElementById("close-comments");
const commentForm = document.getElementById("comment-form");
const nameInput = document.getElementById("comment-name");
const textInput = document.getElementById("comment-text");
let activePostId = null;
let username = localStorage.getItem("username") || "";

// Lock name after first use
if (username) {
  nameInput.value = username;
  nameInput.disabled = true;
}

document.body.addEventListener("click", e => {
  if (e.target.classList.contains("comment-btn")) {
    activePostId = e.target.dataset.postid;
    loadComments(activePostId);
    modal.classList.remove("hidden");
  }

  if (e.target.classList.contains("reply-btn")) {
    const name = e.target.dataset.name;
    const parentId = e.target.dataset.parentid;
    textInput.value = `@${name} `;
    textInput.dataset.replyto = parentId;
    textInput.focus();
  }

  if (e.target.classList.contains("like-btn")) {
    const cid = e.target.dataset.cid;
    toggleLike(activePostId, cid);
  }
});

closeBtn.onclick = () => {
  modal.classList.add("hidden");
  textInput.dataset.replyto = "";
};

commentForm.onsubmit = e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const text = textInput.value.trim();
  const replyTo = textInput.dataset.replyto || null;

  if (!name || !text) return;

  if (!localStorage.getItem("username")) {
    localStorage.setItem("username", name);
    nameInput.disabled = true;
  }

  const commentRef = ref(db, `comments/${activePostId}`);
  push(commentRef, {
    name,
    text,
    replyTo,
    timestamp: Date.now(),
    likes: 0
  });

  textInput.value = "";
  textInput.dataset.replyto = "";
};

function loadComments(postId) {
  const commentRef = ref(db, `comments/${postId}`);
  onValue(commentRef, snap => {
    commentList.innerHTML = "";
    const data = snap.val();
    if (!data) return;

    const comments = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    const rootComments = comments.filter(c => !c.replyTo);
    const childMap = {};

    comments.forEach(c => {
      if (c.replyTo) {
        if (!childMap[c.replyTo]) childMap[c.replyTo] = [];
        childMap[c.replyTo].push(c);
      }
    });

    rootComments
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach(c => renderComment(c, childMap, 0));
  });
}

function renderComment(comment, childMap, depth) {
  const div = document.createElement("div");
  div.className = "comment-item";
  div.style.marginLeft = `${depth * 20}px`;

  const liked = localStorage.getItem(`liked-${activePostId}-${comment.id}`) === "1";
  const likeBtnLabel = liked ? "Unlike" : "Like";

  div.innerHTML = `
    <strong>${comment.name}</strong>: ${comment.text}<br>
    <small>${new Date(comment.timestamp).toLocaleString()}</small><br>
    <button class="reply-btn" data-name="${comment.name}" data-parentid="${comment.id}">Reply</button>
    <button class="like-btn" data-cid="${comment.id}">${likeBtnLabel} (${comment.likes || 0})</button>
    <hr>
  `;

  commentList.appendChild(div);

  (childMap[comment.id] || [])
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach(reply => renderComment(reply, childMap, depth + 1));
}

function toggleLike(postId, cid) {
  const key = `liked-${postId}-${cid}`;
  const liked = localStorage.getItem(key) === "1";
  const refPath = ref(db, `comments/${postId}/${cid}`);

  onValue(refPath, snap => {
    const data = snap.val();
    if (!data) return;
    const newLikes = liked ? (data.likes || 0) - 1 : (data.likes || 0) + 1;
    update(refPath, { likes: newLikes });
    localStorage.setItem(key, liked ? "0" : "1");
  }, { onlyOnce: true });
          }

let videoData = [];
let filteredData = [];
let selectedTags = new Set();
let currentPage = 1;
const videosPerPage = 5;
let activePostId = null;

fetch('videos.json')
  .then(res => res.json())
  .then(data => {
    videoData = data.reverse();
    initFilters();
    applyFilters();
  });

function initFilters() {
  const allTags = [...new Set(videoData.flatMap(v => v.tags))];

  allTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.onclick = () => {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.classList.remove("active");
      } else {
        selectedTags.add(tag);
        btn.classList.add("active");
      }
      applyFilters();
    };
    tagFilter.appendChild(btn);
  });

  searchInput.addEventListener("input", applyFilters);
}

function applyFilters() {
  const term = searchInput.value.toLowerCase();
  const selected = [...selectedTags];
  filteredData = videoData.filter(v =>
    v.title.toLowerCase().includes(term) &&
    (selected.length === 0 || selected.every(tag => v.tags.includes(tag)))
  );
  currentPage = 1;
  renderPagination();
  renderVideos();
}

function renderPagination() {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filteredData.length / videosPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => {
      currentPage = i;
      renderVideos();
      renderPagination();
    };
    pagination.appendChild(btn);
  }
}

function renderVideos() {
  videoContainer.innerHTML = "";
  const start = (currentPage - 1) * videosPerPage;
  const end = start + videosPerPage;
  const pageVideos = filteredData.slice(start, end);

  pageVideos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <h3>${video.title}</h3>
      <video src="${video.url}" controls playsinline controlsList="nodownload"></video>
      <div class="tags">${video.tags.map(t => `<span>#${t}</span>`).join(' ')}</div>
      <div class="rating-box" id="rating-${video.postId}">Loading rating...</div>
      <button class="comment-btn" data-postid="${video.postId}">Comments</button>
    `;
    videoContainer.appendChild(card);
    setupRatingSystem(video.postId, video.votes || 0, video.sum || 0);
  });
}

// Disable right-click
document.addEventListener("contextmenu", e => e.preventDefault());

// Auto pause videos out of view
function checkVideoVisibility() {
  document.querySelectorAll("video").forEach(video => {
    const rect = video.getBoundingClientRect();
    const videoHeight = rect.height;
    const scrolledOut = rect.bottom < window.innerHeight - (videoHeight * 0.2);
    if (scrolledOut && !video.paused) {
      video.pause();
    }
  });
}
window.addEventListener("scroll", checkVideoVisibility);

// Comment Modal Handling
document.body.addEventListener("click", e => {
  if (e.target.classList.contains("comment-btn")) {
    activePostId = e.target.dataset.postid;
    loadComments(activePostId);
    modal.classList.remove("hidden");
  }
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  commentList.innerHTML = "";
});

commentForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("comment-name").value.trim();
  const text = document.getElementById("comment-text").value.trim();

  if (!name || !text) return;

  const commentRef = ref(db, `comments/${activePostId}`);
  push(commentRef, { name, text, timestamp: Date.now() });

  commentForm.reset();
});

function loadComments(postId) {
  const commentRef = ref(db, `comments/${postId}`);
  onValue(commentRef, snapshot => {
    commentList.innerHTML = "";
    const comments = snapshot.val();
    if (comments) {
      const sorted = Object.values(comments).sort((a, b) => b.timestamp - a.timestamp);
      sorted.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${c.name}</strong><p>${c.text}</p><hr/>`;
        commentList.appendChild(div);
      });
    } else {
      commentList.innerHTML = "<p>No comments yet.</p>";
    }
  });
}
