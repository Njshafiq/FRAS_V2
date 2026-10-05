import uvicorn
import os
import sys

# Ensure python-ai is on PYTHONPATH and UTF-8 is active
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"
try:
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if sys.stderr and hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

if __name__ == "__main__":
    port = int(os.environ.get("AI_SERVICE_PORT", 8000))
    host = os.environ.get("AI_SERVICE_HOST", "0.0.0.0")
    print(f"Starting FRAS V2 FaceNet512 Python AI Service on http://{host}:{port} ...")
    uvicorn.run("app.main:app", host=host, port=port, reload=False, log_level="info")
