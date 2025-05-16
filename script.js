
  import {
    getFirestore, collection, addDoc, getDocs, query,
    where, orderBy, serverTimestamp, doc, updateDoc, increment
  } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

  import {
    getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged
  } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

  const db = getFirestore();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  let currentPostId = null;
  let currentUser = null;

  const popup = document.getElementById("comment-popup");
  const goBackBtn = document.getElementById("go-back");
  const commentForm = document.getElementById("comment-form");
  const commentInput = document.getElementById("comment-input");
  const commentSection = document.getElementById("comment-section");

  // Listen for popup button clicks
  document.addEventListener("click", (e) => {
    if (e.target.matches(".open-comments-btn")) {
      currentPostId = e.target.dataset.postId;
      openComments(currentPostId);
    }
  });

  // Close popup
  goBackBtn.onclick = () => {
    popup.classList.add("hidden");
    commentSection.innerHTML = "";
  };

  // Load and display comments
  async function openComments(postId) {
    popup.classList.remove("hidden");
    commentSection.innerHTML = "<p>Loading...</p>";
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("timestamp", "asc")
    );
    const snap = await getDocs(q);
    const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    commentSection.innerHTML = "";
    const commentTree = buildTree(comments);
    commentTree.forEach(c => renderComment(c, commentSection));
  }

  // Build nested comment tree
  function buildTree(comments, parentId = null) {
    return comments
      .filter(c => c.parentId === parentId)
      .map(c => ({ ...c, replies: buildTree(comments, c.id) }));
  }

  // Render one comment and its replies
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
      openComments(currentPostId);
    };

    div.querySelector(".like-btn").onclick = async (e) => {
      const btn = e.target;
      const id = btn.dataset.id;
      if (hasLiked(id)) return;
      await updateDoc(doc(db, "comments", id), {
        likes: increment(1)
      });
      saveLike(id);
      openComments(currentPostId);
    };

    if (comment.replies) {
      comment.replies.forEach(r => renderComment(r, div));
    }
  }

  // Submit top-level comment
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
    openComments(currentPostId);
  };

  // --- USER MANAGEMENT ---
  async function getUserName() {
    if (currentUser) return currentUser;

    // Check Firebase Auth
    const authUser = auth.currentUser;
    if (authUser) {
      currentUser = authUser.displayName || authUser.email;
      return currentUser;
    }

    // Check localStorage
    const saved = localStorage.getItem("commentName");
    if (saved) {
      currentUser = saved;
      return saved;
    }

    // Prompt for name
    const name = prompt("Enter your name to comment:");
    if (!name) throw new Error("Name required");
    localStorage.setItem("commentName", name);
    currentUser = name;
    return name;
  }

  // --- LIKE TRACKING ---
  function hasLiked(commentId) {
    const liked = JSON.parse(localStorage.getItem("likedComments") || "[]");
    return liked.includes(commentId);
  }

  function saveLike(commentId) {
    const liked = JSON.parse(localStorage.getItem("likedComments") || "[]");
    liked.push(commentId);
    localStorage.setItem("likedComments", JSON.stringify(liked));
  }

  // Optional: Auto sign in with Google
  // Uncomment if you want auto prompt
  // signInWithPopup(auth, provider).catch(console.error);

