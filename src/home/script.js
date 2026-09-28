document.addEventListener('DOMContentLoaded', () => {
    const randomChar = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
    };

    const animateText = (element, text, interval, duration, callback) => {
        let index = 0;
        const spans = [];

        const revealNextCharacter = () => {
            const char = text[index];
            const span = document.createElement('span');
            span.textContent = char;
            element.appendChild(span);
            spans.push(span);

            const originalChar = span.textContent;
            let iteration = 0;

            const charIntervalId = setInterval(() => {
                span.textContent = randomChar();
                iteration++;

                if (iteration > duration) {
                    clearInterval(charIntervalId);
                    span.textContent = originalChar;
                    index++;

                    if (index < text.length) {
                        revealNextCharacter();
                    } else {
                        if (callback) {
                            callback();
                        }
                    }
                }
            }, interval);
        };

        revealNextCharacter();
    };

    animateText(document.getElementById('sophie'), 'Σοφία', 30, 5);
});

function copyEmail() {
    navigator.clipboard.writeText('sophie.allen10@proton.me').then(() => {
        const tooltipText = document.getElementById('tooltipText');
        tooltipText.style.visibility = 'visible';
        tooltipText.style.opacity = '1';
        setTimeout(() => {
            tooltipText.style.visibility = 'hidden';
            tooltipText.style.opacity = '0';
        }, 2000); // Hide the tooltip after 2 seconds
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}
