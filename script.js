let allQuestions = [];
let currentLearningQuestions = [];
let currentQuestionIndex = 0;
let learningScore = 0; // Represents gold coins
let questionsAnsweredCorrectlyFirstTry = 0; // To track perfect score for poster

// Updated User-Facing Messages for Kid-Friendliness
const KID_FRIENDLY_CORRECT_MESSAGE = "🎉 太棒了！答对了，得到一枚金币！💰";
const KID_FRIENDLY_INCORRECT_MESSAGE = "🤔 哎呀，再想一想，下次一定对！";
const KID_FRIENDLY_PERFECT_SCORE_MESSAGE = "🥳 哇！全部答对，你太厉害了！这是你的特别奖励！";
const KID_FRIENDLY_TRY_AGAIN_MESSAGE = "😊 继续加油！争取得到完美海报！";
const KID_FRIENDLY_POSTER_FULL_CONTENT_MESSAGE = "🎁 这是你的专属海报，要好好保存哦！";
// Other messages will be updated if this targeted approach works.

async function loadQuestions() {
    try {
        const response = await fetch('questions.jsonl');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        allQuestions = text.trim().split('\n').map(line => JSON.parse(line));
    } catch (error) {
        console.error("无法加载题目:", error);
        // Display error to user in Chinese
        const questionArea = document.getElementById('learningQuestionText');
        if (questionArea) {
            questionArea.textContent = '题目加载失败，请稍后再试。';
        }
    }
}

function displayLearningQuestion(question) {
    const questionTextElement = document.getElementById('learningQuestionText');
    const answerInputElement = document.getElementById('learningAnswerInput');

    if (questionTextElement && answerInputElement && question) {
        questionTextElement.textContent = question.question;
        answerInputElement.value = ''; // Clear previous answer
        document.getElementById('learningFeedback').textContent = ''; // Clear previous feedback
        document.getElementById('submitLearningAnswer').disabled = false;
        answerInputElement.disabled = false;
        answerInputElement.focus();
    } else {
        console.error("学习模式的HTML元素未找到或题目为空。");
        if(questionTextElement) questionTextElement.textContent = '题目显示出错。';
    }
}

async function startLearningMode() {
    await loadQuestions();
    // Ensure we have enough questions, or handle gracefully
    if (allQuestions.length === 0) {
        document.getElementById('learningQuestionText').textContent = '没有题目可供学习。';
        return;
    }
    currentLearningQuestions = allQuestions.slice(0, Math.min(10, allQuestions.length));
    currentQuestionIndex = 0;
    learningScore = 0;
    questionsAnsweredCorrectlyFirstTry = 0;
    updateLearningScoreDisplay();
    document.getElementById('learningQuestionArea').style.display = 'block';
    document.getElementById('rewardPoster').style.display = 'none';
    document.getElementById('endGameMessage').textContent = '';
    document.getElementById('learningFeedback').textContent = '';

    if (currentLearningQuestions.length > 0) {
        displayLearningQuestion(currentLearningQuestions[currentQuestionIndex]);
    } else {
        const questionTextElement = document.getElementById('learningQuestionText');
        if(questionTextElement) questionTextElement.textContent = '没有可用的题目。';
        const answerInputElement = document.getElementById('learningAnswerInput');
        const submitButton = document.getElementById('submitLearningAnswer');
        if (answerInputElement) answerInputElement.style.display = 'none';
        if (submitButton) submitButton.style.display = 'none';
    }
}

function updateLearningScoreDisplay() {
    const scoreElement = document.getElementById('learningScore');
    if (scoreElement) {
        scoreElement.textContent = `金币: ${learningScore}`; // Changed from 得分 to 金币
    }
}

function showLearningMode() {
    document.getElementById('learningMode').style.display = 'block';
    document.getElementById('practiceMode').style.display = 'none';
    startLearningMode(); 
}

function showPracticeMode() {
    document.getElementById('learningMode').style.display = 'none';
    document.getElementById('practiceMode').style.display = 'block';
    startPracticeMode(); // Initialize practice mode
}

// Initialize by showing neither mode, or one by default
document.addEventListener('DOMContentLoaded', () => {
    // By default, hide both modes. User clicks button to start.
    document.getElementById('learningMode').style.display = 'none';
    document.getElementById('practiceMode').style.display = 'none';

    const submitLearningAnswerButton = document.getElementById('submitLearningAnswer');
    if (submitLearningAnswerButton) {
        submitLearningAnswerButton.addEventListener('click', checkLearningAnswer);
    }

    const rewardPosterElement = document.getElementById('rewardPoster');
    if (rewardPosterElement) {
        rewardPosterElement.addEventListener('click', () => {
            alert(KID_FRIENDLY_POSTER_FULL_CONTENT_MESSAGE);
            // Optional: could also enlarge the image here
        });
    }

    const submitPracticeAnswerButton = document.getElementById('submitPracticeAnswer');
    if (submitPracticeAnswerButton) {
        submitPracticeAnswerButton.addEventListener('click', () => {
            // Placeholder for practice answer checking logic
            console.log("练习答案提交按钮被点击");
            checkPracticeAnswer(); // Will be fully implemented later
        });
    }
});

// --- Practice Mode Variables and Functions ---
let practiceQuestions = [];
let revealedBlocks = 0; // Track how many blocks are revealed
const TOTAL_BLOCKS = 30;
let activeBlockId = null; // To store which block's question is currently active

function setupPracticeGrid() {
    const gridContainer = document.getElementById('practiceImageGrid');
    const fullImage = document.getElementById('practiceFullImage');
    const fireworksOverlay = document.getElementById('fullImageFireworksOverlay');

    if (!gridContainer || !fullImage || !fireworksOverlay) {
        console.error("Practice grid, full image, or fireworks overlay element not found!");
        return;
    }

    gridContainer.innerHTML = ''; // Clear previous grid
    gridContainer.style.display = 'grid';
    fullImage.style.display = 'block';
    fireworksOverlay.style.display = 'none'; // Ensure fireworks overlay is hidden initially

    for (let i = 0; i < TOTAL_BLOCKS; i++) {
        const block = document.createElement('div');
        block.classList.add('practice-grid-block');
        block.dataset.blockId = i;
        // Initial styling is now primarily from CSS, but can be set here if needed
        block.addEventListener('click', () => handleBlockClick(i));
        gridContainer.appendChild(block);
    }
}

async function handleBlockClick(blockId) {
    const blockElement = document.querySelector(`.practice-grid-block[data-block-id="${blockId}"]`);
    // Do not proceed if block is already revealed (animating or hidden)
    if (!blockElement || blockElement.classList.contains('block-correct-animation') || blockElement.style.visibility === 'hidden') {
        return;
    }
    activeBlockId = blockId; // Store the ID of the clicked block

    if (practiceQuestions.length === 0) {
        await loadQuestions(); // Ensure allQuestions is populated
        // For practice mode, let's shuffle all available questions and use them
        // This allows more variety than just the first 10 learning questions
        practiceQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
    }

    if (practiceQuestions.length === 0) {
        document.getElementById('practiceQuestionText').textContent = '没有可用的练习题目。';
        return;
    }

    // Select a question. Use blockId to pick, wrapping around if not enough unique questions.
    const questionForBlock = practiceQuestions[blockId % practiceQuestions.length];
    displayPracticeQuestion(questionForBlock);

    // Hide the question area in learning mode if it's visible
    // document.getElementById('learningQuestionArea').style.display = 'none'; // This might not be needed if modes are exclusive
    document.getElementById('practiceQuestionArea').style.display = 'block';
}

function displayPracticeQuestion(question) {
    const questionTextElement = document.getElementById('practiceQuestionText');
    const answerInputElement = document.getElementById('practiceAnswerInput');
    const practiceFeedbackElement = document.getElementById('practiceFeedback');
    const practiceExplanationElement = document.getElementById('practiceExplanationArea');


    if (questionTextElement && answerInputElement && question) {
        questionTextElement.textContent = question.question;
        answerInputElement.value = '';
        practiceFeedbackElement.textContent = '';
        practiceExplanationElement.innerHTML = ''; // Clear previous explanation
        answerInputElement.disabled = false;
        document.getElementById('submitPracticeAnswer').disabled = false;
        answerInputElement.focus();
    } else {
        console.error("练习模式的HTML元素未找到或题目为空。");
        if(questionTextElement) questionTextElement.textContent = '题目显示出错。';
    }
}

async function startPracticeMode() {
    if (allQuestions.length === 0) {
        await loadQuestions(); 
    }
    practiceQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
    
    revealedBlocks = 0;
    activeBlockId = null;
    setupPracticeGrid(); // This will also hide fireworksOverlay
    document.getElementById('practiceQuestionArea').style.display = 'none'; 
    document.getElementById('practiceFeedback').textContent = '';
    document.getElementById('practiceExplanationArea').innerHTML = '';
    document.getElementById('practiceFullImage').style.opacity = '1'; 
    
    const blocks = document.querySelectorAll('.practice-grid-block');
    blocks.forEach(block => {
        block.style.visibility = 'visible';
        block.style.opacity = '1';
        block.classList.remove('block-correct-animation'); // Remove animation class if present
        // Reset background to default from CSS, or remove inline style if it was set
        block.style.backgroundColor = ''; // Let CSS handle default background
    });
     document.getElementById('practiceImageGrid').style.display = 'grid'; // Ensure grid is visible
}

function checkPracticeAnswer() {
    const answerInputElement = document.getElementById('practiceAnswerInput');
    const feedbackElement = document.getElementById('practiceFeedback');
    const explanationElement = document.getElementById('practiceExplanationArea');
    const userAnswer = answerInputElement.value.trim();

    if (userAnswer === "" || activeBlockId === null) {
        feedbackElement.textContent = "请先点击一个方块并输入答案！";
        explanationElement.innerHTML = '';
        return;
    }
    
    const currentQuestion = practiceQuestions[activeBlockId % practiceQuestions.length];
    const blockElement = document.querySelector(`.practice-grid-block[data-block-id="${activeBlockId}"]`);

    if (userAnswer == currentQuestion.answer) {
        feedbackElement.textContent = "正确！";
        feedbackElement.style.color = 'green';
        explanationElement.innerHTML = ''; // Clear any previous explanation
        answerInputElement.disabled = true; // Disable input after correct answer
        document.getElementById('submitPracticeAnswer').disabled = true; // Disable button

        if (blockElement) {
            blockElement.classList.add('block-correct-animation');
            // The animation itself will make it visibility: hidden at the end.
            // Listen for animation end to truly count it as revealed for game logic,
            // or set a timeout if preferred for simplicity.
            // For now, we'll assume animation duration is short and count immediately.
        }
        revealedBlocks++;
        
        // Hide question area after a short delay to allow user to see "Correct!"
        setTimeout(() => {
            document.getElementById('practiceQuestionArea').style.display = 'none';
        }, 1000);


        if (revealedBlocks === TOTAL_BLOCKS) {
            feedbackElement.textContent = "恭喜你完成了所有题目！"; // Should be shown in a more prominent place
            explanationElement.innerHTML = '';
            document.getElementById('practiceImageGrid').style.display = 'none'; // Hide grid
            
            const fireworksOverlay = document.getElementById('fullImageFireworksOverlay');
            if (fireworksOverlay) {
                fireworksOverlay.style.display = 'block';
                // If using JS-driven particles for fullImageFireworksOverlay, trigger them here
                // For CSS only, the animation starts when display is set to block.
                // Ensure it resets if mode is re-entered.
                setTimeout(() => { // Hide fireworks after some time
                    if (fireworksOverlay) fireworksOverlay.style.display = 'none';
                }, 3000); // Match or exceed CSS animation duration
            }
        }
    } else {
        feedbackElement.textContent = "😢 不正确";
        feedbackElement.style.color = 'red';
        let explanationText = `正确答案是：${currentQuestion.answer}。`;
        if (currentQuestion.explanation) {
            explanationText += `解释：${currentQuestion.explanation}`;
        }
        explanationElement.innerHTML = explanationText;
        answerInputElement.focus(); // Let user try again
        answerInputElement.select(); // Select current text for easy replacement
    }
    // Do not clear input for incorrect answer, allow retry.
    // answerInputElement.value = ''; 
}


// --- End of Practice Mode Functions ---

function checkLearningAnswer() {
    const answerInputElement = document.getElementById('learningAnswerInput');
    const feedbackElement = document.getElementById('learningFeedback');
    const submitButton = document.getElementById('submitLearningAnswer');
    const userAnswer = answerInputElement.value.trim();

    if (userAnswer === "") {
        feedbackElement.textContent = "请输入答案！"; // Please enter an answer!
        return;
    }

    submitButton.disabled = true; // Disable button during processing
    answerInputElement.disabled = true; // Disable input during processing

    const currentQuestion = currentLearningQuestions[currentQuestionIndex];
    let isCorrect = false;

    if (userAnswer == currentQuestion.answer) { // Using == for potential type coercion (e.g. "5" vs 5)
        isCorrect = true;
        learningScore++;
        questionsAnsweredCorrectlyFirstTry++; // Assuming first try for simplicity here, could be more complex
        updateLearningScoreDisplay();
        feedbackElement.textContent = KID_FRIENDLY_CORRECT_MESSAGE;
        feedbackElement.style.color = 'green';
    } else {
        feedbackElement.textContent = KID_FRIENDLY_INCORRECT_MESSAGE;
        feedbackElement.style.color = 'red';
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentLearningQuestions.length) {
            displayLearningQuestion(currentLearningQuestions[currentQuestionIndex]);
        } else {
            // End of questions
            document.getElementById('learningQuestionArea').style.display = 'none';
            const endGameMessageElement = document.getElementById('endGameMessage');
            const rewardPosterElement = document.getElementById('rewardPoster');

            // Updated reward logic: Perfect score on all available questions grants reward.
            if (questionsAnsweredCorrectlyFirstTry === currentLearningQuestions.length && currentLearningQuestions.length > 0) {
                endGameMessageElement.textContent = KID_FRIENDLY_PERFECT_SCORE_MESSAGE;
                rewardPosterElement.style.display = 'block';
            } else { // All questions done, but not a perfect score
                endGameMessageElement.textContent = KID_FRIENDLY_TRY_AGAIN_MESSAGE;
                rewardPosterElement.style.display = 'none';
            }
            feedbackElement.textContent = ''; // Clear question feedback
        }
    }, 1500); // Delay for 1.5 seconds before next question or end message
}
