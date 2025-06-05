FROM node:24-bullseye

WORKDIR /app

COPY . .

RUN yarn install
RUN apt install rsync magick

RUN -avhr --exclude "*.git" ./topics /app/frontend/static/ && find /app/frontend/static/topics -type f -name '*.png' -exec sh -c 'for img; do magick "$img" -filter lanczos2 -resize "1500x1500>" -quality 90 "${img%.png}.webp"; done' sh {} +

CMD ["yarn", "dev"]
