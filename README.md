# 📄 DocTalk

**DocTalk** is an AI-powered web app that lets you chat with your PDF documents using LLMs and semantic search for quick and accurate answers.

### ⚙️ How It Works
Users upload their documents (like PDFs), which are then parsed and chunked into vector embeddings. These embeddings are stored in vector DB (Quadrant DB here) and used to perform semantic search. When a user asks a question, the app retrieves the most relevant document chunks and sends them to an LLM(Gemini here) to generate a precise answer.


![Landing Page](client/public/DocTalk.png)

---

## 🛠 Tech Stack

### 🧑‍🎨 Frontend  
Next.js, Tailwind CSS, Shadcn UI, Framer Motion, Typescript

### 🔧 Backend  
LangChain, Google Gemini, Quadrant DB, BullMQ, Redis, Docker, Express, Javascript

---

## 🚀 Features

- 🔍 **Chat with your PDFs**: Upload PDFs and get intelligent, context-aware answers.
- ⚙️ **Async Processing**: Background queue system for smooth performance.
- 🧠 **Semantic Search**: Retrieves precise results using embeddings.
- 🌙 **Modern UI**: Responsive design with animation and dark mode.

---
