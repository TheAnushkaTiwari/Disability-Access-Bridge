console.log("🚀 THE NEW CODE IS DEFINITELY RUNNING!");
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Main JS Loaded and Ready!");

    // =========================================
    // 1. ACCESSIBILITY TOOLBAR
    // =========================================
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

    // TTS (Screen Reader) Fix
    if (ttsButton) {
        ttsButton.addEventListener('click', () => {
            console.log("🔊 Speak button clicked!");
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;
            
            const selection = window.getSelection().toString();
            const textToSpeak = selection.trim().length > 0 ? selection : mainContent.innerText;
            const synth = window.speechSynthesis;
            
            if (synth.speaking) { 
                console.log("Stopping speech...");
                synth.cancel(); 
                return; 
            }
            
            if (textToSpeak) {
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'en-IN';
                synth.speak(utterance);
                console.log("Starting speech...");
            }
        });
    }

    // =========================================
    // 2. SPEECH-TO-ISL
    // =========================================
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


    
    // =========================================
    // 3. RAG CHATBOT UI & API
    // =========================================
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const closeBtn = document.getElementById('chat-close-btn');
    const fullscreenBtn = document.getElementById('chat-fullscreen-btn');
    const chatPanel = document.getElementById('chat-panel');
    const textInput = document.getElementById('chat-text-input');
    const uploadBtn = document.getElementById('chat-upload-btn');
    const pdfUploadInput = document.getElementById('chat-pdf-upload');
    const chatLog = document.getElementById('chat-log');
    const sendBtn = document.getElementById('chat-send-btn');

    function toggleChat() {
        if (!chatPanel) return;
        const isOpen = chatPanel.classList.contains('open');
        
        if (isOpen) {
            chatPanel.classList.remove('open', 'fullscreen'); 
            fullscreenBtn.innerText = '⛶'; 
            chatPanel.setAttribute('hidden', 'true');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.focus(); 
        } else {
            chatPanel.classList.add('open');
            chatPanel.removeAttribute('hidden');
            toggleBtn.setAttribute('aria-expanded', 'true');
            textInput.focus(); 
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            console.log("💬 Chat button clicked!");
            toggleChat();
        });
    } else {
        console.error("❌ Chat toggle button not found in HTML!");
    }

    if (closeBtn) closeBtn.addEventListener('click', toggleChat);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => {
        chatPanel.classList.toggle('fullscreen');
        fullscreenBtn.innerText = chatPanel.classList.contains('fullscreen') ? '🗗' : '⛶'; 
        textInput.focus();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatPanel && chatPanel.classList.contains('open')) {
            chatPanel.classList.contains('fullscreen') ? fullscreenBtn.click() : toggleChat();
        }
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    function appendMessage(sender, text) {
        if (!chatLog) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', sender === 'user' ? 'user-message' : 'bot-message');
        msgDiv.innerText = text;
        chatLog.appendChild(msgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    if (uploadBtn) uploadBtn.addEventListener('click', () => pdfUploadInput.click());

    // Handle PDF Upload API
    // =========================================
    // FOOLPROOF PDF UPLOAD API
    // =========================================
    if (pdfUploadInput) {
        // Using .onchange completely overwrites any old/duplicate ghost listeners!
        pdfUploadInput.onchange = async function(event) {
            console.log("📁 --- UPLOAD PROCESS STARTED ---");
            
            // The absolute safest way to grab the exact file
            const file = event.target.files[0]; 
            
            if (!file) {
                console.log("❌ Upload cancelled by user.");
                return;
            }

            console.log("✅ File successfully captured:", file.name);
            
            // Now we know for a fact file.name exists!
            appendMessage('bot', `Uploading and analyzing "${file.name}"... please wait.`);
            
            const formData = new FormData();
            formData.append('pdf_file', file);

            try {
                const response = await fetch('/api/upload-pdf/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken },
                    body: formData
                });
                
                const result = await response.json();
                console.log("🖥️ Server Response:", result);
                
                if (result.status === 'success') {
                    appendMessage('bot', '✅ PDF successfully processed! You can now ask me questions about it.');
                } else {
                    appendMessage('bot', '❌ Error processing PDF: ' + result.message);
                }
            } catch (error) {
                console.error("🌐 Network error during upload:", error);
                appendMessage('bot', '❌ Network error during upload.');
            }
            
            // Clear the input 
            event.target.value = ''; 
        };
    }

    // =========================================
    // SEND MESSAGE API
    // =========================================
    async function sendMessage() {
        const message = textInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        textInput.value = '';
        
        appendMessage('bot', 'Thinking...');
        const typingIndicator = chatLog.lastChild;

        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify({ message: message })
            });
            const result = await response.json();
            
            chatLog.removeChild(typingIndicator);
            appendMessage('bot', result.status === 'success' ? result.answer : '❌ Error: ' + result.message);
        } catch (error) {
            chatLog.removeChild(typingIndicator);
            appendMessage('bot', '❌ Connection error. Please try again.');
        }
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (textInput) {
        textInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') sendMessage(); 
        });
    }
});