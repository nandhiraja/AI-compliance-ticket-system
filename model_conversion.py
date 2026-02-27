import torch
import os
from transformers import BertModel, BertTokenizer

# 1. Setup paths
save_path = "backend/models/bert_model.onnx"
os.makedirs("backend/models", exist_ok=True)

print("🔄 Loading BERT...")
model_name = "bert-base-uncased"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertModel.from_pretrained(model_name)
model.eval()

# 2. Create small dummy input (16 tokens instead of 128 saves RAM)
dummy_text = "transport to onnx"
inputs = tokenizer(dummy_text, return_tensors="pt")

print("🚀 Exporting to ONNX...")
with torch.no_grad():
    torch.onnx.export(
        model,
        (inputs['input_ids'], inputs['attention_mask']),
        save_path,
        input_names=['input_ids', 'attention_mask'],
        output_names=['last_hidden_state'],
        dynamic_axes={
            'input_ids': {0: 'batch_size', 1: 'sequence'},
            'attention_mask': {0: 'batch_size', 1: 'sequence'}
        },
        opset_version=14,
        do_constant_folding=True # This reduces final file size
    )

print(f"✅ Success! File saved at: {save_path}")