import torch
from transformers import DistilBertModel, DistilBertTokenizer
from onnxruntime.quantization import quantize_dynamic, QuantType
import os

# 1. Export DistilBERT to ONNX
model_name = "distilbert-base-uncased"
tokenizer = DistilBertTokenizer.from_pretrained(model_name)
model = DistilBertModel.from_pretrained(model_name)

dummy_input = tokenizer("test", return_tensors="pt")
torch.onnx.export(model, (dummy_input['input_ids'], dummy_input['attention_mask']), 
                  "distilbert.onnx", opset_version=12, 
                  input_names=['input_ids', 'attention_mask'],
                  dynamic_axes={'input_ids':{0:'batch'}, 'attention_mask':{0:'batch'}})

# 2. Quantize to reach the ~60MB range
quantize_dynamic("distilbert.onnx", "models/model_final.onnx", weight_type=QuantType.QInt8)

print(f"✅ Final Model Size: {os.path.getsize('models/model_final.onnx') / (1024*1024):.2f} MB")