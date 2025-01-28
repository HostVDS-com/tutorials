# Contribution rules
To maintain an easy-to-use, community-driven tutorial platform, we have several important rules to follow.

1. **Topic Structure:**
   - Every topic is a unique, simple, and permanent folder with a URL-safe lowercase name (e.g., "docker")

2. **Metadata for Topics:**
   - Each topic has a reserved path `_index/_index.yaml`. This file contains metadata related to the current topic and follows this structure:

     ```yaml
     # _index/_index.yaml

     # List of related topics for recommended reads (optional)
     related_topics:
     - kubernetes
     - vm

     # Title of the topic translated to other languages (required)
     title:
       i18n:
         # ISO 639-1 language code followed by a translation
         en: Docker
         ru: Docker

     # Short description of the topic with translation (optional)
     description:
       i18n:
         en: Docker is a widely-used open-source tool for containerization...
         ru: Docker — это широко используемый инструмент с открытым исходным кодом для контейнеризации...
     ```
3. **Tutorial Naming:**
   - Tutorials must have simple, URL-safe, lowercase, and SEO-friendly folder names (e.g., "how-to-create-a-docker-container").

4. **Tutorial Metadata:**
   - Each tutorial folder contains a reserved `_index.yaml` file with the following structure:

     ```yaml
     # _index.yaml

     # Tags (optional)
     tags:
     - docker
     - container
     ```

5. **Static Content Folder:**
   - Each tutorial folder has a reserved `static/` folder for images and other media.
   - Statics must follow this naming convention:  
   `{ISO 639-1 language code}_image_{zero-padded number}.png` (e.g., "en_image_01.png", "zh_image_01.png").
   - Images must be in PNG format. Please, try to capture only the important parts, and crop out anything else (e.g. browser UI).

6. **Tutorial Content Files:**
   - Tutorials are stored in markdown files named after ISO 639-1 language codes (`en.md`, `ru.md`, `zh.md`, etc.).

### Example Folder Structure:

```
tutorials/docker
tutorials/docker/_index/_index.yaml
tutorials/docker/how-to-create-a-docker-container
tutorials/docker/how-to-create-a-docker-container/_index.yaml
tutorials/docker/how-to-create-a-docker-container/static/en_image_01.png
tutorials/docker/how-to-create-a-docker-container/static/zh_image_01.png
tutorials/docker/how-to-create-a-docker-container/en.md
tutorials/docker/how-to-create-a-docker-container/zh.md
```
