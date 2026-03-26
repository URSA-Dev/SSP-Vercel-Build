# =============================================================================
# Reusable Tagging Module
# Outputs a standard set of tags for all SSP resources
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
  default     = "ssp"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "owner" {
  description = "Team or individual owning the resource"
  type        = string
  default     = "ursa-mobile"
}

variable "managed_by" {
  description = "Tool managing the resource"
  type        = string
  default     = "terraform"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "ssp-platform"
}

variable "extra_tags" {
  description = "Additional tags to merge with standard tags"
  type        = map(string)
  default     = {}
}

output "tags" {
  description = "Standard resource tags for the SSP platform"
  value = merge({
    project     = var.project
    environment = var.environment
    owner       = var.owner
    managed_by  = var.managed_by
    cost_center = var.cost_center
  }, var.extra_tags)
}
