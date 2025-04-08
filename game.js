const questions = [
    {question: "ما هو أكبر كوكب في النظام الشمسي؟", options: ["الأرض", "المشتري", "الزهرة", "المريخ"], correct: 1},
    {question: "ما هو لون السماء في النهار؟", options: ["أزرق", "أخضر", "أحمر", "أصفر"], correct: 0},
    // يمكن إضافة المزيد من الأسئلة هنا ...
];

let currentEpisode = 1; // الحلقة الحالية
let currentLevel = 0;   // المرحلة الحالية
let currentQuestionIndex = 0;
let timeLeft = 30;      // الوقت المخصص لكل سؤال (بالثواني)
let timerInterval;

const startBtn = document.getElementById("start-btn");
const gameContainer = document.querySelector(".game-container");
const questionText = document.getElementById("question-text");
const options = document.querySelectorAll(".option");
const levelDisplay = document.getElementById("level");
const episodeDisplay = document.getElementById("episode");
const timerText = document.getElementById("timer-text");
const videoAd = document.querySelector(".video-ad");
const watchAdButton = document.getElementById("watch-ad");
const progressBar = document.getElementById("progress");

startBtn.addEventListener("click", () => {
    document.querySelector(".landing-page").classList.add("hidden");
    gameContainer.classList.remove("hidden");
    loadQuestion();
    startTimer();
});

function loadQuestion() {
    if (currentLevel < 10) {
        const question = questions[currentQuestionIndex];
        questionText.textContent = question.question;
        options.forEach((button, index) => {
            button.textContent = question.options[index];
            button.onclick = () => checkAnswer(index, question.correct);
        });
        levelDisplay.textContent = currentLevel + 1;
        episodeDisplay.textContent = currentEpisode;
        updateProgress();
    } else {
        nextEpisode();
    }
}

function startTimer() {
    timeLeft = 30;
    timerText.textContent = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("انتهى الوقت! يمكنك مشاهدة الفيديو.");
            videoAd.style.display = 'block';
        }
    }, 1000);
}

function checkAnswer(selected, correct) {
    clearInterval(timerInterval);
    if (selected === correct) {
        alert("إجابة صحيحة!");
        currentQuestionIndex++;
        currentLevel++;
        loadQuestion();
    } else {
        alert("إجابة خاطئة! يمكنك مشاهدة الفيديو لتجاوز السؤال.");
        videoAd.style.display = 'block';
    }
}

function updateProgress() {
    const progress = (currentLevel / 10) * 100;
    progressBar.style.width = `${progress}%`;
}

function nextEpisode() {
    if (currentEpisode < 100) {
        currentEpisode++;
        currentLevel = 0;
        currentQuestionIndex = (currentEpisode - 1) * 10;
        loadQuestion();
    } else {
        alert("لقد أكملت اللعبة بنجاح!");
    }
}

watchAdButton.onclick = () => {
    alert("شكرًا لمشاهدتك الفيديو! تم تخطي السؤال.");
    videoAd.style.display = 'none';
    currentLevel++;
    loadQuestion();
};

// تحميل السؤال الأول
loadQuestion();
