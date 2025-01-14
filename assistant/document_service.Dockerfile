# Use Python 3.9 as base image
FROM python:3.9-slim

# Set working directory to match Render's path
WORKDIR /opt/render/project/src

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for Prisma)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Install Prisma CLI
RUN npm install -g prisma

# Copy requirements file
COPY document_requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Generate Prisma client and fetch query engine
RUN cd prisma && \
    prisma generate && \
    prisma py fetch && \
    chmod -R 777 /opt/render/project/src

# Expose port
EXPOSE 8004

# Start the application
CMD ["uvicorn", "document_service:app", "--host", "0.0.0.0", "--port", "8004"] 