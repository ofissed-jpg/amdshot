// Элементы
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const charNoSpaceCount = document.getElementById('charNoSpaceCount');
const wordCount = document.getElementById('wordCount');
const sentenceCount = document.getElementById('sentenceCount');
const paragraphCount = document.getElementById('paragraphCount');
const analyzeBtn = document.getElementById('analyzeBtn');
const highlightBtn = document.getElementById('highlightBtn');
const clearBtn = document.getElementById('clearBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const sidebarContent = document.getElementById('sidebarContent');
const minRepeatInput = document.getElementById('minRepeat');
const minWordLengthInput = document.getElementById('minWordLength');
const subscriptionModal = document.getElementById('subscriptionModal');
const subscribeBtn = document.getElementById('subscribeBtn');
const continueBtn = document.getElementById('continueBtn');

// Проверка подписки
if (!localStorage.getItem('subscriptionShown')) {
    subscriptionModal.classList.remove('hidden');
}

subscribeBtn.addEventListener('click', () => {
    localStorage.setItem('subscriptionShown', 'true');
});

continueBtn.addEventListener('click', () => {
    subscriptionModal.classList.add('hidden');
    localStorage.setItem('subscriptionShown', 'true');
});

// Режим подсветки
let highlightMode = false;

// Обновление статистики
function updateStats() {
    const text = textInput.textContent;
    const length = text.length;
    const noSpaceLength = text.replace(/\s/g, '').length;
    const trimmedText = text.trim();
    
    // Слова
    const words = trimmedText.length > 0 ? trimmedText.split(/\s+/).filter(word => word.length > 0) : [];
    
    // Предложения
    const sentences = trimmedText.length > 0 ? trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0) : [];
    
    // Абзацы
    const paragraphs = trimmedText.length > 0 ? trimmedText.split(/\n+/).filter(p => p.trim().length > 0) : [];
    
    animateValue(charCount, parseInt(charCount.textContent), length);
    animateValue(charNoSpaceCount, parseInt(charNoSpaceCount.textContent), noSpaceLength);
    animateValue(wordCount, parseInt(wordCount.textContent), words.length);
    animateValue(sentenceCount, parseInt(sentenceCount.textContent), sentences.length);
    animateValue(paragraphCount, parseInt(paragraphCount.textContent), paragraphs.length);
}

// Анимация чисел
function animateValue(element, start, end) {
    element.classList.remove('updated');
    element.textContent = end;
    setTimeout(() => {
        element.classList.add('updated');
        setTimeout(() => {
            element.classList.remove('updated');
        }, 300);
    }, 10);
}

// Подсветка латиницы
function applyHighlight() {
    if (!highlightMode) return;
    
    const scrollTop = textInput.scrollTop;
    const text = textInput.textContent;
    const highlightedText = text.replace(/[a-zA-Z]/g, '<span class="highlight-latin">$&</span>');
    textInput.innerHTML = highlightedText;
    textInput.scrollTop = scrollTop;
}

function removeHighlight() {
    const scrollTop = textInput.scrollTop;
    const text = textInput.textContent;
    textInput.innerHTML = text;
    textInput.scrollTop = scrollTop;
}

// Переключение подсветки
highlightBtn.addEventListener('click', () => {
    highlightMode = !highlightMode;
    highlightBtn.classList.toggle('active');
    
    if (highlightMode) {
        applyHighlight();
    } else {
        removeHighlight();
    }
});

// Очистка текста
clearBtn.addEventListener('click', () => {
    if (textInput.textContent.trim() && !confirm('Вы уверены, что хотите очистить текст?')) {
        return;
    }
    textInput.textContent = '';
    updateStats();
    textInput.focus();
});

// Обновление при вводе
textInput.addEventListener('input', () => {
    updateStats();
    if (highlightMode) {
        applyHighlight();
    }
});

// Сохранение текста
textInput.addEventListener('input', () => {
    localStorage.setItem('savedText', textInput.textContent);
});

// Загрузка сохраненного текста
const savedText = localStorage.getItem('savedText');
if (savedText && savedText !== 'undefined') {
    textInput.textContent = savedText;
    updateStats();
}

// Анализ повторов
function analyzeWords() {
    const text = textInput.textContent.trim();
    if (!text) {
        sidebarContent.innerHTML = '<p class="empty-message">Введите текст для анализа повторяющихся слов</p>';
        return;
    }
    
    const minRepeat = parseInt(minRepeatInput.value) || 2;
    const minWordLength = parseInt(minWordLengthInput.value) || 1;
    
    // Разбиваем текст на фразы
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    // Создаем n-граммы (фразы из нескольких слов)
    const phrases = {};
    
    for (let n = minWordLength; n <= 5; n++) {
        for (let i = 0; i <= words.length - n; i++) {
            const phrase = words.slice(i, i + n).join(' ');
            const cleanPhrase = phrase.replace(/[.,!?;:()"'\[\]{}]/g, '');
            
            if (cleanPhrase.length > 0) {
                phrases[cleanPhrase] = (phrases[cleanPhrase] || 0) + 1;
            }
        }
    }
    
    // Фильтруем по минимальному количеству повторов
    const repeatedPhrases = Object.entries(phrases)
        .filter(([phrase, count]) => count >= minRepeat && phrase.split(' ').length >= minWordLength)
        .sort((a, b) => b[1] - a[1]);
    
    if (repeatedPhrases.length === 0) {
        sidebarContent.innerHTML = `<p class="empty-message">Фраз из ${minWordLength} слов с ${minRepeat}+ повторами не найдено</p>`;
        return;
    }
    
    // Отображаем результаты
    sidebarContent.innerHTML = '';
    repeatedPhrases.forEach(([phrase, count]) => {
        const wordCountInPhrase = phrase.split(' ').length;
        const item = document.createElement('div');
        item.className = 'word-item';
        item.setAttribute('data-phrase', phrase);
        item.setAttribute('data-count', count);
        item.setAttribute('data-words', wordCountInPhrase);
        item.innerHTML = `
            <span class="word-text">${phrase}</span>
            <span class="word-count">${count}×</span>
        `;
        
        // Копирование при клике
        item.addEventListener('click', () => {
            const textToCopy = `"${phrase}" - ${count}× (${wordCountInPhrase === 1 ? 'слово' : wordCountInPhrase + ' слов'})`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                item.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                item.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    item.style.background = '';
                    item.style.transform = '';
                }, 200);
            });
        });
        
        sidebarContent.appendChild(item);
    });
}

// Открытие/закрытие сайдбара
analyzeBtn.addEventListener('click', () => {
    analyzeWords();
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Обновление анализа при изменении фильтров
minRepeatInput.addEventListener('input', () => {
    if (sidebar.classList.contains('active')) {
        analyzeWords();
    }
});

minWordLengthInput.addEventListener('input', () => {
    if (sidebar.classList.contains('active')) {
        analyzeWords();
    }
});

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearBtn.click();
    }
    
    if (e.key === 'Escape') {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
});

// Theme switching functionality
(function() {
    const themes = ['dark', 'light', 'purple', 'ocean', 'sunset', 'orange', 'forest', 'rose', 'midnight'];
    const fonts = ['default', 'roboto', 'opensans', 'montserrat', 'lato'];
    const defaultTheme = 'dark';
    const defaultFont = 'default';
    
    // Get saved theme and font from localStorage or use defaults
    let currentTheme = localStorage.getItem('theme') || defaultTheme;
    let currentFont = localStorage.getItem('font') || defaultFont;
    
    // Apply theme
    function applyTheme(theme) {
        // Remove all theme classes
        themes.forEach(t => document.body.classList.remove('theme-' + t));
        // Add new theme class
        document.body.classList.add('theme-' + theme);
        localStorage.setItem('theme', theme);
    }
    
    // Apply font
    function applyFont(font) {
        // Remove all font classes
        fonts.forEach(f => document.body.classList.remove('font-' + f));
        // Add new font class
        if (font !== 'default') {
            document.body.classList.add('font-' + font);
        }
        localStorage.setItem('font', font);
    }
    
    // Initialize theme and font
    applyTheme(currentTheme);
    applyFont(currentFont);
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    const themeMenu = document.getElementById('themeMenu');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            themeMenu.classList.toggle('active');
            // Close font menu if open
            const fontMenu = document.getElementById('fontMenu');
            if (fontMenu) {
                fontMenu.classList.remove('active');
            }
        });
    }
    
    // Font toggle button
    const fontToggle = document.getElementById('fontToggle');
    const fontMenu = document.getElementById('fontMenu');
    
    if (fontToggle) {
        fontToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            fontMenu.classList.toggle('active');
            // Close theme menu if open
            if (themeMenu) {
                themeMenu.classList.remove('active');
            }
        });
    }
    
    // Close menus when clicking outside
    document.addEventListener('click', function(e) {
        if (themeMenu && !themeMenu.contains(e.target) && e.target !== themeToggle) {
            themeMenu.classList.remove('active');
        }
        if (fontMenu && !fontMenu.contains(e.target) && e.target !== fontToggle) {
            fontMenu.classList.remove('active');
        }
    });
    
    // Theme selection
    const themeItems = document.querySelectorAll('.theme-item');
    themeItems.forEach(function(item) {
        item.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            applyTheme(theme);
            themeMenu.classList.remove('active');
        });
    });
    
    // Font selection
    const fontItems = document.querySelectorAll('.font-item');
    fontItems.forEach(function(item) {
        item.addEventListener('click', function() {
            const font = this.getAttribute('data-font');
            applyFont(font);
            fontMenu.classList.remove('active');
        });
    });
})();
