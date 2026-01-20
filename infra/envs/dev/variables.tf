variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "campmate"
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}
