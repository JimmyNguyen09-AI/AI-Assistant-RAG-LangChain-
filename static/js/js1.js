document.addEventListener('DOMContentLoaded', function () {
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatBox = document.getElementById('chat-box');

    function appendMessage(role, text) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${role}:</strong> ${text}`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('Bạn', message);
        userInput.value = '';
        //API để trả về nội dung của con chatbot, dựa vào nội dung của message, m viết api xong chèn vào đây 
        fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        })
        .then(response => response.json())
        .then(data => {
            appendMessage('ChatGPT', data.response);
        })
        .catch(error => {
            appendMessage('ChatGPT', 'Lỗi khi kết nối đến server.');
        });
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
