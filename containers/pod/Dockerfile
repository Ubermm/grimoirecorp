# Start with Ubuntu base image
FROM pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/bin/python

# Upgrade pip
RUN python -m pip install --upgrade pip setuptools wheel

# Create necessary directories
RUN mkdir -p /input /output /app /workspace

# Set working directory
WORKDIR /app

# Install TensorFlow (GPU version)
RUN pip install --no-cache-dir tensorflow==2.15.0

# Install numerical/scientific packages (separately)
RUN pip install --no-cache-dir numpy pandas matplotlib scikit-learn scipy

# Install Jupyter packages (separately)
RUN pip install --no-cache-dir jupyter jupyterlab

# Install CV and imaging packages (separately)
RUN pip install --no-cache-dir opencv-python pillow

# Install utility packages (separately)
RUN pip install --no-cache-dir requests xgboost lightgbm tqdm seaborn

# Install ML and AI packages (separately)
RUN pip install --no-cache-dir transformers datasets huggingface_hub

# Install Azure packages (separately)
RUN pip install --no-cache-dir azure-storage-blob

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

RUN mkdir -p /input /output /workspace

# Give full read/write/execute permissions
RUN chmod -R 777 /input /output /workspace

# Copy entrypoint script
COPY script.txt /app/entrypoint.sh

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Expose port for Jupyter
EXPOSE 8888

CMD [""]