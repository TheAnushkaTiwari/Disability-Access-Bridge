import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# We use a fast, free local model to turn text into numbers (vectors)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DB_SAVE_PATH = "faiss_index_store"

def process_and_store_pdf(pdf_file_path):
    """
    Step 1: Reads a PDF, breaks it into chunks, and saves it to a local FAISS database.
    """
    try:
        # 1. Load the PDF
        loader = PyPDFLoader(pdf_file_path)
        documents = loader.load()

        # 2. Chunk the text (Government schemes are long; we need to read them in chunks)
        # We use overlap so we don't accidentally cut a sentence in half!
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)

        # 3. Create Embeddings & Store in FAISS
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        vector_db = FAISS.from_documents(chunks, embeddings)
        
        # Save the database locally so we don't have to re-read the PDF every time
        vector_db.save_local(DB_SAVE_PATH)
        
        return {"status": "success", "message": "PDF successfully processed and stored."}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}


def ask_scheme_question(user_question, groq_api_key):
    """
    Step 2: Handles general conversation AND PDF-based questions.
    """
    try:
        # 1. Give the AI its Persona and Knowledge about your website
        site_context = """
        You are the AI Assistant for the 'Disability Access Bridge' platform. 
        This platform is a central hub for resources, rights, and community support for Divyangjan.
        Features include: Accessibility tools (High Contrast, Text-to-Speech), a Speech-to-Indian Sign Language (ISL) video converter, community forums, news, and this AI scheme assistant.
        Be polite, friendly, and helpful. Keep your answers brief.
        """

        # 2. Set up the Groq LLM (Temperature 0.3 makes it slightly more conversational)
        llm = ChatGroq(
            temperature=0.3, 
            groq_api_key=groq_api_key, 
            model_name="llama-3.1-8b-instant" 
        )

        # 3. IF NO PDF IS UPLOADED YET: Just chat!
        if not os.path.exists(DB_SAVE_PATH):
            prompt_template = PromptTemplate.from_template(
                site_context + """
                The user has NOT uploaded a scheme PDF yet. 
                Answer their question based on your persona. 
                If they ask about a specific government scheme, kindly tell them to upload the PDF using the 📎 paperclip icon first.

                User Question: {question}
                Answer:
                """
            )
            chain = prompt_template | llm
            response = chain.invoke({"question": user_question})
            return {"status": "success", "answer": response.content}


        # 4. IF A PDF IS UPLOADED: Search FAISS and use RAG
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        vector_db = FAISS.load_local(
            DB_SAVE_PATH, 
            embeddings, 
            allow_dangerous_deserialization=True 
        )

        retriever = vector_db.as_retriever(search_kwargs={"k": 3})
        relevant_docs = retriever.invoke(user_question)
        context_text = "\n\n".join([doc.page_content for doc in relevant_docs])

        prompt_template = PromptTemplate.from_template(
            site_context + """
            You also have access to a government scheme document. 
            If the user asks about the scheme, answer ONLY using the context below. 
            If the answer is not in the context, say "I cannot find the answer to that in the uploaded document."

            Context from Document:
            {context}

            User Question: {question}
            Answer:
            """
        )

        chain = prompt_template | llm
        response = chain.invoke({"context": context_text, "question": user_question})

        return {"status": "success", "answer": response.content}

    except Exception as e:
        return {"status": "error", "message": f"Could not generate answer: {str(e)}"}