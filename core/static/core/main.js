document.addEventListener('DOMContentLoaded', function() {
    
    //accessibility toolbar
    const body = document.getElementById('page-body');
    const contrastToggle = document.getElementById('contrast-toggle');
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const ttsButton = document.getElementById('tts-button');

    if (contrastToggle) {
        contrastToggle.addEventListener('click', () => { body.classList.toggle('high-contrast'); });
    }
    if (fontIncrease) fontIncrease.addEventListener('click', () => { changeFontSize(1); });
    if (fontDecrease) fontDecrease.addEventListener('click', () => { changeFontSize(-1); });

    function changeFontSize(step) {
        const currentSize = parseFloat(getComputedStyle(body).getPropertyValue('font-size'));
        body.style.fontSize = (currentSize + step) + 'px';
    }

    if (ttsButton) {
        ttsButton.addEventListener('click', () => {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;
            const selection = window.getSelection().toString();
            const textToSpeak = selection.trim().length > 0 ? selection : mainContent.innerText;
            const synth = window.speechSynthesis;
            if (synth.speaking) { synth.cancel(); return; }
            if (textToSpeak) {
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'en-IN';
                synth.speak(utterance);
            }
        });
    }

    //SPEECH-TO-ISL WITH KARAOKE HIGHLIGHTING
    const islButton = document.getElementById("isl-button");
    const islModal = document.getElementById("isl-modal");
    const islCloseButton = document.getElementById("isl-close-button");
    const islVideoPlayer = document.getElementById("isl-video-player");
    const islTranscription = document.getElementById("isl-transcription");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !islButton) {
        console.error("Speech Recognition not supported.");
        if (islButton) islButton.style.display = 'none';
        return; 
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';

    //DICTIONARIES
    const islWordMap = {
        "hello": "Hello.mp4", "help": "Help.mp4", "thank you": "Thank You.mp4",
        "bye": "Bye.mp4", "can": "Can.mp4", "from": "From.mp4",
        "good": "Good.mp4" 
    };

    const islAlphabetMap = {
        'a': 'A.mp4', 'b': 'B.mp4', 'c': 'C.mp4', 'd': 'D.mp4', 
        'e': 'E.mp4', 'f': 'F.mp4', 'g': 'G.mp4', 'h': 'H.mp4', 
        'i': 'I.mp4', 'j': 'J.mp4', 'k': 'K.mp4', 'l': 'L.mp4', 
        'm': 'M.mp4', 'n': 'N.mp4', 'o': 'O.mp4', 'p': 'P.mp4', 
        'q': 'Q.mp4', 'r': 'R.mp4', 's': 'S.mp4', 't': 'T.mp4', 
        'u': 'U.mp4', 'v': 'V.mp4', 'w': 'W.mp4', 'x': 'X.mp4', 
        'y': 'Y.mp4', 'z': 'Z.mp4'
    };

    //this now stores Objects: { video:'path',spanId:'html-id' }
    let playQueue = []; 

    function playNextItem() {
        // remove ALL previous highlights
        document.querySelectorAll('.isl-active-text').forEach(el => {
            el.classList.remove('isl-active-text');
        });

        if (playQueue.length > 0) {
            const currentItem = playQueue.shift(); // Get next item
            
            //highlight the specific text for this video
            const textSpan = document.getElementById(currentItem.spanId);
            if (textSpan) {
                textSpan.classList.add('isl-active-text');
            }

            //play the video
            islVideoPlayer.src = window.STATIC_ISL_PATH + currentItem.video;
            islVideoPlayer.play();
        }
    }

    islVideoPlayer.onended = function() {
        playNextItem();
    };

    if (islCloseButton) {
        islCloseButton.addEventListener("click", () => {
            islModal.style.display = "none";
            islVideoPlayer.pause();
            playQueue = [];
        });
    }

    //MAIN LOGIC

    islButton.addEventListener("click", () => {
        islButton.textContent = "Listening...";
        playQueue = [];
        recognition.start();
    });

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        
        //reset the display area
        islTranscription.innerHTML = "You said: "; 
        
        const words = transcript.split(" ");

        //loop through each word to build HTML and Queue
        words.forEach((word, wordIndex) => {
            
            //create a unique ID base for this word
            const wordId = `word-${wordIndex}`;

            // CHECK1:Whole Word Match (eg"hello")
            if (islWordMap[word]) {
                //create a span for the whole word
                const span = document.createElement('span');
                span.id = wordId;
                span.innerText = word + " "; //added space
                islTranscription.appendChild(span);

                //add to Queue
                playQueue.push({
                    video: islWordMap[word],
                    spanId: wordId
                });
            } 
            
            //CHECK2:fingerspelling (eg"anushka")
            else {
                //create a container for the word
                const wordContainer = document.createElement('span');
                wordContainer.style.whiteSpace = "nowrap"; //keep letters together
                
                //loop through letters
                for (let i = 0; i < word.length; i++) {
                    const letter = word[i];
                    
                    if (islAlphabetMap[letter]) {
                        //create a span for JUST this letter
                        const letterSpan = document.createElement('span');
                        letterSpan.id = `${wordId}-char-${i}`; // Unique ID
                        letterSpan.innerText = letter;
                        wordContainer.appendChild(letterSpan);

                        //add to Queue (Highlight this specific letter)
                        playQueue.push({
                            video: islAlphabetMap[letter],
                            spanId: `${wordId}-char-${i}`
                        });
                    }
                }
                //add a space after the fingerspelled word
                const spaceSpan = document.createElement('span');
                spaceSpan.innerText = " ";
                wordContainer.appendChild(spaceSpan);
                
                islTranscription.appendChild(wordContainer);
            }
        });

        if (playQueue.length > 0) {
            islModal.style.display = "block";
            playNextItem();
        } else {
            islTranscription.innerHTML += "<br>(No signs found)";
            islModal.style.display = "block";
        }

        islButton.textContent = "Speak (ISL)";
    };

    recognition.onerror = function(event) {
        console.error("Speech error:", event.error);
        islButton.textContent = "Speak (ISL)";
    };
});

// RAG Chatbot code
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const fullscreenBtn = document.getElementById('chat-fullscreen-btn');
    const chatPanel = document.getElementById('chat-panel');
    const textInput = document.getElementById('chat-text-input');
    const uploadBtn = document.getElementById('chat-upload-btn');
    const pdfUploadInput = document.getElementById('chat-pdf-upload');

    // 1. Open/Close Logic
    function toggleChat() {
        const isOpen = chatPanel.classList.contains('open');
        
        if (isOpen) {
            // CLOSE CHAT
            chatPanel.classList.remove('open');
            
            // BUG FIX: Ensure fullscreen is removed when closing!
            chatPanel.classList.remove('fullscreen');
            fullscreenBtn.innerText = '⛶'; 
            
            chatPanel.setAttribute('hidden', 'true');
            toggleBtn.setAttribute('aria-expanded', 'false');
            chatPanel.setAttribute('aria-modal', 'false');
            toggleBtn.focus(); 
        } else {
            // OPEN CHAT
            chatPanel.classList.add('open');
            chatPanel.removeAttribute('hidden');
            toggleBtn.setAttribute('aria-expanded', 'true');
            textInput.focus(); 
        }
    }

    // 2. Fullscreen Logic
    function toggleFullscreen() {
        chatPanel.classList.toggle('fullscreen');
        const isFullscreen = chatPanel.classList.contains('fullscreen');
        chatPanel.setAttribute('aria-modal', isFullscreen ? 'true' : 'false');
        
        fullscreenBtn.innerText = isFullscreen ? '🗗' : '⛶'; 
        textInput.focus();
    }

    // Event Listeners
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    uploadBtn.addEventListener('click', () => {
        pdfUploadInput.click();
    });

    // 3. SMARTER WCAG Escape Key Listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatPanel.classList.contains('open')) {
            // If it's fullscreen, just exit fullscreen first
            if (chatPanel.classList.contains('fullscreen')) {
                toggleFullscreen();
            } else {
                // If it's a normal side-panel, close it completely
                toggleChat();
            }
        }
    });
});