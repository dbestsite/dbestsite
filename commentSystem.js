// commentSystem.js import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"; import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyDWqWfKWRY7nxZTIXxgV1j_baHY0m8F_Ng", authDomain: "dbest-rating.firebaseapp.com", databaseURL: "https://dbest-rating-default-rtdb.firebaseio.com", projectId: "dbest-rating", storageBucket: "dbest-rating.appspot.com", messagingSenderId: "951177510571", appId: "1:951177510571:web:8e5917a62e3443e1dbc1ee", measurementId: "G-9DSK5WTW62" };

const app = initializeApp(firebaseConfig); const db = getDatabase(app);

function getUserName() { let name = localStorage.getItem("dbest_user_name"); if (!name) { name = prompt("Enter your name:"); if (name) localStorage.setItem("dbest_user_name", name); } return name || "Anonymous"; }

export function setupComments(postId) { const container = document.createElement("div"); container.className = "comment-section"; container.innerHTML = <h3>Comments</h3> <div id="comments-list"></div> <textarea id="new-comment" placeholder="Write a comment..."></textarea> <button id="submit-comment">Submit</button>;

document.body.appendChild(container);

const listEl = container.querySelector("#comments-list"); const textarea = container.querySelector("#new-comment"); const submitBtn = container.querySelector("#submit-comment");

const commentRef = ref(db, comments/${postId});

submitBtn.addEventListener("click", () => { const content = textarea.value.trim(); if (!content) return; const name = getUserName(); push(commentRef, { name, content, timestamp: Date.now() }); textarea.value = ""; });

onValue(commentRef, snapshot => { listEl.innerHTML = ""; const comments = snapshot.val(); if (comments) { Object.entries(comments).forEach(([id, comment]) => { const div = document.createElement("div"); div.className = "comment"; div.innerHTML = <strong>${comment.name}</strong><br/> <p>${comment.content}</p>; listEl.appendChild(div); }); } else { listEl.innerHTML = "<p>No comments yet.</p>"; } }); }

