##############################################################################
# Networking
##############################################################################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

##############################################################################
# ALB
##############################################################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.backend.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB (for Route 53 alias records)"
  value       = aws_lb.backend.zone_id
}

##############################################################################
# Vercel Integration
##############################################################################

output "vercel_api_rewrite_target" {
  description = "ALB DNS name to use as Vercel API rewrite destination"
  value       = "https://${aws_lb.backend.dns_name}"
}

##############################################################################
# RDS
##############################################################################

output "rds_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "Hostname of the RDS instance"
  value       = aws_db_instance.main.address
}

##############################################################################
# S3 Buckets
##############################################################################

output "uploads_bucket_name" {
  description = "Name of the S3 bucket for document uploads"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  description = "ARN of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.arn
}

##############################################################################
# ECS
##############################################################################

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS backend service"
  value       = aws_ecs_service.backend.name
}

##############################################################################
# Secrets
##############################################################################

output "db_credentials_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

##############################################################################
# Monitoring
##############################################################################

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}
