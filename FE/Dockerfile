# Giai đoạn 1: Build ứng dụng
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy file cấu hình trước để tận dụng cache của Docker
COPY package*.json ./
RUN npm install

# Copy toàn bộ code và build
COPY . .
RUN npm run build

# Giai đoạn 2: Phục vụ file tĩnh bằng Nginx
FROM nginx:stable-alpine AS production-stage

# Copy file đã build từ giai đoạn 1 vào thư mục của Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx tùy chỉnh để xử lý React Router và tối ưu hóa
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
