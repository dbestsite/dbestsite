import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase config
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
const db = getDatabase(app);


  export function setupRatingSystem(postId, initialVotes = 0, initialSum = 0) {
  const container = document.getElementById(`rating-${postId}`);
  if (!container) return;

  // ... your existing star HTML and event setup ...

  const ratingRef = ref(db, `ratings/${postId}`);

  get(ratingRef).then(snapshot => {
    if (!snapshot.exists() && initialVotes && initialSum) {
      set(ratingRef, { votes: initialVotes, sum: initialSum }).then(() => {
        updateDisplay({ votes: initialVotes, sum: initialSum });
      });
    } else {
      updateDisplay(snapshot.val());
    }
  });

  container.innerHTML = '';
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = '☆';
    star.style.cursor = 'pointer';
    star.style.fontSize = '2rem';
    star.addEventListener('click', () => {
      set(ref(db, `ratings/${postId}`), {
        rating: i,
        timestamp: Date.now()
      });
    });
    container.appendChild(star);
    stars.push(star);
  }

  const ratingRef = ref(db, `ratings/${postId}`);
  onValue(ratingRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.rating) {
      stars.forEach((s, i) => {
        s.textContent = i < data.rating ? '★' : '☆';
      });
    }
  });
}
