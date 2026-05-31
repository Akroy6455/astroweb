import json
import pandas as pd
import yfinance as yf
import numpy as np
import os
import torch
import torch.nn as nn
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

# --- 1. Load Astrological Dataset ---
astro_file_path = os.path.join(os.path.dirname(__file__), 'astro_trading_dataset_10yrs.json')
print(f"Loading Astrological Data from {astro_file_path}...")
with open(astro_file_path, 'r') as f:
    astro_data = json.load(f)

# Convert to DataFrame
astro_df = pd.json_normalize(astro_data)
# Convert timestamp_id to Date (without time) for merging
astro_df['Date'] = pd.to_datetime(astro_df['timestamp_id']).dt.date
astro_df.drop('timestamp_id', axis=1, inplace=True)
astro_df.set_index('Date', inplace=True)

# Cyclic Encoding for Padas (1-108) and Rasi (1-12)
def add_cyclic_features(df, col_name, max_val):
    df[f'{col_name}_sin'] = np.sin(2 * np.pi * df[col_name] / max_val)
    df[f'{col_name}_cos'] = np.cos(2 * np.pi * df[col_name] / max_val)
    df.drop(col_name, axis=1, inplace=True)

# Apply cyclic encoding
for col in astro_df.columns:
    if 'pada' in col:
        add_cyclic_features(astro_df, col, 108)
    elif 'rasi' in col:
        add_cyclic_features(astro_df, col, 12)

# --- 2. Fetch NIFTY 50 Data ---
print("Fetching NIFTY 50 Historical Data...")
ticker = "^NSEI" # NIFTY 50 ticker on Yahoo Finance
stock_data = yf.download(ticker, start="2016-05-03", end="2026-05-03")

if stock_data.empty:
    print("Failed to fetch stock data. Ensure internet connection.")
    exit()

# Flatten MultiIndex columns if necessary
if isinstance(stock_data.columns, pd.MultiIndex):
    stock_data.columns = [c[0] for c in stock_data.columns]

stock_data.index = stock_data.index.date
stock_data.index.name = 'Date'

# Calculate Percentage Changes relative to PREVIOUS Close
stock_data['Prev_Close'] = stock_data['Close'].shift(1)
stock_data.dropna(inplace=True) # Drop first row due to shift

# Targets (y)
stock_data['y_open'] = (stock_data['Open'] - stock_data['Prev_Close']) / stock_data['Prev_Close'] * 100
stock_data['y_high'] = (stock_data['High'] - stock_data['Prev_Close']) / stock_data['Prev_Close'] * 100
stock_data['y_low'] = (stock_data['Low'] - stock_data['Prev_Close']) / stock_data['Prev_Close'] * 100
stock_data['y_close'] = (stock_data['Close'] - stock_data['Prev_Close']) / stock_data['Prev_Close'] * 100

targets_df = stock_data[['y_open', 'y_high', 'y_low', 'y_close']]

# --- 3. Merge Datasets ---
print("Merging Datasets...")
merged_df = astro_df.join(targets_df, how='inner')
merged_df.dropna(inplace=True)
print(f"Total merged trading days: {len(merged_df)}")

# Separate features (X) and targets (y)
target_cols = ['y_open', 'y_high', 'y_low', 'y_close']
X = merged_df.drop(columns=target_cols).values
y = merged_df[target_cols].values

# Scale Targets (Important for neural networks)
y_scaler = StandardScaler()
y_scaled = y_scaler.fit_transform(y)

# Feature Scaling (for motion states and sine/cosine)
X_scaler = StandardScaler()
X_scaled = X_scaler.fit_transform(X)

# --- 4. Prepare Sequences for LSTM ---
def create_sequences(X, y, lookback=5):
    X_seq, y_seq = [], []
    for i in range(len(X) - lookback):
        X_seq.append(X[i:(i + lookback)])
        y_seq.append(y[i + lookback])
    return np.array(X_seq), np.array(y_seq)

LOOKBACK = 5
X_seq, y_seq = create_sequences(X_scaled, y_scaled, lookback=LOOKBACK)

# Convert to PyTorch Tensors
X_tensor = torch.tensor(X_seq, dtype=torch.float32)
y_tensor = torch.tensor(y_seq, dtype=torch.float32)

# Time-Series Split (80% Train, 20% Test)
split_idx = int(len(X_tensor) * 0.8)
X_train, y_train = X_tensor[:split_idx], y_tensor[:split_idx]
X_test, y_test = X_tensor[split_idx:], y_tensor[split_idx:]

train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=32, shuffle=False)
test_loader = DataLoader(TensorDataset(X_test, y_test), batch_size=32, shuffle=False)

# --- 5. Define LSTM Model ---
class AstroTradingLSTM(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers, output_dim):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=0.2)
        self.fc1 = nn.Linear(hidden_dim, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, output_dim)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :] # Take the output of the last time step
        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        return out

INPUT_DIM = X_train.shape[2]
HIDDEN_DIM = 64
NUM_LAYERS = 2
OUTPUT_DIM = 4

model = AstroTradingLSTM(INPUT_DIM, HIDDEN_DIM, NUM_LAYERS, OUTPUT_DIM)
criterion = nn.HuberLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

# --- 6. Training Loop ---
print("Starting Training...")
EPOCHS = 20

for epoch in range(EPOCHS):
    model.train()
    train_loss = 0
    for batch_X, batch_y in train_loader:
        optimizer.zero_grad()
        predictions = model(batch_X)
        loss = criterion(predictions, batch_y)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()
    
    # Validation
    model.eval()
    val_loss = 0
    with torch.no_grad():
        for batch_X, batch_y in test_loader:
            preds = model(batch_X)
            loss = criterion(preds, batch_y)
            val_loss += loss.item()
            
    if (epoch + 1) % 5 == 0:
        print(f"Epoch {epoch+1}/{EPOCHS} | Train Loss: {train_loss/len(train_loader):.4f} | Val Loss: {val_loss/len(test_loader):.4f}")

print("Training Complete. Model is ready for evaluation!")
