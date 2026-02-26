from detector import load_model, detect
import os

image_dir = r"C:\Users\Usuario\proyectos\medical-ai-platform\backend\data\images"
files = [f for f in os.listdir(image_dir) if f.endswith('.jpg')]
test_image = os.path.join(image_dir, files[0])

with open(test_image, "rb") as f:
    file_bytes = f.read()

print("Loading YOLO model...")
model = load_model()

print("Running detection...")
result = detect(model, file_bytes)

print(f"Image size: {result['image_size']}")
print(f"Total detections: {result['total']}")
for d in result['detections']:
    print(f" - {d['class']}: {d['confidence']:.2f} | bbox: {d['bbox']}")