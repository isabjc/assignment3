const difficulties = {
  easy: { pairs: 4, time: 60 },
  medium: { pairs: 8, time: 90 },
  hard: { pairs: 12, time: 120 },
};

let firstCard, secondCard;
let matchedPairs = 0;
let totalClicks = 0;
let timer;
let timeLeft;
let uniqueSet = new Set();

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function getUniquePokemon(count) {
  const maxId = 1000;
  const set = new Set();
  while (set.size < count) {
    set.add(Math.floor(Math.random() * maxId) + 1);
  }

  const promises = Array.from(set).map(async (id) => {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    uniqueSet.add(data.name);
    return { name: data.name, image: data.sprites.front_default };
  });

  return await Promise.all(promises);
}

function updateStatus(pairs, clicks) {
  document.getElementById('status').textContent = `Clicks: ${clicks} | Matched: ${matchedPairs} / ${pairs}`;
}

function setTimer(duration) {
  timeLeft = duration;
  const timerDisplay = document.getElementById('timer');
  timerDisplay.textContent = `Time Left: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 1000);
}

function endGame(won) {
  document.querySelectorAll(".card").forEach(card => card.removeEventListener("click", handleCardClick));
  alert(won ? "You Win!" : "Time's up! Game Over.");
}

function resetGame() {
  clearInterval(timer);
  document.getElementById("game-board").innerHTML = "";
  document.getElementById("timer").textContent = "";
  document.getElementById("status").textContent = "";
  matchedPairs = 0;
  totalClicks = 0;
  uniqueSet.clear();
  firstCard = secondCard = undefined;
}

async function setupGame() {
  resetGame();
  const difficulty = document.getElementById("difficulty").value;
  const theme = document.getElementById("theme").value;
  document.body.classList.toggle("dark", theme === "dark");

  const { pairs, time } = difficulties[difficulty];
  const pokemons = await getUniquePokemon(pairs);
  const cards = pokemons.flatMap(p => [ { ...p }, { ...p } ]);
  shuffle(cards);

  const gameBoard = document.getElementById("game-board");
  const cols = Math.ceil(Math.sqrt(cards.length));
  gameBoard.style.gridTemplateColumns = `repeat(${cols}, 80px)`;

  cards.forEach((poke) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.name = poke.name;
    card.innerHTML = `
      <div class="inner">
        <div class="front_face"><img src="${poke.image}" /></div>
        <div class="back_face"><img src="/back.webp" width="50px" height="50px"</div>
      </div>
    `;
    card.addEventListener("click", handleCardClick);
    gameBoard.appendChild(card);
  });

  setTimer(time);
  updateStatus(pairs, totalClicks);
}

function handleCardClick(e) {
  const card = e.currentTarget;
  if (card.classList.contains("flip") || secondCard) return;

  card.classList.add("flip");
  totalClicks++;
  const totalPairs = difficulties[document.getElementById("difficulty").value].pairs;
  updateStatus(totalPairs, totalClicks);

  if (!firstCard) {
    firstCard = card;
  } else {
    secondCard = card;
    const name1 = firstCard.dataset.name;
    const name2 = secondCard.dataset.name;

    if (name1 === name2) {
      matchedPairs++;
      firstCard.removeEventListener("click", handleCardClick);
      secondCard.removeEventListener("click", handleCardClick);
      firstCard = secondCard = undefined;
      if (matchedPairs === totalPairs) {
        clearInterval(timer);
        endGame(true);
      }
    } else {
      setTimeout(() => {
        firstCard.classList.remove("flip");
        secondCard.classList.remove("flip");
        firstCard = secondCard = undefined;
      }, 1000);
    }
  }
}

document.getElementById("start").addEventListener("click", setupGame);
document.getElementById("reset").addEventListener("click", resetGame);
document.getElementById("power-up").addEventListener("click", () => {
  document.querySelectorAll(".card").forEach(card => card.classList.add("flip"));
  setTimeout(() => {
    document.querySelectorAll(".card").forEach(card => card.classList.remove("flip"));
  }, 1500);
});
