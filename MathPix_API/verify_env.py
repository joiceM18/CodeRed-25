import sys
import os

print("Python executable:", sys.executable)
print("Current working directory:", os.getcwd())
print("PYTHONPATH:", sys.path)

try:
    import fastapi
    print("FastAPI version:", fastapi.__version__)
except ImportError:
    print("FastAPI not found")

try:
    from PIL import Image
    print("Pillow version:", Image.__version__)
except ImportError:
    print("Pillow not found")