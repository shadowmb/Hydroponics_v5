FROM ubuntu:20.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Update and install prerequisites
RUN apt-get update && apt-get install -y \
    gnupg \
    curl \
    wget \
    lsb-release \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Add MongoDB GPG key and repository
# Using MongoDB 4.4 Community Edition for Ubuntu 20.04 (Focal)
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-4.4.gpg --dearmor

RUN echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-4.4.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Install MongoDB
RUN apt-get update && apt-get install -y mongodb-org && \
    rm -rf /var/lib/apt/lists/*

# Create data directory and log directory
RUN mkdir -p /data/db /var/log/mongodb /var/lib/mongodb

# Set permissions
RUN chown -R mongodb:mongodb /data/db /var/log/mongodb /var/lib/mongodb

# Copy configuration
COPY mongod.conf /etc/mongod.conf

# Expose port
EXPOSE 27017

# Run as mongodb user
USER mongodb

# Start MongoDB with our config
CMD ["mongod", "--config", "/etc/mongod.conf"]
