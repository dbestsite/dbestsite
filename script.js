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

let videoData = [];
let filteredData = [];
let selectedTags = new Set();
let currentPage = 1;
const videosPerPage = 5;
let activePostId = null;

let username = localStorage.getItem("dbest_username") || "";
if (username) nameInput.value = username;

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

// Auto pause videos out of view
function checkVideoVisibility() {
  document.querySelectorAll("video").forEach(video => {
    const rect = video.getBoundingClientRect();
    const videoHeight = rect.height;
    const scrolledOut = rect.bottom < window.innerHeight - (videoHeight * 0.2);
    if (scrolledOut && !video.paused) video.pause();
  });
}
window.addEventListener("scroll", checkVideoVisibility);

// Comment Modal

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
  const name = nameInput.value.trim();
  const text = textInput.value.trim();
  if (!name || !text) return;

  localStorage.setItem("dbest_username", name);
  const commentRef = ref(db, `comments/${activePostId}`);
  push(commentRef, {
    name,
    text,
    timestamp: Date.now(),
    likes: 0,
    replies: []
  });
  commentForm.reset();
});

function loadComments(postId) {
  const commentRef = ref(db, `comments/${postId}`);
  onValue(commentRef, snapshot => {
    commentList.innerHTML = "";
    const comments = snapshot.val();
    if (comments) {
      Object.entries(comments).sort((a, b) => b[1].timestamp - a[1].timestamp).forEach(([id, c]) => {
        const div = document.createElement("div");
        div.className = "comment";
        const liked = localStorage.getItem(`liked_${id}`);
        div.innerHTML = `
          <p><strong>${c.name}</strong>: ${c.text}</p>
          <button class="reply-btn" data-name="${c.name}">@Reply</button>
          <button class="like-btn" data-id="${id}">${liked ? "Unlike" : "Like"} (${c.likes || 0})</button>
          <hr/>
        `;
        div.querySelector(".reply-btn").onclick = () => {
          textInput.value = `@${c.name} `;
          textInput.focus();
        };
        div.querySelector(".like-btn").onclick = () => {
          const liked = localStorage.getItem(`liked_${id}`);
          const commentLikesRef = ref(db, `comments/${postId}/${id}`);
          update(commentLikesRef, {
            likes: (c.likes || 0) + (liked ? -1 : 1)
          });
          localStorage.setItem(`liked_${id}`, liked ? "" : "1");
        };
        commentList.appendChild(div);
      });
    } else {
      commentList.innerHTML = "<p>No comments yet.</p>";
    }
  });
}
