import joblib
import os
import torch
import numpy as np
from transformers import BertTokenizer, BertModel
import warnings
warnings.filterwarnings("ignore")

class TicketPredictor:
    """
    AI-powered ticket classifier using BERT embeddings + LogisticRegression
    Predicts department and priority from customer complaints
    """
    
    def __init__(self):
        print("🔄 Loading AI models...")
        
        # Get the directory where this file is located
        base_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(base_dir, 'models')
        
        # Load your trained LogisticRegression models and encoders
        self.dept_model = joblib.load(os.path.join(models_dir, 'dept_model.pkl'))
        self.dept_encoder = joblib.load(os.path.join(models_dir, 'dept_encoder.pkl'))
        self.prio_model = joblib.load(os.path.join(models_dir, 'prio_model.pkl'))
        self.prio_encoder = joblib.load(os.path.join(models_dir, 'prio_encoder.pkl'))
        
        # Load BERT model and tokenizer from Hugging Face
        print("🔄 Loading BERT model (this may take a moment)...")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        self.bert_model = BertModel.from_pretrained("bert-base-uncased")
        self.bert_model.to(self.device)
        self.bert_model.eval()
        
        # Store available categories
        self.departments = self.dept_encoder.classes_.tolist()
        self.priorities = self.prio_encoder.classes_.tolist()
        
        print("✅ AI models loaded successfully!")
        print(f"   Device: {self.device}")
        print(f"   Departments: {', '.join(self.departments)}")
        print(f"   Priorities: {', '.join(self.priorities)}")
    
    def clean_text(self, text):
        """Clean and preprocess text (same as training)"""
        import re
        text = text.lower()
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def get_bert_embedding(self, text, max_length=128):
        """
        Convert text to BERT embedding (same process as training)
        """
        # Tokenize
        encoded = self.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        ).to(self.device)
        
        # Get BERT embedding
        with torch.no_grad():
            output = self.bert_model(**encoded)
        
        # Extract [CLS] token embedding (first token)
        cls_embedding = output.last_hidden_state[:, 0, :].cpu().numpy()
        
        return cls_embedding
    
    def predict(self, complaint_text):
        """
        Predict department and priority from complaint text
        
        Args:
            complaint_text (str): Customer complaint description
            
        Returns:
            dict: {
                'department': str,
                'priority': str,
                'success': bool
            }
        """
        try:
            # Step 1: Clean text (same as training)
            cleaned_text = self.clean_text(complaint_text)
            
            # Step 2: Convert to BERT embedding
            embedding = self.get_bert_embedding(cleaned_text)
            
            # Step 3: Predict department
            dept_pred = self.dept_model.predict(embedding)[0]
            department = self.dept_encoder.inverse_transform([dept_pred])[0]
            
            # Step 4: Predict priority
            prio_pred = self.prio_model.predict(embedding)[0]
            priority = self.prio_encoder.inverse_transform([prio_pred])[0]
            
            return {
                'department': department,
                'priority': priority,
                'success': True
            }
            
        except Exception as e:
            print(f"⚠️ Prediction error: {e}")
            return {
                'department': 'General Inquiry',
                'priority': 'Medium',
                'success': False,
                'error': str(e)
            }
    
    def get_available_categories(self):
        """Return all possible departments and priorities"""
        return {
            'departments': self.departments,
            'priorities': self.priorities
        }


# Test the predictor if this file is run directly
if __name__ == "__main__":
    print("\n🧪 Testing Ticket Predictor with BERT...\n")
    
    predictor = TicketPredictor()
    
    # Test cases
    test_complaints = [
        "My credit card was charged twice for the same purchase",
        "I can't log into my account, forgot password",
        "The mobile app keeps crashing when I try to upload photos",
        "Someone used my account without permission",
        "I need help with a refund for my recent order"
    ]
    
    print("\n" + "="*60)
    for complaint in test_complaints:
        result = predictor.predict(complaint)
        print(f"\n📝 Complaint: {complaint}")
        print(f"   🏢 Department: {result['department']}")
        print(f"   ⚡ Priority: {result['priority']}")
        print(f"   ✅ Status: {'Success' if result['success'] else 'Failed'}")
    
    print("\n" + "="*60)
    # Show available categories
    categories = predictor.get_available_categories()
    print(f"\n📊 Available Departments: {', '.join(categories['departments'])}")
    print(f"⚡ Available Priorities: {', '.join(categories['priorities'])}")
    print()