.PHONY: all setup dev frontend backend test clean

all: setup

setup:
	python -m pip install -r requirements.txt
	cd frontend && npm install

dev:
	@echo "Starting Sovereign Agentic Workbench..."
	python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
	cd frontend && npm run dev

backend:
	python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

frontend:
	cd frontend && npm run dev

test:
	pytest tests/ -v

test-redteam:
	pytest tests/redteam/ -v

build-frontend:
	cd frontend && npm run build
