FROM python:3.11-slim
WORKDIR /app
COPY rag/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY rag/ .
EXPOSE 8000
ENV PORT=8000
ENV RAG_VERSION=0.0.1
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]

