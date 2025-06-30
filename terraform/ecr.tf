# In terraform/ecr.tf

# This variable will hold the list of all services that need a container repository.
variable "service_names" {
  description = "A list of service names to create ECR repositories for."
  type        = list(string)
  default = [
    "user-service",
    "catalog-service",
    "cart-service",
    "checkout-service",
    "notification-service",
    "payment-service",
    "frontend"
  ]
}

# This resource block uses a "for_each" loop to efficiently create a repository
# for every name in the var.service_names list.
resource "aws_ecr_repository" "app_repos" {
  for_each = toset(var.service_names)

  name                 = each.key
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "cloud-shop"
    Service = each.key
  }
}