##############################################################################
# Document Uploads Bucket
##############################################################################

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name_prefix}-uploads-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${local.name_prefix}-uploads"
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm  = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_uploads.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.domain_name != "" ? ["https://${var.domain_name}"] : ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

##############################################################################
# KMS Key for Uploads Encryption
##############################################################################

resource "aws_kms_key" "s3_uploads" {
  description             = "KMS key for S3 uploads encryption - ${local.name_prefix}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${local.name_prefix}-s3-uploads-kms"
  }
}

resource "aws_kms_alias" "s3_uploads" {
  name          = "alias/${local.name_prefix}-s3-uploads"
  target_key_id = aws_kms_key.s3_uploads.key_id
}
