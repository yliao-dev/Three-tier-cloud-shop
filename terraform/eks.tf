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

  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    aws-ebs-csi-driver = {
      # This is the fix. It tells the module to create a dedicated IAM Role
      # for the EBS CSI Driver's service account and attach the correct policy to it.
      create_iam_role = true
    }
  }

  eks_managed_node_groups = {
    main_nodes = {
      instance_types = ["t3.small"]
      min_size     = 1
      max_size     = 3
      desired_size = 2

      # This attaches the necessary IAM policy to the worker nodes' role,
      # allowing them to create and manage EBS volumes for Redis.
      iam_role_additional_policies = {
        EBSCSIDriverPolicy = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
        # This policy allows nodes to pull images from ECR
        ECRReadOnly = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
      }
    }
  }
}