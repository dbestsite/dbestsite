// script.js
import { setupFooterPopup } from './footer.js';
document.addEventListener("DOMContentLoaded", () => {
  setupFooterPopup();
});


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

function applyTagFilter(tag) {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag);
  } else {
    selectedTags.clear(); // optional: for single-select behavior
    selectedTags.add(tag);
  }
  applyFilters();
  highlightCustomTagButtons();
}
window.applyTagFilter = applyTagFilter;
function highlightCustomTagButtons() {
  document.querySelectorAll('#custom-tag button').forEach(btn => {
    const tag = btn.textContent.toLowerCase().includes("short") ? "shortvids" : "fullvids";
    if (selectedTags.has(tag)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
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
    <video src="${video.url}" controls playsinline controlsList="nodownload" muted></video>
    <div class="tags">${video.tags.map(t => `<span>#${t}</span>`).join(' ')}</div>
    <div class="rating-box" id="rating-${video.postId}">Loading rating...</div>
  `;
  videoContainer.appendChild(card);

  // Set video start time
  const videoEl = card.querySelector("video");
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.currentTime = 1;
  });

  // >>> THIS is what you're missing:
  setupRatingSystem(video.postId);
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


