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

optimize-images:
	find frontend/static/topics -type f -name '*.png' -exec sh -c 'for img; do magick "$$img" -filter lanczos2 -resize "1500x1500>" -quality 90 "$${img%.png}.webp"; done' sh {} +

build-static:
	cd frontend && yarn run build

build: clean copy optimize-images
