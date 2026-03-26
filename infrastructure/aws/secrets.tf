##############################################################################
# KMS Key for Secrets Encryption
##############################################################################

resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager - ${local.name_prefix}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${local.name_prefix}-secrets-kms"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${local.name_prefix}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

##############################################################################
# Database Credentials
##############################################################################

resource "aws_secretsmanager_secret" "db_credentials" {
  name       = "${local.name_prefix}/db-credentials"
  kms_key_id = aws_kms_key.secrets.arn

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${local.name_prefix}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = var.db_name
    engine   = "postgres"
  })
}

##############################################################################
# JWT Secret
##############################################################################

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name       = "${local.name_prefix}/jwt-secret"
  kms_key_id = aws_kms_key.secrets.arn

  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${local.name_prefix}-jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}
