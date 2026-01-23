variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "log_groups" {
  description = "Map of log group names to create"
  type        = map(string)
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
