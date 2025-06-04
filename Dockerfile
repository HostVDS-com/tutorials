FROM node:24-bullseye

WORKDIR /app

COPY . .

RUN yarn install
RUN apt install rsync magick

RUN -avhr --exclude "*.git" ./topics /app/webview/static/
RUN find /app/webview/static/topics -type f -name '*.png' -exec sh -c 'for img; do magick "$img" -resize "1080x1080>" -quality 95 "${img%.png}.webp"; done' sh {} +

CMD ["yarn", "dev"]
