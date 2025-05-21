let allVideos = [];

async function loadVideos() {
  try {
    const res = await fetch("/videos.json");
    allVideos = await res.json();

    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("s");

    if (searchQuery) {
      document.getElementById("search").value = searchQuery;
      renderVideos(filterVideos(searchQuery));
    } else {
      renderVideos(allVideos);
    }
  } catch (err) {
    console.error("Error loading videos.json", err);
    document.getElementById("video-container").innerHTML = "<p>Failed to load videos.</p>";
  }
}

function filterVideos(keyword) {
  const query = keyword.toLowerCase().trim();

  return allVideos.filter(video => {
    const inTitle = video.title.toLowerCase().includes(query);
    const inTags = video.tags.join(", ").toLowerCase().includes(query);
    return inTitle || inTags;
  });
}

function renderVideos(videos) {
  const container = document.getElementById("video-container");
  container.innerHTML = "";

  if (!videos.length) {
    container.innerHTML = "<p>No matching videos found.</p>";
    return;
  }

  videos.forEach(video => {
    const div = document.createElement("div");
    div.className = "video-card";
    div.innerHTML = `
      <h3>${video.title}</h3>
      <p>Tags: ${video.tags.join(", ")}</p>
      <a href="post.html?uId=${video.postId}">Watch</a>
    `;
    container.appendChild(div);
  });
}

// Only triggers when Enter is pressed in the search box
document.getElementById("search").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const query = this.value.trim();
    if (query) {
      window.location.search = "?s=" + encodeURIComponent(query);
    }
  }
});

window.addEventListener("DOMContentLoaded", loadVideos);
