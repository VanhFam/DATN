# Giai đoạn 1: Build bằng Maven
FROM maven:3.8.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

# Giai đoạn 2: Chạy ứng dụng
FROM eclipse-temurin:17-jre-focal
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Tạo thư mục cho ảnh khuôn mặt
RUN mkdir -p uploads/face-images

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
