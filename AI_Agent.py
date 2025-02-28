#author: JimmyNguyen-AI   28/02/2025
import os
import shutil
import openai
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv, find_dotenv
import warnings
warnings.filterwarnings("ignore")
from langchain.agents import Tool, initialize_agent
from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.vectorstores import Chroma
from langchain.document_loaders import PyPDFLoader
from langchain.document_loaders import UnstructuredWordDocumentLoader
from langchain.text_splitter import CharacterTextSplitter
_ = load_dotenv(find_dotenv())
openai.api_key = os.environ.get("OPENAI_API_KEY", "")
llm_model = "gpt-3.5-turbo"
llm = ChatOpenAI(
    temperature=0.7,
    model="gpt-3.5-turbo"
)
database = "chroma_db"
file_upload_container = "uploads"
if os.path.isdir(file_upload_container):
    shutil.rmtree(file_upload_container,ignore_errors=True)
if os.path.isdir(database):
    shutil.rmtree(database,ignore_errors=True)

app = Flask(__name__)
app.secret_key = "secret-key"
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(
    persist_directory=database,
    embedding_function=embeddings
)
def normal_chat_tool(query: str, model:str = llm_model) -> str:
        search_results = vectorstore.similarity_search(query, k=3)
        context = "\n".join([result.page_content for result in search_results])
        messages = [
            {"role": "system",
             "content": "You are a smart and honest chatbot. Provide the most correct answers and ensure politeness."},
            {"role": "user", "content": f"Context: {context}\nUser: {query}"}
        ]
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            top_p=1.0,
            temperature=0.5,
            max_tokens=1024,
            frequency_penalty=0.0,
            presence_penalty=0.0
        )
        ai_reply = response.choices[0].message["content"]
        return ai_reply
def doc_search_tool(query: str) -> str:
    results = vectorstore.similarity_search(query, k=3)
    context = "\n".join([doc.page_content for doc in results])
    return context
tools = [
    Tool(
        name="NormalChat",
        func=normal_chat_tool,
        description="Dùng khi cần trò chuyện tự do, không cần tài liệu."
    ),
    Tool(
        name="DocSearch",
        func=doc_search_tool,
        description="Dùng khi cần truy xuất thông tin từ tài liệu đã lưu."
    )
]
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent = "conversational-react-description",
    memory=memory,
    verbose=False,
    handle_parsing_errors=True
)

def handle_uploaded_file(f):
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    save_path = os.path.join("uploads", f.filename)
    f.save(save_path)
    file_ext = os.path.splitext(f.filename)[1].lower()
    if file_ext == ".pdf":
        loader = PyPDFLoader(save_path)
        documents = loader.load()
    elif file_ext == ".docx":
        loader = UnstructuredWordDocumentLoader(save_path)
        documents = loader.load()
    else:
        with open(save_path, "r", encoding="utf-8") as file_obj:
            text = file_obj.read()
        from langchain.docstore.document import Document
        documents = [Document(page_content=text)]
    text_splitter = CharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=50
    )
    docs_splitted = text_splitter.split_documents(documents)
    for doc in docs_splitted:
        vectorstore.add_texts([doc.page_content])
    vectorstore.persist()
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.form.get("message", "").strip()
    uploaded_file = request.files.get("file")
    if uploaded_file and uploaded_file.filename:
        handle_uploaded_file(uploaded_file)
    #ko có text và ko có file
    if not user_message and not (uploaded_file and uploaded_file.filename):
        return jsonify({"response": "Chưa nhập nội dung."})
    try:
        # Nếu có tin nhắn->gọi AI
        response = ""
        if user_message:
            response = agent.run(user_message)
        # Nếu có file mà ko có text
        if (uploaded_file and uploaded_file.filename) and not user_message:
            return jsonify({"response": f"Đã nạp tài liệu: {uploaded_file.filename}"})
        # Nếu có cả file và text
        if (uploaded_file and uploaded_file.filename) and user_message:
            return jsonify({"response": f"Đã nạp tài liệu: {uploaded_file.filename}\n\n{response}"})
        # Nếu chỉ có text
        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"response": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
