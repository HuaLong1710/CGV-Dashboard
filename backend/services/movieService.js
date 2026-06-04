const supabase = require("../config/supabase");

/*bỏ dấu tiếng việt trong tên phim*/
function normalizeText(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*lấy tên phim từ database*/
let movieNameCache = [];
async function getMovieNames() {
  if (movieNameCache.length > 0) {
    return movieNameCache;
  }
  const { data, error } = await supabase
    .from("movie_stats")
    .select("movie_name");
  if (error) {
    console.log("getMovieNames error:", error);
    return [];
  }
  movieNameCache = data
    .map((item) => item.movie_name)
    .filter(Boolean);
  return movieNameCache;
}

async function extractMovieName(message) {
  const text = normalizeText(message);
  const movieNames = await getMovieNames();

  let bestMatch = "";
  let bestScore = 0;

  for (const movie of movieNames) {
    const normalizedMovie = normalizeText(movie);

    if (!normalizedMovie) continue;

    let score = 0;

    if (text.includes(normalizedMovie)) {
      score = normalizedMovie.length;
    } else {
      const words = normalizedMovie.split(" ");
      const matchedWords = words.filter((word) => text.includes(word));
      
      score = matchedWords.length;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = movie;
    }
  }
  return bestScore > 0 ? bestMatch : "";
}

module.exports = {
  normalizeText,
  getMovieNames,
  extractMovieName,
};