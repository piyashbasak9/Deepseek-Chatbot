// Store conversation history
let conversationHistory = [];
let currentFile = null;
let isStreaming = false;
let controller = null;

// Initialize emoji picker // keep stop for this project
const emojiBtn = document.getElementById('emojiBtn');
const emojiPickerContainer = document.querySelector('.emoji-picker-container');
const emojiPicker = document.querySelector('emoji-picker');
const userInput = document.getElementById('userInput');

emojiBtn.addEventListener('click', () => {
    emojiPickerContainer.style.display = emojiPickerContainer.style.display === 'block' ? 'none' : 'block';
});

emojiPicker.addEventListener('emoji-click', event => {
    const emoji = event.detail.unicode;
    userInput.value += emoji;
    userInput.focus();
    emojiPickerContainer.style.display = 'none';
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
    if (!emojiBtn.contains(e.target) && !emojiPickerContainer.contains(e.target)) {
        emojiPickerContainer.style.display = 'none';
    }
});

// File upload handling
const fileUploadBtn = document.getElementById('fileUploadBtn');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');

fileUploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    currentFile = file;
    
    // Show file preview
    filePreview.innerHTML = '';
    filePreview.style.display = 'block';
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'file-preview';
    
    // Check if file is an image
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewDiv.appendChild(img);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            `;
            previewDiv.appendChild(fileInfo);
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '✕';
            removeBtn.addEventListener('click', () => {
                currentFile = null;
                fileInput.value = '';
                filePreview.style.display = 'none';
            });
            previewDiv.appendChild(removeBtn);
            
            filePreview.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.innerHTML = `
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <span class="remove-file">✕</span>
        `;
        
        previewDiv.querySelector('.remove-file').addEventListener('click', () => {
            currentFile = null;
            fileInput.value = '';
            filePreview.style.display = 'none';
        });
        
        filePreview.appendChild(previewDiv);
    }
    
    updateStatus(`File ready: ${file.name}`);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to add a message to the chat
function addMessage(role, content, isStream = false) {
    const chatContainer = document.getElementById('chat-container');
    
    if (isStream && role === 'bot' && document.getElementById('streaming-message')) {
        // Update existing streaming message
        const messageDiv = document.getElementById('streaming-message');
        messageDiv.querySelector('.message-content').innerHTML = marked.parse(content);
        scrollToBottom();
        return;
    }
    
    const messageDiv = document.createElement('div');
    const messageId = isStream ? 'streaming-message' : `message-${Date.now()}`;
    messageDiv.id = messageId;
    messageDiv.className = `message ${role}-message`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            ${role === 'user' ? '👤 You' : '🤖 Assistant'}
            <span class="badge">${timestamp}</span>
            ${role === 'bot' ? `<button class="clear-btn" onclick="clearChat()">Clear Chat</button>` : ''}
        </div>
        <div class="message-content">${marked.parse(content)}</div>
        ${isStream ? '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>' : ''}
    `;
    
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // Add copy buttons to code blocks
    if (!isStream) {
        messageDiv.querySelectorAll('pre').forEach(pre => {
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = 'Copy';
            copyBtn.style.position = 'absolute';
            copyBtn.style.right = '10px';
            copyBtn.style.top = '10px';
            copyBtn.style.padding = '3px 8px';
            copyBtn.style.background = 'var(--primary)';
            copyBtn.style.color = 'white';
            copyBtn.style.border = 'none';
            copyBtn.style.borderRadius = '4px';
            copyBtn.style.cursor = 'pointer';
            copyBtn.style.fontSize = '12px';
            copyBtn.style.transition = 'all 0.2s';
            copyBtn.onmouseover = () => copyBtn.style.background = 'var(--primary-dark)';
            copyBtn.onmouseout = () => copyBtn.style.background = 'var(--primary)';
            copyBtn.onclick = () => {
                const code = pre.querySelector('code')?.innerText || pre.innerText;
                navigator.clipboard.writeText(code);
                copyBtn.innerHTML = 'Copied!';
                setTimeout(() => copyBtn.innerHTML = 'Copy', 2000);
            };
            
            pre.style.position = 'relative';
            pre.style.paddingTop = '35px';
            pre.appendChild(copyBtn);
        });
    }
}

// Function to scroll to bottom of chat
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Scroll to bottom button
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
scrollToBottomBtn.addEventListener('click', scrollToBottom);

// Show/hide scroll to bottom button based on scroll position
document.getElementById('chat-container').addEventListener('scroll', function() {
    const chatContainer = this;
    const scrollPosition = chatContainer.scrollTop + chatContainer.clientHeight;
    const scrollHeight = chatContainer.scrollHeight;
    
    // Show button if not scrolled to bottom
    if (scrollHeight - scrollPosition > 100) {
        scrollToBottomBtn.style.display = 'flex';
    } else {
        scrollToBottomBtn.style.display = 'none';
    }
});

// Function to clear the chat
function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
    conversationHistory = [];
    currentFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
    updateStatus('Chat cleared. Ready for new conversation.');
}

// Function to update status info
function updateStatus(message) {
    document.getElementById('status-info').textContent = message;
}

// Function to abort current streaming
function abortStreaming() {
    if (controller) {
        controller.abort();
        controller = null;
        isStreaming = false;
        updateStatus('Response generation stopped.');
    }
}

// Function to handle streaming response
async function handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data:') && !line.includes('[DONE]')) {
                try {
                    const data = JSON.parse(line.substring(5));
                    const content = data.choices?.[0]?.delta?.content || '';
                    fullResponse += content;
                    addMessage('bot', fullResponse, true);
                } catch (e) {
                    console.error('Error parsing stream data:', e);
                }
            }
        }
    }
    
    // Finalize the message
    const streamingMessage = document.getElementById('streaming-message');
    if (streamingMessage) {
        streamingMessage.id = `message-${Date.now()}`;
        streamingMessage.querySelector('.typing-indicator').remove();
        
        // Add copy buttons to code blocks
        streamingMessage.querySelectorAll('pre').forEach(pre => {
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = 'Copy';
            copyBtn.style.position = 'absolute';
            copyBtn.style.right = '10px';
            copyBtn.style.top = '10px';
            copyBtn.style.padding = '3px 8px';
            copyBtn.style.background = 'var(--primary)';
            copyBtn.style.color = 'white';
            copyBtn.style.border = 'none';
            copyBtn.style.borderRadius = '4px';
            copyBtn.style.cursor = 'pointer';
            copyBtn.style.fontSize = '12px';
            copyBtn.style.transition = 'all 0.2s';
            copyBtn.onmouseover = () => copyBtn.style.background = 'var(--primary-dark)';
            copyBtn.onmouseout = () => copyBtn.style.background = 'var(--primary)';
            copyBtn.onclick = () => {
                const code = pre.querySelector('code')?.innerText || pre.innerText;
                navigator.clipboard.writeText(code);
                copyBtn.innerHTML = 'Copied!';
                setTimeout(() => copyBtn.innerHTML = 'Copy', 2000);
            };
            
            pre.style.position = 'relative';
            pre.style.paddingTop = '35px';
            pre.appendChild(copyBtn);
        });
    }
    
    // Add to conversation history
    conversationHistory.push({ role: 'assistant', content: fullResponse });
    updateStatus(`Response complete`);
    isStreaming = false;
    controller = null;
}

async function sendMessage() {
    if (isStreaming) {
        updateStatus('Please wait for the current response to complete.');
        return;
    }
    
    const input = document.getElementById('userInput');
    const userInput = input.value.trim();
    const button = document.querySelector('.btn');
    
    if (!userInput && !currentFile) {
        addMessage('bot', '<div style="color: var(--secondary);">Please enter your question or attach a file first.</div>');
        button.classList.remove('pulse');
        setTimeout(() => button.classList.add('pulse'), 100);
        return;
    }
    
    // Add user message to chat and history
    addMessage('user', userInput);
    conversationHistory.push({ role: 'user', content: userInput });
    
    // Clear input field
    input.value = '';
    
    // Disable button during processing
    button.disabled = true;
    button.innerHTML = 'Thinking...';
    button.classList.remove('pulse');
    
    // Add streaming message placeholder
    addMessage('bot', 'Generating response...', true);
    updateStatus(`Processing your request...`);
    
    isStreaming = true;
    controller = new AbortController();
    
    try {
        // Prepare form data if file is attached
        let requestBody;
        let headers = {
            'Authorization': 'Bearer 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',
            'HTTP-Referer': 'https://www.sitename.com',
            'X-Title': 'SiteName'
        };
        
        if (currentFile) {
            const formData = new FormData();
            formData.append('model', 'deepseek/deepseek-r1:free');
            formData.append('messages', JSON.stringify(conversationHistory));
            formData.append('file', currentFile);
            
            requestBody = formData;
        } else {
            headers['Content-Type'] = 'application/json';
            requestBody = JSON.stringify({
                model: 'deepseek/deepseek-r1:free',
                messages: conversationHistory,
                stream: true
            });
        }
        
        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: headers,
                body: requestBody,
                signal: controller.signal
            }
        );
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        updateStatus(`Receiving response...`);
        await handleStreamResponse(response);
        
        // Clear file after successful send
        if (currentFile) {
            currentFile = null;
            fileInput.value = '';
            filePreview.style.display = 'none';
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            updateStatus('Request was aborted by user.');
        } else {
            console.error('Error:', error);
            document.getElementById('streaming-message').remove();
            addMessage('bot', `<div style="color: #ff6b6b;">Error: ${error.message}<br>Please try again later.</div>`);
            updateStatus(`Error: ${error.message}`);
        }
    } finally {
        // Re-enable button
        button.disabled = false;
        button.innerHTML = 'Send Message';
        button.classList.add('pulse');
        isStreaming = false;
        controller = null;
    }
}

// Allow pressing Enter to submit
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initial status
updateStatus('Ready to chat. Type your message or attach a file.');