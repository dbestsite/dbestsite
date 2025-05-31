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
import { runTransaction, ref as dbRef } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
const totalViewsRef = dbRef(db, "siteStats/totalViews");
runTransaction(totalViewsRef, (current) => {
  return (current || 0) + 1;
});

const videoContainer = document.getElementById("video-container");
const searchInput = document.getElementById("search");
const tagFilter = document.getElementById("tag-filter");
const pagination = document.getElementById("pagination");

let videoData = [];
let filteredData = [];
let selectedTags = new Set();
let currentPage = 1;
let pageGroupOffset = 0;
const pagesPerGroup = 5;
const videosPerPage = 15;

let isSinglePost = false;
const file = "\x76\x69\x64\x65\x6F\x73\x2E\x6A\x73\x6F\x6E"; // Path to your JSON file

fetch(file)
  .then(res => res.json())
  .then(data => {
    videoData = data;
    const path = window.location.pathname.replace('/', '').split('?')[0];
    isSinglePost = path && path !== "index.html";

    if (isSinglePost) {
      filterByPostId(path);  // A function you'll need for single post view
      pagination.innerHTML = ""; // Clear pagination for single post view
    } else {
      filteredData = data; // Filtered videos for home page
      renderVideos();
      renderPagination();
      initFilters();
    }
  });

function initFilters() {
  const allTags = [
    ...new Set(
      videoData.flatMap(v =>
        Array.isArray(v.tags)
          ? v.tags
          : v.tags.split(',').map(t => t.trim())
      )
    )
  ];

  const tagsPerPage = 20;
  let expanded = false;

  const tagButtons = []; // Store all tag buttons
  const tagFilter = document.getElementById("tagFilter");
  const tagToggleContainer = document.getElementById("tagToggleContainer");

  const showMoreBtn = document.createElement("button");
  showMoreBtn.className = "show-more-tags";

  function renderInitialTags() {
    tagFilter.innerHTML = "";
    tagToggleContainer.innerHTML = "";
    tagButtons.length = 0;

    allTags.forEach((tag, index) => {
      const btn = document.createElement("button");
      btn.textContent = tag;
      btn.style.display = index < tagsPerPage ? "inline-block" : "none";
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
      tagButtons.push(btn);
    });

    showMoreBtn.textContent = "Show More Tags";
    showMoreBtn.onclick = toggleTags;
    tagToggleContainer.appendChild(showMoreBtn);
  }

  function toggleTags() {
    if (expanded) {
      // Collapse to first 20
      tagButtons.forEach((btn, i) => {
        btn.style.display = i < tagsPerPage ? "inline-block" : "none";
      });
      showMoreBtn.textContent = "Show More Tags";
      expanded = false;
    } else {
      // Show all
      tagButtons.forEach(btn => {
        btn.style.display = "inline-block";
      });
      showMoreBtn.textContent = "Show Less Tags";
      expanded = true;
    }
  }

  renderInitialTags();
  searchInput.addEventListener("input", applyFilters);
}

function applyTagFilter(tag) {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag);
  } else {
    selectedTags.clear();
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
  const groupStart = pageGroupOffset * pagesPerGroup + 1;
  const groupEnd = Math.min(groupStart + pagesPerGroup - 1, totalPages);

  // Prev group button
  if (pageGroupOffset > 0) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "« Prev";
    prevBtn.onclick = () => {
      pageGroupOffset--;
      renderPagination();
    };
    pagination.appendChild(prevBtn);
  }

  // Page number buttons
  for (let i = groupStart; i <= groupEnd; i++) {
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

  // Next group button
  if (groupEnd < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next »";
    nextBtn.onclick = () => {
      pageGroupOffset++;
      renderPagination();
    };
    pagination.appendChild(nextBtn);
  }
}

function renderVideos() {
  videoContainer.innerHTML = "";

  const path = window.location.pathname.replace('/', '').split('?')[0];
  const isSinglePost = path && path !== "index.html";

  const start = (currentPage - 1) * videosPerPage;
  const end = start + videosPerPage;
  const pageVideos = filteredData.slice(start, end);

  // Add a "Back" button for single video view
  if (filteredData.length === 1) {
    const backButton = document.createElement("button");
    backButton.textContent = "Back to All Videos";
    backButton.onclick = () => {
      history.pushState({}, "", `/post.html?uId=${uid}`);
      filteredData = videoData;
      currentPage = 1;
      renderVideos();
      renderPagination();
    };
    videoContainer.appendChild(backButton);
  }

  pageVideos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";

    const tagsArray = Array.isArray(video.tags)
      ? video.tags
      : video.tags.split(',').map(t => t.trim());

    card.innerHTML = `
  <h3>${video.title}</h3>
  <video 
    src="${video.url}" 
    autoplay 
    muted 
    loop 
    playsinline 
    class="no-center-play preview-video"
  ></video>
`;

    // Click event to go to single post page using uniqueId
    if (!isSinglePost) {
      const wall = document.createElement("a");
      wall.className = "video-wall";
      wall.href = `post.html?uId=${video.uniqueId}`;
      wall.style.display = "block";
      wall.style.position = "absolute";
      wall.style.top = "0";
      wall.style.left = "0";
      wall.style.width = "100%";
      wall.style.height = "100%";
      wall.style.zIndex = "2";
      card.appendChild(wall);
    }

    videoContainer.appendChild(card);

    const videoEl = card.querySelector("video");
    videoEl.addEventListener("loadedmetadata", () => {
      videoEl.currentTime = video.start || 1;
    });

    setupRatingSystem(video.postId); // Ratings should be using postId
  });
}



document.addEventListener("contextmenu", e => e.preventDefault());

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

function filterByUniqueId(uid) {
  const match = videoData.find(v => v.uniqueId === uid);
  filteredData = match ? [match] : [];
  currentPage = 1;
  renderVideos();
}

// Enable back/forward browser navigation
window.addEventListener("popstate", () => {
  const params = new URLSearchParams(window.location.search);
  const uniqueId = params.get("uId");

  if (uniqueId && location.pathname.includes("post.html")) {
    // In post view: reload to re-render that video
    location.reload();
  } else {
    // Back to home or index
    filteredData = videoData;
    currentPage = 1;
    renderVideos();
    renderPagination();
  }
});

function formatSimplified(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num;
}

function formatFull(num) {
  return num.toLocaleString();
}

onValue(totalViewsRef, (snapshot) => {
  const count = snapshot.val() ?? 0;
  document.getElementById("visitor-count-k").textContent = formatSimplified(count);
  document.getElementById("visitor-count-full").textContent = formatFull(count);
});
