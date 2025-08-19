document.addEventListener('DOMContentLoaded', function() {
    const body = document.getElementById('page-body');
    const contrastToggle = document.getElementById('contrast-toggle');
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const ttsButton = document.getElementById('tts-button');

    // 1. High Contrast Toggle
    contrastToggle.addEventListener('click', () => {
        body.classList.toggle('high-contrast');
    });

    // 2. Font Size Controls
    fontIncrease.addEventListener('click', () => {
        changeFontSize(1);
    });

    fontDecrease.addEventListener('click', () => {
        changeFontSize(-1);
    });

    function changeFontSize(step) {
        const currentSize = parseFloat(getComputedStyle(body).getPropertyValue('font-size'));
        const newSize = currentSize + step;
        body.style.fontSize = newSize + 'px';
    }

    // 3. Text-to-Speech (TTS)
    ttsButton.addEventListener('click', () => {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Prioritize selected text, otherwise read the whole page
        const selection = window.getSelection().toString();
        const textToSpeak = selection.trim().length > 0 ? selection : mainContent.innerText;
        
        const synth = window.speechSynthesis;
        if (synth.speaking) {
            synth.cancel();
            return;
        }

        if (textToSpeak) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'en-IN'; // Indian English for better pronunciation
            synth.speak(utterance);
        }
    });
});
