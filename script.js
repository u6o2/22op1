// متغيرات التطبيق
let pdfDoc = null;
let currentPage = 1;
let totalPages = 1;
let extractedText = '';
let availableQuestions = 0;
let generatedQuestions = [];
let maxQuestions = 0;

// عناصر DOM
const pdfInput = document.getElementById('pdfInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const pdfViewer = document.getElementById('pdfViewer');
const pageInfo = document.getElementById('pageInfo');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const numQuestionsSlider = document.getElementById('numQuestions');
const questionCountEl = document.getElementById('questionCount');
const generateBtn = document.getElementById('generateBtn');
const questionsContainer = document.getElementById('questionsContainer');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');
const availableQuestionsEl = document.getElementById('availableQuestions');
const generatedCountEl = document.getElementById('generatedCount');
const maxQuestionsEl = document.getElementById('maxQuestions');

// حدث تحميل الملف
selectFileBtn.addEventListener('click', () => {
    pdfInput.click();
});

pdfInput.addEventListener('change', handleFileSelect);

uploadArea.addEventListener('click', () => {
    pdfInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--secondary)';
    uploadArea.style.backgroundColor = 'rgba(74, 111, 165, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.backgroundColor = 'rgba(74, 111, 165, 0.05)';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.backgroundColor = 'rgba(74, 111, 165, 0.05)';
    
    if (e.dataTransfer.files.length) {
        pdfInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

// معالجة اختيار الملف
function handleFileSelect() {
    if (pdfInput.files.length === 0) return;
    
    const file = pdfInput.files[0];
    
    if (file.type !== 'application/pdf') {
        alert('الرجاء اختيار ملف PDF فقط');
        return;
    }
    
    // عرض معلومات الملف
    fileInfo.innerHTML = `
        <p><i class="fas fa-check-circle"></i> تم تحميل الملف: ${file.name} (${formatFileSize(file.size)})</p>
    `;
    fileInfo.classList.add('show');
    
    // تحميل وعرض PDF
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        // تحميل مستند PDF باستخدام pdf.js
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            totalPagesEl.textContent = totalPages;
            currentPage = 1;
            
            // استخراج النص من PDF
            extractTextFromPDF(pdf);
            
            // عرض الصفحة الأولى
            renderPage(currentPage);
        }).catch(function(error) {
            console.error('خطأ في تحميل PDF:', error);
            alert('حدث خطأ في تحميل ملف PDF. الرجاء التأكد من أن الملف صالح.');
        });
    };
    
    fileReader.readAsArrayBuffer(file);
}

// استخراج النص من PDF
async function extractTextFromPDF(pdf) {
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
    }
    
    extractedText = fullText;
    
    // حساب عدد الأسئلة المتاحة (نسبة من عدد الكلمات)
    const wordCount = extractedText.split(/\s+/).length;
    availableQuestions = Math.min(Math.floor(wordCount / 50), 50); // سؤال واحد لكل 50 كلمة تقريبًا
    availableQuestionsEl.textContent = availableQuestions;
    maxQuestions = availableQuestions;
    maxQuestionsEl.textContent = maxQuestions;
    
    // تحديث الحد الأقصى للشريط المنزلق
    numQuestionsSlider.max = Math.min(availableQuestions, 20);
    
    // تحديث عدد الأسئلة المحددة
    updateQuestionCount();
}

// عرض صفحة PDF
function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);
        
        currentPageEl.textContent = pageNum;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        page.render(renderContext);
    });
}

// التنقل بين الصفحات
prevPageBtn.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage--;
    renderPage(currentPage);
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage >= totalPages) return;
    currentPage++;
    renderPage(currentPage);
});

// تحديث عدد الأسئلة المحددة
numQuestionsSlider.addEventListener('input', updateQuestionCount);

function updateQuestionCount() {
    const count = numQuestionsSlider.value;
    questionCountEl.textContent = count;
}

// إنشاء الأسئلة
generateBtn.addEventListener('click', generateQuestions);

function generateQuestions() {
    if (!extractedText || extractedText.trim().length === 0) {
        alert('الرجاء تحميل ملف PDF أولاً');
        return;
    }
    
    const numQuestions = parseInt(numQuestionsSlider.value);
    
    if (numQuestions > availableQuestions) {
        alert(`لا يمكن إنشاء أكثر من ${availableQuestions} أسئلة. الرجاء تقليل العدد.`);
        return;
    }
    
    // الحصول على أنواع الأسئلة المحددة
    const selectedTypes = Array.from(document.querySelectorAll('input[name="questionType"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedTypes.length === 0) {
        alert('الرجاء اختيار نوع واحد على الأقل من الأسئلة');
        return;
    }
    
    const difficulty = document.getElementById('difficulty').value;
    
    // توليد أسئلة عشوائية (في التطبيق الحقيقي سيتم استخدام الذكاء الاصطناعي)
    generatedQuestions = [];
    
    // تقسيم النص إلى جمل
    const sentences = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // إذا لم يكن هناك جمل كافية، استخدم أجزاء من النص
    let textParts = sentences;
    if (textParts.length < numQuestions) {
        textParts = extractedText.split(/\s+/).reduce((parts, word, index) => {
            const partIndex = Math.floor(index / 10);
            if (!parts[partIndex]) parts[partIndex] = [];
            parts[partIndex].push(word);
            return parts;
        }, []).map(words => words.join(' '));
    }
    
    // إنشاء الأسئلة
    for (let i = 0; i < numQuestions && i < textParts.length; i++) {
        const text = textParts[i].trim();
        if (text.length < 10) continue;
        
        // اختيار نوع عشوائي من الأنواع المحددة
        const type = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
        
        let question;
        
        switch(type) {
            case 'multiple':
                question = generateMultipleChoiceQuestion(text, i+1, difficulty);
                break;
            case 'truefalse':
                question = generateTrueFalseQuestion(text, i+1, difficulty);
                break;
            case 'short':
                question = generateShortAnswerQuestion(text, i+1, difficulty);
                break;
        }
        
        if (question) {
            generatedQuestions.push(question);
        }
    }
    
    // تحديث واجهة المستخدم
    updateGeneratedCount();
    displayQuestions();
    exportBtn.disabled = false;
}

// توليد سؤال اختيار من متعدد
function generateMultipleChoiceQuestion(text, index, difficulty) {
    const keywords = text.split(/\s+/).filter(word => word.length > 4);
    const correctAnswer = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : 'المعلومة الصحيحة';
    
    // إنشاء خيارات خاطئة
    const wrongAnswers = [
        'إجابة خاطئة 1',
        'إجابة خاطئة 2',
        'إجابة خاطئة 3'
    ];
    
    // خلط الخيارات
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    return {
        id: index,
        type: 'multiple',
        text: `بناءً على النص: "${text.substring(0, 100)}..." ما هو الإجابة الصحيحة؟`,
        options: allAnswers,
        correctAnswer: correctAnswer,
        difficulty: difficulty
    };
}

// توليد سؤال صح/خطأ
function generateTrueFalseQuestion(text, index, difficulty) {
    const isTrue = Math.random() > 0.5;
    
    return {
        id: index,
        type: 'truefalse',
        text: `هل هذه العبارة صحيحة أم خاطئة: "${text.substring(0, 80)}..."؟`,
        options: ['صح', 'خطأ'],
        correctAnswer: isTrue ? 'صح' : 'خطأ',
        difficulty: difficulty
    };
}

// توليد سؤال إجابة قصيرة
function generateShortAnswerQuestion(text, index, difficulty) {
    const keywords = text.split(/\s+/).filter(word => word.length > 5);
    const answer = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : 'المفهوم الرئيسي';
    
    return {
        id: index,
        type: 'short',
        text: `بناءً على النص: "${text.substring(0, 120)}..." ما هو ${answer}؟`,
        correctAnswer: answer,
        difficulty: difficulty
    };
}

// عرض الأسئلة
function displayQuestions() {
    if (generatedQuestions.length === 0) {
        questionsContainer.innerHTML = '<p class="placeholder">لم يتم إنشاء أسئلة بعد</p>';
        return;
    }
    
    questionsContainer.innerHTML = '';
    
    generatedQuestions.forEach(question => {
        const questionEl = document.createElement('div');
        questionEl.className = 'question-item';
        
        let optionsHtml = '';
        
        if (question.type === 'multiple') {
            optionsHtml = `
                <div class="options-container">
                    ${question.options.map((option, idx) => `
                        <div class="option ${option === question.correctAnswer ? 'correct' : ''}">
                            ${String.fromCharCode(0x0627 + idx)}. ${option}
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (question.type === 'truefalse') {
            optionsHtml = `
                <div class="options-container">
                    <div class="option ${question.correctAnswer === 'صح' ? 'correct' : ''}">صح</div>
                    <div class="option ${question.correctAnswer === 'خطأ' ? 'correct' : ''}">خطأ</div>
                </div>
            `;
        } else {
            optionsHtml = `
                <div class="options-container">
                    <div class="option correct">${question.correctAnswer}</div>
                </div>
            `;
        }
        
        const typeText = {
            'multiple': 'اختيار من متعدد',
            'truefalse': 'صح/خطأ',
            'short': 'إجابة قصيرة'
        }[question.type];
        
        const difficultyText = {
            'easy': 'سهل',
            'medium': 'متوسط',
            'hard': 'صعب'
        }[question.difficulty];
        
        questionEl.innerHTML = `
            <div class="question-header">
                <div class="question-number">${question.id}</div>
                <div>
                    <span class="question-type">${typeText}</span>
                    <span style="margin-right: 10px; color: var(--gray); font-size: 0.9rem;">${difficultyText}</span>
                </div>
            </div>
            <div class="question-text">${question.text}</div>
            ${optionsHtml}
        `;
        
        questionsContainer.appendChild(questionEl);
    });
}

// تحديث عدد الأسئلة المولدة
function updateGeneratedCount() {
    generatedCountEl.textContent = generatedQuestions.length;
    maxQuestionsEl.textContent = maxQuestions;
    
    // تحديث السلايدر إذا وصلنا للحد الأقصى
    if (generatedQuestions.length >= maxQuestions) {
        numQuestionsSlider.max = generatedQuestions.length;
    }
}

// تصدير الأسئلة
exportBtn.addEventListener('click', exportQuestions);

function exportQuestions() {
    if (generatedQuestions.length === 0) {
        alert('لا توجد أسئلة لتصديرها');
        return;
    }
    
    let exportText = 'الأسئلة المولدة من المحاضرة\n';
    exportText += '================================\n\n';
    
    generatedQuestions.forEach(question => {
        exportText += `سؤال ${question.id}: ${question.text}\n`;
        
        if (question.type === 'multiple') {
            question.options.forEach((option, idx) => {
                exportText += `  ${String.fromCharCode(0x0627 + idx)}. ${option}${option === question.correctAnswer ? ' (الإجابة الصحيحة)' : ''}\n`;
            });
        } else if (question.type === 'truefalse') {
            exportText += `  الإجابة الصحيحة: ${question.correctAnswer}\n`;
        } else {
            exportText += `  الإجابة: ${question.correctAnswer}\n`;
        }
        
        exportText += `  المستوى: ${question.difficulty}\n\n`;
    });
    
    // إنشاء ملف نصي للتحميل
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `أسئلة_المحاضرة_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// إعادة تعيين
resetBtn.addEventListener('click', resetApp);

function resetApp() {
    if (confirm('هل أنت متأكد من إعادة تعيين التطبيق؟ سيتم فقدان جميع البيانات الحالية.')) {
        pdfDoc = null;
        currentPage = 1;
        totalPages = 1;
        extractedText = '';
        availableQuestions = 0;
        generatedQuestions = [];
        maxQuestions = 0;
        
        pdfInput.value = '';
        fileInfo.classList.remove('show');
        pdfViewer.innerHTML = '';
        currentPageEl.textContent = '1';
        totalPagesEl.textContent = '1';
        availableQuestionsEl.textContent = '0';
        generatedCountEl.textContent = '0';
        maxQuestionsEl.textContent = '0';
        numQuestionsSlider.value = '5';
        questionCountEl.textContent = '5';
        numQuestionsSlider.max = '20';
        questionsContainer.innerHTML = '<p class="placeholder">سيتم عرض الأسئلة هنا بعد إنشائها</p>';
        exportBtn.disabled = true;
    }
}

// دالة مساعدة: تنسيق حجم الملف
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// تهيئة التطبيق عند التحميل
window.addEventListener('DOMContentLoaded', () => {
    // تعيين القيم الأولية
    questionCountEl.textContent = numQuestionsSlider.value;
    availableQuestionsEl.textContent = '0';
    generatedCountEl.textContent = '0';
    maxQuestionsEl.textContent = '0';
});