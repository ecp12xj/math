console.log('script.js started'); // Task: Log script start

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
// For global error message:
const GLOBAL_LOAD_ERROR_MESSAGE = '错误：无法加载题目文件 (questions.jsonl)。请确保文件存在并且格式正确。';


async function loadQuestions() {
    console.log('Attempting to load questions.jsonl...');
    const globalMessageArea = document.getElementById('globalMessageArea');
    try {
        console.log('Fetching questions.jsonl...'); // Verified: filename is 'questions.jsonl'
        const response = await fetch('questions.jsonl');
        console.log('Fetch response:', response.ok, response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const responseText = await response.text();
        console.log('Response text received (first 100 chars):', responseText.substring(0, 100));
        
        const lines = responseText.trim().split('\n');
        console.log('Split into lines (count):', lines.length);

        if (responseText.trim() === "") { // Handle completely empty or whitespace-only file
            console.warn("questions.jsonl is empty or contains only whitespace.");
            allQuestions = [];
        } else {
            allQuestions = lines.map((line, index) => {
                console.log(`Attempting to parse line ${index + 1}:`, line);
                try {
                    if (line.trim() === "") return null; // Skip empty lines if any
                    return JSON.parse(line);
                } catch (e) {
                    console.error('Error parsing line:', line, e);
                    // Optionally, could throw e to make loadQuestions fail entirely on one bad line,
                    // or return null / skip to allow partial loading. Current behavior: returns null.
                    return null; 
                }
            }).filter(q => q !== null); // Filter out lines that failed to parse or were empty
        }
        
        console.log("Successfully loaded and parsed questions. Count:", allQuestions.length);
        if (globalMessageArea) globalMessageArea.textContent = ''; // Clear global error message on success
        
    } catch (error) {
        console.error('Critical error loading questions:', error);
        allQuestions = [];
        practiceQuestions = []; // Ensure this is also cleared
        
        if (globalMessageArea) {
            globalMessageArea.textContent = GLOBAL_LOAD_ERROR_MESSAGE;
        }
        // Fallback to older error display if global one isn't there for some reason
        const questionArea = document.getElementById('learningQuestionText') || document.getElementById('practiceQuestionText');
        if (questionArea && (!globalMessageArea || globalMessageArea.textContent === '')) {
             // Using KID_FRIENDLY_NO_QUESTIONS_LOADED_ERROR if defined, otherwise the old one
            questionArea.textContent = typeof KID_FRIENDLY_NO_QUESTIONS_LOADED_ERROR !== 'undefined' ? KID_FRIENDLY_NO_QUESTIONS_LOADED_ERROR : '题目加载失败，请稍后再试。';
        // This part is now integrated into the main catch block of loadQuestions
        // to use the globalMessageArea if available.
    } // Closes: if (questionArea && ...)
} // Closes: catch (error)
} // ADDED: Closes: async function loadQuestions()

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
        const element = document.getElementById('learningQuestionText');
        // Use KID_FRIENDLY_NO_QUESTIONS_AVAILABLE if defined, otherwise the old one
        if(element) element.textContent = typeof KID_FRIENDLY_NO_QUESTIONS_AVAILABLE !== 'undefined' ? KID_FRIENDLY_NO_QUESTIONS_AVAILABLE : '沒有题目可供学习。';
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

console.log('Defining showLearningMode'); // Task: Log function definition
function showLearningMode() {
    document.getElementById('learningMode').style.display = 'block';
    document.getElementById('practiceMode').style.display = 'none';
    startLearningMode(); 
}

console.log('Defining showPracticeMode'); // Task: Log function definition
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

    if (practiceQuestions.length === 0) { // This check might be redundant if startPracticeMode always populates it or loadQuestions handles it
        const element = document.getElementById('practiceQuestionText');
        if(element) element.textContent = typeof KID_FRIENDLY_NO_QUESTIONS_AVAILABLE !== 'undefined' ? KID_FRIENDLY_NO_QUESTIONS_AVAILABLE : '沒有可用的练习题目。';
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

    // Removed duplicate declaration of userAnswer here

    if (userAnswer === "" || activeBlockId === null) {
        feedbackElement.textContent = typeof KID_FRIENDLY_CLICK_BLOCK_PROMPT !== 'undefined' ? KID_FRIENDLY_CLICK_BLOCK_PROMPT : "请先点击一个方块并输入答案！";
        explanationElement.innerHTML = '';
        return;
    }
    
    const currentQuestion = practiceQuestions[activeBlockId % practiceQuestions.length];
    const blockElement = document.querySelector(`.practice-grid-block[data-block-id="${activeBlockId}"]`);

    if (userAnswer == currentQuestion.answer) {
        feedbackElement.textContent = typeof KID_FRIENDLY_BLOCK_REVEALED_MESSAGE !== 'undefined' ? KID_FRIENDLY_BLOCK_REVEALED_MESSAGE : "正确！";
        feedbackElement.style.color = 'green';
        explanationElement.innerHTML = ''; 
        answerInputElement.disabled = true; 
        document.getElementById('submitPracticeAnswer').disabled = true; 

        if (blockElement) {
            blockElement.classList.add('block-correct-animation');
        }
        revealedBlocks++;
        
        setTimeout(() => {
            document.getElementById('practiceQuestionArea').style.display = 'none';
        }, 1000);


        if (revealedBlocks === TOTAL_BLOCKS) {
            const practiceEndMessage = document.getElementById('practiceFeedback'); 
            if(practiceEndMessage) practiceEndMessage.textContent = typeof KID_FRIENDLY_ALL_BLOCKS_REVEALED_MESSAGE !== 'undefined' ? KID_FRIENDLY_ALL_BLOCKS_REVEALED_MESSAGE : "恭喜你完成了所有题目！";
            
            document.getElementById('practiceImageGrid').style.display = 'none'; 
            
            const fireworksOverlay = document.getElementById('fullImageFireworksOverlay');
            if (fireworksOverlay) {
                fireworksOverlay.style.display = 'block';
                setTimeout(() => { 
                    if (fireworksOverlay) fireworksOverlay.style.display = 'none';
                }, 3000); 
            }
        }
    } else {
        feedbackElement.textContent = typeof KID_FRIENDLY_TRY_AGAIN_PRACTICE_MESSAGE !== 'undefined' ? KID_FRIENDLY_TRY_AGAIN_PRACTICE_MESSAGE : "😢 不正确";
        feedbackElement.style.color = 'red';
        let explanationText = `${typeof KID_FRIENDLY_EXPLANATION_PREFIX !== 'undefined' ? KID_FRIENDLY_EXPLANATION_PREFIX : "正确答案是："}<strong style="color: #0077cc;">${currentQuestion.answer}</strong>。`;
        if (currentQuestion.explanation) {
            explanationText += `<br>${typeof KID_FRIENDLY_EXPLANATION_DETAIL_PREFIX !== 'undefined' ? KID_FRIENDLY_EXPLANATION_DETAIL_PREFIX : "解释："}${currentQuestion.explanation}`;
        }
        explanationElement.innerHTML = explanationText;
        answerInputElement.focus(); 
        answerInputElement.select(); 
    }
}


// --- End of Practice Mode Functions ---

function checkLearningAnswer() {
    const answerInputElement = document.getElementById('learningAnswerInput');
    const feedbackElement = document.getElementById('learningFeedback');
    const submitButton = document.getElementById('submitLearningAnswer');
    const userAnswer = answerInputElement.value.trim();

    if (userAnswer === "") {
        feedbackElement.textContent = typeof KID_FRIENDLY_ENTER_ANSWER_PROMPT !== 'undefined' ? KID_FRIENDLY_ENTER_ANSWER_PROMPT : "请输入答案！"; 
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
