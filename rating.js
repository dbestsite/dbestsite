<!-- Firebase App (from your config) -->
<script type="module">
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const analytics = getAnalytics(app);

// Unique post ID
const postId = "video1"; // change per video/post

const ratingRef = ref(db, 'ratings/' + postId);

// DOM
const stars = document.querySelectorAll(".star");
const avgDisplay = document.getElementById("avg-rating");

let userRated = false;

// Handle star click
stars.forEach((star, index) => {
  star.addEventListener("click", () => {
    if (userRated) return;
    const rating = index + 1;
    set(ratingRef, {
      rating: rating,
      timestamp: Date.now()
    });
    userRated = true;
    updateStars(rating);
  });
});

// Display stars visually
function updateStars(value) {
  stars.forEach((s, i) => {
    s.textContent = i < value ? "★" : "☆";
  });
}

// Listen to rating value from Firebase
onValue(ratingRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    updateStars(data.rating);
    avgDisplay.textContent = `Rating: ${data.rating} / 5`;
  }
});
</script>
