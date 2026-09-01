# Stage 1: Build the Spring Boot application from the backend directory
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Cache dependencies
COPY backend/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B || true

# Copy source and build jar
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Ultra-lightweight JRE runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy executable jar from builder
COPY --from=builder /build/target/app.jar /app/app.jar

# Render dynamic port support
ENV PORT=8080
EXPOSE 8080

# Memory-optimized flags for container environments (Render free tier 512MB RAM)
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]
