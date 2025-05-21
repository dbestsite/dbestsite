let allVideos = [];

async function loadVideos() {
  try {
    const res = await fetch("/videos.json");
    allVideos = await res.json();

    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("s");

    if (searchQuery) {
      document.getElementById("search").value = searchQuery;
      filterVideos(searchQuery);
    } else {
      displayVideos(allVideos);
    }
  } catch (err) {
    console.error("Error loading videos.json", err);
    document.getElementById("video-container").innerHTML = "<p style='color:white;'>Failed to load videos.</p>";
  }
}

function displayVideos(videos) {
  const container = document.getElementById("video-container");
  container.innerHTML = "";

  if (videos.length === 0) {
    container.innerHTML = "<p style='color:white;'>No matching videos found.</p>";
    return;
  }

  videos.forEach(video => {
    const div = document.createElement("div");
    div.className = "video";
    div.innerHTML = `
      <h3>${video.title}</h3>
      <p>Tags: ${video.tags.join(", ")}</p>
      <a href="post.html?uId=${video.postId}">Watch</a>
    `;
    container.appendChild(div);
  });
}

function filterVideos(keyword) {
  const query = keyword.toLowerCase().trim();

  const filtered = allVideos.filter(video => {
    const inTitle = video.title.toLowerCase().includes(query);
    const inTags = video.tags.join(", ").toLowerCase().includes(query);
    return inTitle || inTags;
  });

  displayVideos(filtered);
}

document.getElementById("search").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const query = this.value.trim();
    if (query) {
      window.location.search = "?s=" + encodeURIComponent(query);
    }
  }
});

// Load videos when page loads
window.addEventListener("DOMContentLoaded", loadVideos);
