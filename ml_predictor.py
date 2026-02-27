import joblib
import os
import numpy as np
import onnxruntime as ort
from transformers import BertTokenizer
import warnings
import re

warnings.filterwarnings("ignore")

class TicketPredictor:
    """
    Optimized Ticket classifier using ONNX BERT embeddings + LogisticRegression.
    Designed for low-memory distilbert(65mb) environments.
    """
    
    def __init__(self):
        print("🔄 Loading optimized AI models...")
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(base_dir, 'models')
        
        # 1. Load Scikit-Learn Models
        self.dept_model = joblib.load(os.path.join(models_dir, 'dept_model.pkl'))
        self.dept_encoder = joblib.load(os.path.join(models_dir, 'dept_encoder.pkl'))
        self.prio_model = joblib.load(os.path.join(models_dir, 'prio_model.pkl'))
        self.prio_encoder = joblib.load(os.path.join(models_dir, 'prio_encoder.pkl'))
        
        # 2. Load ONNX Runtime Session (Replaces PyTorch)
        onnx_path = os.path.join(models_dir, 'model_final.onnx')
        self.tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        
        # Limit threads to save CPU resources on free tier
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = 1
        self.ort_session = ort.InferenceSession(onnx_path, sess_options)
        
        self.departments = self.dept_encoder.classes_.tolist()
        self.priorities = self.prio_encoder.classes_.tolist()
        
        print("✅ System Ready (ONNX Engine)")

    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def get_bert_embedding(self, text, max_length=128):
        # Tokenize (returns numpy arrays directly)
        inputs = self.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="np"
        )
        
        # Prepare ONNX inputs
        onnx_inputs = {
            'input_ids': inputs['input_ids'],
            'attention_mask': inputs['attention_mask']
        }
        
        # Run inference through ONNX
        outputs = self.ort_session.run(None, onnx_inputs)
        
        # Extract [CLS] token (index 0) from last_hidden_state
        # outputs[0] is the last_hidden_state tensor
        cls_embedding = outputs[0][:, 0, :]
        return cls_embedding
    
    def predict(self, complaint_text):
        try:
            cleaned_text = self.clean_text(complaint_text)
            embedding = self.get_bert_embedding(cleaned_text)
            
            # Predict Dept
            dept_pred = self.dept_model.predict(embedding)[0]
            department = self.dept_encoder.inverse_transform([dept_pred])[0]
            
            # Predict Priority
            prio_pred = self.prio_model.predict(embedding)[0]
            priority = self.prio_encoder.inverse_transform([prio_pred])[0]
            
            return {
                'department': department,
                'priority': priority,
                'success': True
            }
        except Exception as e:
            return {
                'department': 'General Inquiry',
                'priority': 'Medium',
                'success': False,
                'error': str(e)
            }

    def get_available_categories(self):
        return {'departments': self.departments, 'priorities': self.priorities}

if __name__ == "__main__":
    predictor = TicketPredictor()
    test = "My account is locked and I need a password reset"
    print(predictor.predict(test))