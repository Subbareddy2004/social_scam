"""
ULTRA-FAST Text Moderation Training on A100 GPU
Optimized for maximum speed with $3 budget
Expected training time: 5-8 minutes total
"""

import modal

app = modal.App("social-safe-ultra-fast")

# Optimized image with latest versions
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("unzip")  # Add unzip for extracting datasets
    .pip_install(
        "transformers==4.36.0",
        "datasets==2.16.0",
        "torch==2.1.0",
        "scikit-learn==1.3.2",
        "pandas==2.1.4",
        "kaggle==1.5.16",
        "accelerate==0.25.0",
    )
)

volume = modal.Volume.from_name("social-safe-models", create_if_missing=True)


@app.function(
    image=image,
    gpu="A100-80GB",  # MOST POWERFUL GPU - 80GB memory for maximum speed
    timeout=1800,     # 30 min timeout (more than enough)
    volumes={"/models": volume},
    secrets=[modal.Secret.from_name("kaggle-secret")],
)
def train_model_ultra_fast():
    """Ultra-optimized training - completes in 5-8 minutes"""
    
    import os
    import pandas as pd
    from sklearn.model_selection import train_test_split
    from datasets import Dataset
    from transformers import (
        RobertaTokenizer,
        RobertaForSequenceClassification,
        TrainingArguments,
        Trainer,
    )
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support
    import torch
    
    print("=" * 70)
    print("🚀 ULTRA-FAST TRAINING ON A100-80GB GPU")
    print("   Expected completion: 5-8 minutes")
    print("=" * 70)
    
    # Setup Kaggle
    print("\n⚡ Setting up Kaggle...")
    os.makedirs("/root/.kaggle", exist_ok=True)
    kaggle_username = os.environ.get("KAGGLE_USERNAME")
    kaggle_key = os.environ.get("KAGGLE_KEY")
    with open("/root/.kaggle/kaggle.json", "w") as f:
        f.write(f'{{"username":"{kaggle_username}","key":"{kaggle_key}"}}')
    os.chmod("/root/.kaggle/kaggle.json", 0o600)
    
    # Download datasets (parallel)
    print("⚡ Downloading datasets...")
    os.system("kaggle datasets download -d uciml/sms-spam-collection-dataset -q")
    os.system("kaggle datasets download -d julian3833/jigsaw-toxic-comment-classification-challenge -q")
    
    print("⚡ Extracting...")
    os.system("unzip -q sms-spam-collection-dataset.zip")
    os.system("unzip -q jigsaw-toxic-comment-classification-challenge.zip")
    
    # Load data
    print("⚡ Loading datasets...")
    sms = pd.read_csv("spam.csv", encoding="latin-1")[['v1', 'v2']]
    sms.columns = ['label', 'text']
    sms['label'] = sms['label'].map({'ham': 0, 'spam': 1})
    
    toxic = pd.read_csv("train.csv")
    toxic['label'] = toxic[['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']].max(axis=1)
    toxic = toxic[['comment_text', 'label']].rename(columns={'comment_text': 'text'})
    
    df = pd.concat([sms, toxic]).dropna()
    print(f"✅ Total samples: {len(df):,}")
    
    # Split
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
    train_dataset = Dataset.from_pandas(train_df)
    test_dataset = Dataset.from_pandas(test_df)
    
    # Tokenize
    print("⚡ Tokenizing (using all CPU cores)...")
    tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
    
    def tokenize(example):
        return tokenizer(example["text"], padding="max_length", truncation=True, max_length=128)
    
    # Use all CPU cores for tokenization
    train_dataset = train_dataset.map(tokenize, batched=True, num_proc=os.cpu_count())
    test_dataset = test_dataset.map(tokenize, batched=True, num_proc=os.cpu_count())
    
    train_dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])
    test_dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])
    
    # Load model
    print("⚡ Loading model to GPU...")
    model = RobertaForSequenceClassification.from_pretrained("roberta-base", num_labels=2)
    
    # Metrics
    def compute_metrics(pred):
        labels = pred.label_ids
        preds = pred.predictions.argmax(-1)
        precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average="binary")
        acc = accuracy_score(labels, preds)
        return {"accuracy": acc, "f1": f1, "precision": precision, "recall": recall}
    
    # ULTRA-OPTIMIZED Training Args
    print("\n" + "=" * 70)
    print("🔥 TRAINING CONFIGURATION (OPTIMIZED FOR SPEED)")
    print("=" * 70)
    print("GPU:        A100-80GB (most powerful available)")
    print("Batch Size: 128 (4x larger than standard)")
    print("Precision:  FP16 Mixed Precision (2x faster)")
    print("Workers:    8 parallel data loaders")
    print("Epochs:     3 (for high accuracy)")
    print("=" * 70)
    
    training_args = TrainingArguments(
        output_dir="/tmp/results",
        learning_rate=3e-5,                    # Slightly higher for faster convergence
        per_device_train_batch_size=128,       # MASSIVE batch size (A100 can handle it)
        per_device_eval_batch_size=128,        # Fast evaluation
        num_train_epochs=3,                    # 3 epochs for excellent accuracy
        weight_decay=0.01,
        evaluation_strategy="epoch",           # Fixed: use evaluation_strategy instead of eval_strategy
        save_strategy="epoch",
        logging_steps=20,                      # Frequent progress updates
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        fp16=True,                             # Mixed precision = 2x speed
        dataloader_num_workers=8,              # Parallel data loading
        gradient_accumulation_steps=1,
        dataloader_pin_memory=True,            # Faster GPU transfer
        remove_unused_columns=True,
        report_to="none",                      # No wandb/tensorboard overhead
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics
    )
    
    print("\n🔥 TRAINING STARTED...")
    print("=" * 70)
    
    import time
    start_time = time.time()
    
    trainer.train()
    
    training_time = (time.time() - start_time) / 60
    
    print("\n" + "=" * 70)
    print(f"✅ TRAINING COMPLETE in {training_time:.1f} minutes")
    print("=" * 70)
    
    # Evaluate
    print("\n📊 Evaluating...")
    eval_results = trainer.evaluate()
    
    print("\n" + "=" * 70)
    print("📈 FINAL RESULTS")
    print("=" * 70)
    print(f"Accuracy:  {eval_results['eval_accuracy']:.4f} ({eval_results['eval_accuracy']*100:.2f}%)")
    print(f"F1 Score:  {eval_results['eval_f1']:.4f}")
    print(f"Precision: {eval_results['eval_precision']:.4f}")
    print(f"Recall:    {eval_results['eval_recall']:.4f}")
    print("=" * 70)
    
    # Test predictions
    print("\n🧪 Testing predictions...")
    def predict(text):
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        inputs = {k: v.cuda() for k, v in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        prob = probs.cpu().detach().numpy()[0]
        return ("Spam / Scam", prob[1]) if prob[1] > 0.6 else ("Safe", prob[0])
    
    tests = [
        "Click this link and win ₹5000",
        "Nice picture!",
        "You won a lottery! Call now!",
        "Hey, how are you?",
        "F*** you, idiot!",
        "Have a great day!"
    ]
    
    for text in tests:
        label, conf = predict(text)
        print(f"  '{text[:40]}...' → {label} ({conf:.3f})")
    
    # Save
    print("\n💾 Saving model...")
    model.save_pretrained("text_moderation_model")
    tokenizer.save_pretrained("text_moderation_model")
    
    # Create zip using Python instead of shell command
    import zipfile
    
    print("📦 Creating zip file...")
    with zipfile.ZipFile("text_moderation_model.zip", 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("text_moderation_model"):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, ".")
                zipf.write(file_path, arcname)
    
    # Copy to persistent volume
    os.system("cp -r text_moderation_model /models/")
    os.system("cp text_moderation_model.zip /models/")
    
    with open("text_moderation_model.zip", "rb") as f:
        zip_data = f.read()
    
    file_size_mb = len(zip_data) / (1024 * 1024)
    
    print(f"✅ Model saved ({file_size_mb:.2f} MB)")
    
    # Calculate cost
    cost_per_hour = 3.00  # A100-80GB cost
    total_cost = (training_time / 60) * cost_per_hour
    
    print("\n" + "=" * 70)
    print("💰 COST BREAKDOWN")
    print("=" * 70)
    print(f"Training time:  {training_time:.1f} minutes")
    print(f"GPU cost:       ${cost_per_hour:.2f}/hour (A100-80GB)")
    print(f"Total cost:     ${total_cost:.2f}")
    print(f"Remaining:      ${3.00 - total_cost:.2f} (from $3 budget)")
    print("=" * 70)
    
    return {
        "eval_results": eval_results,
        "zip_data": zip_data,
        "file_size_mb": file_size_mb,
        "training_time_minutes": training_time,
        "cost": total_cost
    }


@app.local_entrypoint()
def main():
    """Run ultra-fast training"""
    
    print("\n" + "=" * 70)
    print("   ⚡ ULTRA-FAST TRAINING MODE ⚡")
    print("   GPU: A100-80GB (Most Powerful)")
    print("   Expected Time: 5-8 minutes")
    print("   Budget: $3.00")
    print("=" * 70)
    
    import time
    total_start = time.time()
    
    result = train_model_ultra_fast.remote()
    
    total_time = (time.time() - total_start) / 60
    
    # Save model
    with open("text_moderation_model.zip", "wb") as f:
        f.write(result["zip_data"])
    
    print("\n" + "=" * 70)
    print("🎉 SUCCESS!")
    print("=" * 70)
    print(f"📁 File:          text_moderation_model.zip")
    print(f"📦 Size:          {result['file_size_mb']:.2f} MB")
    print(f"⏱️  Training time: {result['training_time_minutes']:.1f} minutes")
    print(f"⏱️  Total time:    {total_time:.1f} minutes")
    print(f"💰 Cost:          ${result['cost']:.2f}")
    print(f"🎯 Accuracy:      {result['eval_results']['eval_accuracy']:.4f}")
    print(f"🎯 F1 Score:      {result['eval_results']['eval_f1']:.4f}")
    print("=" * 70)
    print("\n✨ Model ready to use!")