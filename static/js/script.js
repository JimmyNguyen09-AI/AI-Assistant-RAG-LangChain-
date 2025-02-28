document.addEventListener('DOMContentLoaded', function () {
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatBox = document.getElementById('chat-box');
    const fileUploadBtn = document.querySelector('.file-upload-button');
    const fileInput = document.getElementById('fileInput');
    const filePreviewContainer = document.getElementById('filePreviewContainer');

    // Hàm hiển thị message trên khung chat
    function appendMessage(role, text, file = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(role === 'Bạn' ? 'user-message' : 'bot-message');

    // Nếu có text, tạo một div cho text
    if (text) {
        const textElement = document.createElement('div');
        textElement.textContent = text;
        messageElement.appendChild(textElement);
    }

    // Nếu có file, tạo "bong bóng" file
    if (file) {
        const fileContainer = document.createElement('div');
        fileContainer.classList.add('file-container');

        const fileIcon = document.createElement('div');
        fileIcon.classList.add('file-icon');
        fileIcon.textContent = '📄';

        const fileName = document.createElement('span');
        fileName.classList.add('file-name');
        fileName.textContent = file.name;

        fileContainer.appendChild(fileIcon);
        fileContainer.appendChild(fileName);
        messageElement.appendChild(fileContainer);
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

    // Hàm gửi tin nhắn (cả text lẫn file)
    function sendMessage() {
        const message = userInput.value.trim();
        const file = fileInput.files[0]; // File hiện đang chọn

        // Kiểm tra xem có cả text và file hay không
        if (!message && !file) return; // không có gì thì không gửi

        // Hiển thị message của user lên chat (kèm file nếu có)
        appendMessage('Bạn', message, file);

        // Reset input
        userInput.value = '';
        // Xoá preview file
        filePreviewContainer.innerHTML = '';
        fileInput.value = '';

        // Chuẩn bị FormData gửi lên server
        const formData = new FormData();
        formData.append('message', message);
        if (file) {
            formData.append('file', file);
        }

        // Gửi request đến /chat
        fetch('/chat', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            appendMessage('ChatGPT', data.response);
        })
        .catch(error => {
            appendMessage('ChatGPT', 'Lỗi khi kết nối đến server.');
        });
    }

    // Khi ấn nút gửi
    sendBtn.addEventListener('click', sendMessage);

    // Khi nhấn Enter trong ô input
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    // Khi bấm nút "Gắn file"
    fileUploadBtn.addEventListener('click', function () {
        fileInput.click();
    });

    // Khi người dùng chọn file
    fileInput.addEventListener('change', function () {
        // Nếu có file, hiển thị preview file ở thanh input
        filePreviewContainer.innerHTML = '';
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];

            const fileContainer = document.createElement('div');
            fileContainer.classList.add('file-container');

            const fileIcon = document.createElement('div');
            fileIcon.classList.add('file-icon');
            fileIcon.textContent = '📄';

            const fileName = document.createElement('span');
            fileName.classList.add('file-name');
            fileName.textContent = file.name;

            // Nút đóng (xoá file)
            const closeButton = document.createElement('button');
            closeButton.classList.add('close-btn');
            closeButton.textContent = '✖';
            closeButton.addEventListener('click', function () {
                fileContainer.remove();
                fileInput.value = '';
            });

            fileContainer.appendChild(fileIcon);
            fileContainer.appendChild(fileName);
            fileContainer.appendChild(closeButton);

            filePreviewContainer.appendChild(fileContainer);
        }
    });
});
