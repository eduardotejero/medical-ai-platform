import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import numpy as np
import io
import os

LABELS = ['Actinic Keratosis', 'Basal Cell Carcinoma', 'Benign Keratosis',
          'Dermatofibroma', 'Melanocytic Nevi', 'Melanoma', 'Vascular Lesion']

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def build_model(num_classes: int = 7) -> nn.Module:
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model.to(DEVICE)

def predict(model: nn.Module, file_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    tensor = TRANSFORM(img).unsqueeze(0).to(DEVICE)
    model.eval()
    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)[0]
        pred_idx = probs.argmax().item()
    return {
        "diagnosis": LABELS[pred_idx],
        "confidence": float(probs[pred_idx]),
        "probabilities": {label: float(prob) for label, prob in zip(LABELS, probs)}
    }