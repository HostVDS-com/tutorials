_S := $(shell uname -s)

install:
	cd frontend && yarn install

install-dev:
	@if [ "$(UNAME_S)" = "Darwin" ]; then \
		brew install imagemagick rsync; \
		yarn install; \
	elif [ "$(UNAME_S)" = "Linux" ]; then \
		if [ -f /etc/arch-release ]; then \
			sudo pacman -Sy --noconfirm rsync imagemagick; \
		else \
			sudo apt-get update; \
			sudo apt-get install -y rsync imagemagick; \
		fi; \
		yarn install; \
	else \
		echo "Unsupported OS"; \
		exit 1; \
	fi

clean:
	rm -rf frontend/static/topics/

copy:
	rsync -avhr --exclude "*.git" ./topics frontend/static/

# convert pngs to webp
optimize-images:
	find frontend/static/topics -type f -name '*.png' -exec sh -c 'CMD=""; \
if command -v magick >/dev/null 2>&1; then CMD="magick"; \
elif command -v convert >/dev/null 2>&1; then CMD="convert"; \
else echo "Neither magick nor convert found!" >&2; exit 1; fi; \
for img; do \
  if [ "$$CMD" = "magick" ]; then \
    magick "$$img" -filter lanczos2 -resize "1500x1500>" -quality 90 "$${img%.png}.webp"; \
  else \
    convert "$$img" -filter lanczos2 -resize "1500x1500>" -quality 90 "$${img%.png}.webp"; \
  fi; \
done' sh {} +

build-static:
	cd frontend && yarn run build

build: clean copy optimize-images
