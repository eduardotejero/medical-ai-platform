from preprocessor import preprocess, get_stats
import os

image_dir = r"C:\Users\Usuario\proyectos\medical-ai-platform\backend\data\images"
files = [f for f in os.listdir(image_dir) if f.endswith('.jpg')]
test_image = os.path.join(image_dir, files[0])
print(f"Testing: {test_image}")

with open(test_image, "rb") as f:
    file_bytes = f.read()

img = preprocess(file_bytes)
stats = get_stats(img)

print(f"Preprocessed shape: {img.shape}")
print(f"Value range: {img.min():.3f} - {img.max():.3f}")
print(f"Image stats: {stats}")
print("Preprocessing OK")