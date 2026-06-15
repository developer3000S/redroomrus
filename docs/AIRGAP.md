# Air-Gapped Deployment Guide

This guide describes how to deploy the Redroom platform in an isolated network environment (air-gapped) without internet access.

## 1. Prerequisites
- A staging machine with internet access (to pull images and packages).
- A target machine in the air-gapped network.
- Docker and Docker Compose installed on both.
- USB drive or secure data transfer method.

## 2. Infrastructure Components
Redroom requires the following services to run locally:
- **PostgreSQL**: Database for intelligence and user data.
- **Node.js**: Backend server and frontend serving.
- **Ollama (Optional but recommended)**: For local LLM capabilities (RAG / Ask AI).

## 3. Preparation (Staging Machine)

### A. Pull Docker Images
```bash
docker pull postgres:16-alpine
docker pull node:20-alpine
docker pull ollama/ollama:latest
```

### B. Save Images to Archive
```bash
docker save postgres:16-alpine > postgres.tar
docker save node:20-alpine > node.tar
docker save ollama/ollama:latest > ollama.tar
```

### C. Download NPM Dependencies
Download all project dependencies into a vendor folder:
```bash
pnpm install --frozen-lockfile
tar -czf node_modules.tar.gz node_modules
```

## 4. Deployment (Air-Gapped Machine)

### A. Load Images
```bash
docker load < postgres.tar
docker load < node.tar
docker load < ollama.tar
```

### B. Configure Local LLM (Ollama)
Redroom's "Ask AI" feature is configured to point to a local LLM in air-gapped mode.
1. Start Ollama.
2. Download a model (e.g., Llama3) on the staging machine using `ollama pull llama3` and export its storage.
3. In Redroom `.env`, set:
```env
BUILT_IN_FORGE_API_URL=http://ollama:11434/v1
BUILT_IN_FORGE_API_KEY=ollama
```

### C. Run the Application
Use a `docker-compose.yml` that includes PostgreSQL and the Redroom app. Since there's no external internet, ensure all data fetchers (crawlers) are either disabled or pointed to internal mirrors.

## 5. Security Recommendations
- Use hardware security modules (HSM) for key management.
- Enable the SIEM export feature to forward logs to an internal Splunk/QRadar instance within the isolated network.
- Connect classified physical data nodes via the "External Modules" API.
