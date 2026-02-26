import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import pandas as pd
import numpy as np
import os
import mlflow
import mlflow.pytorch
from classifier import build_model, LABELS, DEVICE

IMAGE_DIR = r"C:\Users\Usuario\proyectos\medical-ai-platform\backend\data\images"
CSV_PATH = r"C:\Users\Usuario\proyectos\medical-ai-platform\backend\data\GroundTruth.csv"

LABEL_MAP = {
    'MEL': 'Melanoma',
    'NV': 'Melanocytic Nevi',
    'BCC': 'Basal Cell Carcinoma',
    'AKIEC': 'Actinic Keratosis',
    'BKL': 'Benign Keratosis',
    'DF': 'Dermatofibroma',
    'VASC': 'Vascular Lesion'
}

DIAGNOSIS_COLS = ['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC']

class SkinDataset(Dataset):
    def __init__(self, df, image_dir, transform):
        self.df = df.reset_index(drop=True)
        self.image_dir = image_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.image_dir, f"{row['image']}.jpg")
        img = Image.open(img_path).convert("RGB")
        tensor = self.transform(img)
        dx = LABEL_MAP[row[DIAGNOSIS_COLS].idxmax()]
        label = LABELS.index(dx)
        return tensor, label

TRANSFORM_TRAIN = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

TRANSFORM_VAL = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

df = pd.read_csv(CSV_PATH)

# Use subset for faster training — full dataset takes hours on CPU
df['dx'] = df[DIAGNOSIS_COLS].idxmax(axis=1)
df_sample = df.groupby('dx').apply(
    lambda x: x.sample(min(len(x), 100)), include_groups=False
).reset_index(drop=True)
df_sample['dx'] = df_sample[DIAGNOSIS_COLS].idxmax(axis=1)

split = int(0.8 * len(df_sample))
df_train = df_sample[:split]
df_val = df_sample[split:]

train_loader = DataLoader(SkinDataset(df_train, IMAGE_DIR, TRANSFORM_TRAIN), batch_size=16, shuffle=True)
val_loader = DataLoader(SkinDataset(df_val, IMAGE_DIR, TRANSFORM_VAL), batch_size=16)

print(f"Train: {len(df_train)}, Val: {len(df_val)}, Device: {DEVICE}")

mlflow.set_experiment("cnn-dermatology")

EPOCHS = 5
LR = 0.001

with mlflow.start_run(run_name="resnet18-transfer-learning"):
    model = build_model()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)

    mlflow.log_params({
        "model": "resnet18",
        "epochs": EPOCHS,
        "lr": LR,
        "train_size": len(df_train),
        "val_size": len(df_val),
        "device": str(DEVICE)
    })

    for epoch in range(EPOCHS):
        model.train()
        train_loss, correct, total = 0, 0, 0
        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            correct += (outputs.argmax(1) == labels).sum().item()
            total += labels.size(0)

        train_acc = correct / total

        model.eval()
        val_loss, val_correct, val_total = 0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                val_loss += criterion(outputs, labels).item()
                val_correct += (outputs.argmax(1) == labels).sum().item()
                val_total += labels.size(0)

        val_acc = val_correct / val_total

        mlflow.log_metrics({
            "train_loss": train_loss / len(train_loader),
            "train_acc": train_acc,
            "val_loss": val_loss / len(val_loader),
            "val_acc": val_acc
        }, step=epoch)

        print(f"Epoch {epoch+1}/{EPOCHS} — train_acc={train_acc:.4f}, val_acc={val_acc:.4f}")

    torch.save(model.state_dict(), "models/resnet18_dermatology.pth")
    mlflow.pytorch.log_model(model, "resnet18")
    print("Model saved to models/resnet18_dermatology.pth")