# ==============================================================================
# EscrowFlow Dockerfile
# Multi-stage Docker build for Spring Boot application
# ==============================================================================

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy pom.xml and dependencies
COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

# Install maven
RUN apk add --no-cache maven && \
    mvn clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/escrowflow-backend-1.0.0.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
