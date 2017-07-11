PATH=/bin:/usr/bin:./vultr-cli/bin

plan:
	terraform plan

apply: root_ssh.key
	terraform apply

dns:
	dns-update.sh  

vultr-cli/terraform-provider-vultr:
	build.sh

root_ssh.key:
	ssh-keygen -t ed25519 -N '' -f root_ssh.key
	mv root_ssh.key.pub root_ssh_pub.key

