# In terraform/eks.tf

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.10.0"

  cluster_name    = "cloud-shop-cluster"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # This is the single, correct line to grant admin permissions.
  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    main_nodes = {
      instance_types = ["t3.small"]
      min_size     = 1
      max_size     = 3
      desired_size = 2
    }
  }
}