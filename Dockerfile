# Hugging Face Spaces (Docker SDK) image for the call center bot.
FROM python:3.12-slim

# Spaces run containers as user 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    UV_LINK_MODE=copy
WORKDIR /home/user/app

RUN pip install --no-cache-dir --user uv

# Install dependencies first (cached between builds)
COPY --chown=user pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY --chown=user . .

ENV HOST=0.0.0.0 \
    PORT=7860
EXPOSE 7860
CMD ["uv", "run", "--frozen", "call_center.py"]
