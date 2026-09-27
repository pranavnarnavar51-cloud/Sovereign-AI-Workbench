FROM ollama/ollama:latest

# Set air-gap on-prem environment variables
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_MODELS=/root/.ollama/models
ENV OLLAMA_KEEP_ALIVE=24h
ENV OLLAMA_NUM_PARALLEL=4

# Pre-seed directory structure for air-gapped model weights
RUN mkdir -p /root/.ollama/models

EXPOSE 11434

ENTRYPOINT ["ollama", "serve"]
