import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

  container.innerHTML = '';

  // Create stars container
  const starsDiv = document.createElement('div');
  starsDiv.style.userSelect = "none";
  container.appendChild(starsDiv);

  // Create info div for average and votes
  const infoDiv = document.createElement('div');
  infoDiv.style.marginTop = '5px';
  infoDiv.style.color = '#ccc';
  infoDiv.style.fontSize = '0.9rem';
  container.appendChild(infoDiv);

  const stars = [];

  // Create 5 stars
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = '☆';
    star.style.cursor = 'pointer';
    star.style.fontSize = '2rem';
    star.style.color = '#00ff99';
    star.style.marginRight = '3px';

    star.addEventListener('click', () => {
      if (currentRating === i) return; // prevent clicking same star

      const ratingRef = ref(db, `ratings/${postId}`);

      runTransaction(ratingRef, current => {
        if (current === null) {
          return {
            votes: initialVotes + 1,
            sum: initialSum + i
          };
        }

        const newVotes = currentRating ? current.votes : current.votes + 1;
        const newSum = current.sum - currentRating + i;

        return {
          votes: newVotes,
          sum: newSum
        };
      }).then(() => {
        currentRating = i;
        localStorage.setItem(userRatingKey, i);
        updateStars(currentRating);
      }).catch(console.error);
    });

    starsDiv.appendChild(star);
    stars.push(star);
  }

  const ratingRef = ref(db, `ratings/${postId}`);

  // Initialize Firebase data if not exists
get(ratingRef).then(snapshot => {
    if (!snapshot.exists() && initialVotes && initialSum) {
      set(ratingRef, { votes: initialVotes, sum: initialSum });
    }
  });

  // Listen for changes to update UI
  onValue(ratingRef, (snapshot) => {
    const data = snapshot.val();

    if (data && data.votes && data.sum) {
      const avg = data.sum / data.votes;
      const rounded = Math.round(avg);
      stars.forEach((star, idx) => {
        star.textContent = idx < rounded ? '★' : '☆';
      });

      infoDiv.textContent = `Average: ${avg.toFixed(1)} ★ (${data.votes} vote${data.votes > 1 ? 's' : ''})`;
    } else {
      // no data yet
      stars.forEach(s => s.textContent = '☆');
      infoDiv.textContent = "No ratings yet";
    }
  });

  function updateStars(rating) {
    stars.forEach((star, idx) => {
      star.textContent = idx < rating ? '★' : '☆';
    });
  }

  // Apply stored rating visually on load
  if (currentRating > 0) {
    updateStars(currentRating);
  }
}
