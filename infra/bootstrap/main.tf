# infra/bootstrap/main.tf
provider "aws" {
  region = "ap-southeast-2"
}

# 1. The S3 Bucket to store the .tfstate file
resource "aws_s3_bucket" "terraform_state" {
  bucket = "campmate-chohan-tfstate" # Must be globally unique
  
  # Prevent accidental deletion of the state bucket
  lifecycle {
    prevent_destroy = true
  }
}

# 2. Enable versioning (Crucial for state recovery)
resource "aws_s3_bucket_versioning" "enabled" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 3. Enable encryption (Security Best Practice)
resource "aws_s3_bucket_server_side_encryption_configuration" "default" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. Block Public Access (Zero-Trust Security)
resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 5. DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "campmate-chohan-tflock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID" # This exact name and casing is required by Terraform

  attribute {
    name = "LockID"
    type = "S"
  }
}