const offlineResponses = [
    "Aku ada di sini mendengarkanmu. Ceritakan lebih jauh agar aku bisa memahami yang kamu rasakan.",
    "Terima kasih sudah percaya untuk berbagi. Kamu tidak sendirian dalam perasaan ini.",
    "Itu pasti tidak mudah. Ambil waktu sejenak, lalu ceritakan apa yang paling berat di pikiranmu.",
    "Perasaanmu sepenuhnya valid. Apa yang sedang kamu butuhkan saat ini?",
    "Kadang berbagi saja sudah membantu meringankan. Aku siap menyimak, pelan-pelan saja.",
    "Aku mendengar ketulusanmu. Apa hal kecil yang bisa membuatmu merasa sedikit lebih tenang?",
    "Terima kasih sudah jujur tentang perasaanmu. Langkah ini sangat berarti.",
    "Aku bisa merasakan betapa itu menguras energi. Kamu berhak untuk ditenangkan.",
    "Kita bisa hadapi perasaan ini bersama. Ceritakan hal apa yang memicu emosi tersebut.",
    "Aku di sini kapan pun kamu siap melanjutkan cerita." 
];

const emergencyKeywords = {
    'bunuh diri': 'Aku sangat peduli denganmu. Situasi ini penting. Tolong hubungi 119 ext. 8 sekarang atau chat @into.the.light.id di Instagram. Kamu berharga dan pantas mendapat bantuan langsung.',
    'mati': 'Aku sangat peduli denganmu. Situasi ini penting. Tolong hubungi 119 ext. 8 sekarang atau chat @into.the.light.id di Instagram. Kamu berharga dan pantas mendapat bantuan langsung.',
    'akhiri hidup': 'Aku sangat peduli denganmu. Tolong segera hubungi 119 ext. 8 atau seseorang yang kamu percaya. Kamu tidak sendiri.',
    'capek hidup': 'Aku mendengar betapa lelahnya kamu. Pertimbangkan untuk menghubungi profesional di 119 ext. 8 atau orang dewasa yang kamu percayai.',
    'nyakiti diri': 'Aku peduli denganmu. Menyakiti diri bukan solusi. Tolong hubungi 119 ext. 8 atau orang yang kamu percaya secepatnya.'
};

class NaraChat {
    constructor() {
        this.apiKey = window.GEMINI_API_KEY;
        this.typingTimeout = null;
        this.bindEvents();
        this.autoResizeTextarea();
    }

    bindEvents() {
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('endSessionBtn').addEventListener('click', () => this.showEndSessionModal());
        document.getElementById('cancelEndBtn').addEventListener('click', () => this.hideEndSessionModal());
        document.getElementById('confirmEndBtn').addEventListener('click', () => this.endSession());

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hideEndSessionModal();
                }
            });
        });
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.addEventListener('input', function handleResize() {
            this.style.height = 'auto';
            this.style.height = `${this.scrollHeight}px`;
        });
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) {
            return;
        }

        this.addMessage(message, 'user');
        input.value = '';
        input.style.height = 'auto';
        this.setInputState(false);
        this.showTypingIndicator();

        const response = await this.generateNaraResponse(message);

        this.hideTypingIndicator();
        this.addMessage(response, 'nara');
        this.setInputState(true);
        this.scrollToBottom();
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const timestamp = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const avatarInitial = sender === 'nara' ? 'N' : 'K';
        const avatarClass = sender === 'nara' ? 'nara-avatar' : 'nara-avatar user-avatar';
        const avatarHtml = `<div class="${avatarClass}" style="width: 35px; height: 35px; font-size: 1rem;">${avatarInitial}</div>`;

        const safeText = this.formatMessage(text);

        if (sender === 'nara') {
            messageDiv.innerHTML = `
                ${avatarHtml}
                <div class="message-content">
                    ${safeText}
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${safeText}
                    <div class="message-time">${timestamp}</div>
                </div>
                ${avatarHtml}
            `;
        }

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    async generateNaraResponse(userMessage) {
        const normalized = userMessage.toLowerCase();

        for (const [keyword, response] of Object.entries(emergencyKeywords)) {
            if (normalized.includes(keyword)) {
                return response;
            }
        }

        if (normalized.includes('terima kasih') || normalized.includes('makasih')) {
            return 'Sama-sama. Aku senang bisa menemanimu. Kapan pun butuh ruang aman lagi, langsung saja sapa aku.';
        }

        if (normalized.includes('baik') && normalized.includes('hari')) {
            return 'Ikut senang mendengarnya. Ceritakan hal kecil apa yang membuat harimu terasa lebih ringan.';
        }

        if (!this.apiKey || this.apiKey === 'MASUKKAN_API_KEY_GEMINI_ANDA_DI_SINI') {
            return this.getOfflineResponse();
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

        const payload = {
            contents: [{
                parts: [{
                    text: `Kamu adalah Nara, teman bicara virtual yang empatik, hangat, dan suportif untuk remaja. Gunakan bahasa Indonesia yang lembut dan relevan. Validasi perasaan, ajukan pertanyaan reflektif, dan jangan memberi diagnosis atau saran medis. Jangan gunakan emoji. Pesan berikut berasal dari pengguna: "${userMessage}"`
                }]
            }],
            generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 140,
                topP: 0.9
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Gemini API returned ${response.status}`);
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('Empty response');
            }

            return text.trim();
        } catch (error) {
            console.error('Error memanggil Gemini API:', error);
            return 'Sepertinya koneksiku sedang kurang stabil. Boleh kita lanjutkan percakapan secara perlahan sambil menunggu? Ceritakan saja, aku mendengarkan.';
        }
    }

    getOfflineResponse() {
        const index = Math.floor(Math.random() * offlineResponses.length);
        return offlineResponses[index];
    }

    formatMessage(text) {
        const safeText = this.escapeHtml(text);
        return safeText.split(/\n+/).map(line => `<p>${line}</p>`).join('');
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.setAttribute('aria-hidden', 'false');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'none';
        indicator.setAttribute('aria-hidden', 'true');
    }

    setInputState(enabled) {
        const input = document.getElementById('messageInput');
        const button = document.getElementById('sendButton');

        input.disabled = !enabled;
        button.disabled = !enabled;

        if (enabled) {
            input.focus();
        }
    }

    scrollToBottom() {
        const container = document.querySelector('.chat-container');
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }

    showEndSessionModal() {
        document.getElementById('endSessionModal').style.display = 'flex';
        document.getElementById('endSessionModal').setAttribute('aria-hidden', 'false');
    }

    hideEndSessionModal() {
        document.getElementById('endSessionModal').style.display = 'none';
        document.getElementById('endSessionModal').setAttribute('aria-hidden', 'true');
    }

    endSession() {
        this.hideEndSessionModal();
        const sessionEndedModal = document.getElementById('sessionEndedModal');
        sessionEndedModal.style.display = 'flex';
        sessionEndedModal.setAttribute('aria-hidden', 'false');
        this.setInputState(false);
        document.getElementById('endSessionBtn').disabled = true;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NaraChat();
});
