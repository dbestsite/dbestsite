// script.js

import { setupRatingSystem } from './rating.js';
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
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

// --- COMMENT MODAL & COMMENTS HANDLING ---

// Load saved username and lock input if saved
function loadSavedUserName() {
  const savedName = localStorage.getItem('commentUserName');
  const nameInput = document.getElementById('comment-name');
  if (savedName) {
    nameInput.value = savedName;
    nameInput.disabled = true;  // lock input so user can't change
  } else {
    nameInput.value = '';
    nameInput.disabled = false;
  }
}

// Build nested comments tree and render recursively
function renderCommentsTree(commentsObj) {
  const commentsArray = Object.entries(commentsObj).map(([id, c]) => ({ id, ...c }));

  // Map parentId to children comments
  const map = {};
  commentsArray.forEach(c => {
    if (!map[c.parentId]) map[c.parentId] = [];
    map[c.parentId].push(c);
  });

  function createCommentElement(comment) {
    const div = document.createElement('div');
    div.classList.add('comment');
    div.style.marginLeft = comment.parentId ? "20px" : "0px"; // indent replies
    div.innerHTML = `
      <strong>${comment.name}</strong>
      <p>${comment.text}</p>
      <button class="reply-btn" data-commentid="${comment.id}" data-author="${comment.name}">Reply</button>
      <div class="replies"></div>
      <hr/>
    `;

    const repliesContainer = div.querySelector('.replies');
    const replies = map[comment.id];
    if (replies) {
      replies.sort((a,b) => a.timestamp - b.timestamp).forEach(reply => {
        repliesContainer.appendChild(createCommentElement(reply));
      });
    }
    return div;
  }

  const fragment = document.createDocumentFragment();
  (map[null] || []).forEach(comment => {
    fragment.appendChild(createCommentElement(comment));
  });
  return fragment;
}

// Load comments from Firebase and render
function loadComments(postId) {
  const commentRef = ref(db, `comments/${postId}`);
  onValue(commentRef, snapshot => {
    commentList.innerHTML = "";
    const comments = snapshot.val();

    if (!comments) {
      commentList.innerHTML = "<p>No comments yet.</p>";
      return;
    }

    // Convert object to array with keys for nested replies
    const commentsArray = Object.entries(comments).map(([id, comment]) => ({ id, ...comment }));

    // Separate top-level comments and replies
    const topComments = commentsArray.filter(c => !c.parentId);
    const replies = commentsArray.filter(c => c.parentId);

    // Sort oldest first
    topComments.sort((a, b) => a.timestamp - b.timestamp);

    // Helper to get replies for a comment
    function getReplies(commentId) {
      return replies
        .filter(r => r.parentId === commentId)
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    // Render comments with replies recursively
    function renderComment(comment, container, level = 0) {
      const div = document.createElement("div");
      div.style.marginLeft = `${level * 20}px`;
      div.classList.add("comment-item");

      div.innerHTML = `
        <strong>${comment.name}</strong> <small>${new Date(comment.timestamp).toLocaleString()}</small>
        <p>${comment.text}</p>
        <button class="reply-btn" data-id="${comment.id}" data-name="${comment.name}">Reply</button>
        <button class="like-btn" data-id="${comment.id}">Like (<span class="like-count">${comment.likes || 0}</span>)</button>
        <hr/>
      `;
      container.appendChild(div);

      // Render replies
      const childReplies = getReplies(comment.id);
      childReplies.forEach(reply => renderComment(reply, container, level + 1));
    }

    topComments.forEach(comment => renderComment(comment, commentList));
  });
}

// Open modal and load comments + user name
document.body.addEventListener("click", e => {
  if (e.target.classList.contains("comment-btn")) {
    activePostId = e.target.dataset.postid;
    loadComments(activePostId);
    loadSavedUserName();
    modal.classList.remove("hidden");
  }
});

// Close modal and reset comment list & form data-parentId
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  commentList.innerHTML = "";
  commentForm.reset();
  delete commentForm.dataset.parentId;
});

// Listen for reply button clicks inside commentList to prefill input
commentList.addEventListener('click', e => {
  if (e.target.classList.contains('reply-btn')) {
    const author = e.target.dataset.author;
    const commentId = e.target.dataset.commentid;
    const textInput = document.getElementById('comment-text');

    textInput.value = `@${author} `;
    textInput.focus();

    // Store the parent comment id to send with new comment
    commentForm.dataset.parentId = commentId;
  }
});

// Handle new comment submission
commentForm.addEventListener("submit", e => {
  e.preventDefault();
  const nameInput = document.getElementById("comment-name");
  const name = nameInput.value.trim();
  const text = document.getElementById("comment-text").value.trim();

  if (!name || !text) return;

  // Save username on first comment and lock input
  if (!localStorage.getItem('commentUserName')) {
    localStorage.setItem('commentUserName', name);
    nameInput.disabled = true;
  }

  // Get parentId if replying to a comment
  const parentId = commentForm.dataset.parentId || null;

  const commentRef = ref(db, `comments/${activePostId}`);
  push(commentRef, { name, text, timestamp: Date.now(), parentId });

  commentForm.reset();
  delete commentForm.dataset.parentId;
});
