export function setupRatingSystem(postId, initialVotes = 0, initialSum = 0) {
  const container = document.getElementById(`rating-${postId}`);
  if (!container) return;

  container.innerHTML = '';

  const starsDiv = document.createElement('div');
  starsDiv.style.userSelect = "none";
  container.appendChild(starsDiv);

  const infoDiv = document.createElement('div');
  infoDiv.style.marginTop = '5px';
  infoDiv.style.color = '#ccc';
  infoDiv.style.fontSize = '0.9rem';
  container.appendChild(infoDiv);

  const stars = [];
  let currentRating = parseInt(localStorage.getItem(`rating-${postId}`)) || 0;

  function updateUI(avg = null, votes = null) {
    stars.forEach((star, idx) => {
      star.textContent = idx < currentRating ? '★' : '☆';
      star.style.pointerEvents = (idx + 1 === currentRating) ? 'none' : 'auto';
    });

    if (avg !== null && votes !== null) {
      infoDiv.textContent = `Average: ${avg.toFixed(1)} ★ (${votes} vote${votes > 1 ? 's' : ''})`;
    } else {
      infoDiv.textContent = "No ratings yet";
    }
  }

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = '☆';
    star.style.cursor = 'pointer';
    star.style.fontSize = '2rem';
    star.style.color = '#00ff99';
    star.style.marginRight = '3px';

    star.addEventListener('click', () => {
      if (i === currentRating) return;

      const oldRating = currentRating;
      currentRating = i;
      localStorage.setItem(`rating-${postId}`, i);

      const ratingRef = ref(db, `ratings/${postId}`);

      runTransaction(ratingRef, current => {
        if (current === null) {
          return {
            votes: initialVotes + 1,
            sum: initialSum + i
          };
        }
        let updated = { ...current };
        if (oldRating > 0) {
          updated.sum = updated.sum - oldRating + i;
        } else {
          updated.votes += 1;
          updated.sum += i;
        }
        return updated;
      }).catch(console.error);
    });

    starsDiv.appendChild(star);
    stars.push(star);
  }

  const ratingRef = ref(db, `ratings/${postId}`);

  get(ratingRef).then(snapshot => {
    if (!snapshot.exists() && initialVotes && initialSum) {
      set(ratingRef, { votes: initialVotes, sum: initialSum });
    }
  });

  onValue(ratingRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.votes && data.sum) {
      updateUI(data.sum / data.votes, data.votes);
    } else {
      updateUI();
    }
  });

  // Set initial UI
  updateUI();
}
