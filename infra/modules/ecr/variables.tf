variable "repositories" {
  description = "Map of repository names to create"
  type        = map(string)
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
