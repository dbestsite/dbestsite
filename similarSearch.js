// similarSearch.js
(async function () {
  const path = window.location.pathname;
  const match = path.match(/^\/s\+(.+)/);
  if (!match) return;

  const query = decodeURIComponent(match[1]).toLowerCase();
  const container = document.getElementById("results");

  try {
    const response = await fetch("/videos.json");
    const videos = await response.json();

    const filtered = videos.filter(v => {
      const inTitle = v.title.toLowerCase().includes(query);
      const inTags = v.tags.some(tag => tag.toLowerCase().includes(query));
      return inTitle || inTags;
    });

    if (filtered.length === 0) {
      container.innerHTML = "<p>No similar results found.</p>";
      return;
    }

    filtered.forEach(video => {
      const div = document.createElement("div");
      div.className = "video";
      div.innerHTML = `
        <div><strong>${highlight(video.title, query)}</strong></div>
        <div>Tags: ${highlight(video.tags.join(", "), query)}</div>
        <a href="post.html?uId=${video.postId}" style="color: cyan;">View Post</a>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "<p>Error loading data.</p>";
    console.error(err);
  }

  function highlight(text, word) {
    const re = new RegExp(`(${word})`, "gi");
    return text.replace(re, '<span class="highlight">$1</span>');
  }
})();
