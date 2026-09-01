# Multi-stage build for Spring Boot Backend on Render
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/app.jar /app/app.jar
COPY --from=build /app/target/app.jar /app/target/app.jar
COPY --from=build /app/target/app.jar /app/target/vitalsync-hms-1.0.0-SNAPSHOT.jar
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]
