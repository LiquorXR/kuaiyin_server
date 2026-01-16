# 使用 Node.js 20.x 镜像
FROM node:20-alpine

# 安装时区数据和必要的工具
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app

# 设置 npm 镜像
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/

# 拷贝依赖配置并安装
COPY package*.json ./
RUN npm install

# 拷贝所有代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 设置端口为3000以匹配健康检查
ENV PORT 3000
ENV NODE_ENV=production
EXPOSE 3000

# 设置启动脚本权限
RUN chmod +x start.sh

# 健康检查
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动 Next.js 应用
CMD ["./start.sh"]
