# In terraform/vpc.tf

# This data source gets a list of all Availability Zones in the current region.
# This makes our configuration dynamic and resilient.
data "aws_availability_zones" "available" {}

# This module creates a complete, production-ready VPC.
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.9.0"

  name = "cloud-shop-vpc"
  cidr = "10.0.0.0/16" # The main IP address range for our private network

  # Create one public and one private subnet in the first two Availability Zones.
  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  # These settings are required for an EKS cluster.
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  # These tags are required by Kubernetes so it can discover the resources it needs.
  public_subnet_tags = {
    "kubernetes.io/cluster/cloud-shop-cluster" = "shared"
    "kubernetes.io/role/elb"                   = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/cloud-shop-cluster" = "shared"
    "kubernetes.io/role/internal-elb"          = "1"
  }
}