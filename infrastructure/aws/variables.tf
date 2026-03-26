##############################################################################
# General
##############################################################################

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "ssp"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

##############################################################################
# Networking
##############################################################################

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

##############################################################################
# ECS / Backend
##############################################################################

variable "backend_image" {
  description = "Docker image URI for the backend container"
  type        = string
}

variable "backend_container_port" {
  description = "Port the backend container listens on"
  type        = number
  default     = 3000
}

variable "backend_cpu" {
  description = "CPU units for the backend Fargate task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (MiB) for the backend Fargate task"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 2
}

variable "backend_min_count" {
  description = "Minimum number of backend tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "backend_max_count" {
  description = "Maximum number of backend tasks for auto-scaling"
  type        = number
  default     = 6
}

variable "backend_auto_scaling_cpu_target" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70
}

##############################################################################
# RDS / Database
##############################################################################

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for the RDS instance"
  type        = number
  default     = 50
}

variable "db_max_allocated_storage" {
  description = "Maximum storage in GB for RDS auto-scaling"
  type        = number
  default     = 200
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "ssp"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "ssp_admin"
  sensitive   = true
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 14
}

variable "db_deletion_protection" {
  description = "Enable deletion protection on RDS"
  type        = bool
  default     = true
}

##############################################################################
# Domain
##############################################################################

variable "domain_name" {
  description = "Primary domain name for the application (used for ALB ACM cert, leave empty to skip)"
  type        = string
  default     = ""
}

##############################################################################
# Monitoring
##############################################################################

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  sensitive   = true
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization percentage threshold for alarms"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory utilization percentage threshold for alarms"
  type        = number
  default     = 80
}

variable "error_5xx_alarm_threshold" {
  description = "Number of 5xx errors in the evaluation period to trigger alarm"
  type        = number
  default     = 10
}
