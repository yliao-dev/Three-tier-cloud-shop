# In terraform/eks.tf

# This module creates a complete, production-ready EKS cluster.
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.10.0"

  cluster_name    = "cloud-shop-cluster"
  cluster_version = "1.29" # Use a recent, stable Kubernetes version

  # This connects the EKS cluster to the VPC we created in vpc.tf.
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets # Deploy worker nodes in private subnets for security

  # This section defines the group of EC2 instances that will be our worker nodes.
  eks_managed_node_groups = {
    # The name of our node group
    main_nodes = {
      instance_types = ["t3.small"] # Use t3.small to avoid resource issues

      min_size     = 1 # Start with 1 node
      max_size     = 3 # Allow scaling up to 3 nodes
      desired_size = 2 # Keep 2 nodes running for high availability
    }
  }
}