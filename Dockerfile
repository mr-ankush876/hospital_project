# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run with JDK
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
EXPOSE 8080
CMD ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-8080} --spring.profiles.active=${SPRING_PROFILES_ACTIVE:-mysql}"]
